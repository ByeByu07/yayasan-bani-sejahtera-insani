import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { request, transactionCategory, user, approval, requestItem, inventoryItem } from '@/drizzle/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Fetch all requests for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch requests for the current user
    const requests = await db
      .select({
        id: request.id,
        requestCode: request.requestCode,
        requestType: request.requestType,
        transactionSubtype: request.transactionSubtype,
        amount: request.amount,
        description: request.description,
        justification: request.justification,
        status: request.status,
        priority: request.priority,
        neededByDate: request.neededByDate,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        categoryName: transactionCategory.name,
        requesterName: user.name,
      })
      .from(request)
      .leftJoin(transactionCategory, eq(request.expenseCategoryId, transactionCategory.id))
      .leftJoin(user, eq(request.requesterUserId, user.id))
      .where(eq(request.requesterUserId, session.user.id))
      .orderBy(desc(request.createdAt));

    // Fetch approvals for each request
    const requestIds = requests.map(r => r.id);

    const approvals = requestIds.length > 0
      ? await db
        .select({
          requestId: approval.requestId,
          approvalLevel: approval.approvalLevel,
          roleName: approval.roleName,
          approverUserId: approval.approverUserId,
          approverName: user.name,
          status: approval.status,
          comments: approval.comments,
          approvedAt: approval.approvedAt,
          timeoutAt: approval.timeoutAt,
        })
        .from(approval)
        .leftJoin(user, eq(approval.approverUserId, user.id))
        .where(inArray(approval.requestId, requestIds))
        .orderBy(approval.approvalLevel)
      : [];

    // Fetch request items for each request
    const items = requestIds.length > 0
      ? await db
        .select({
          id: requestItem.id,
          requestId: requestItem.requestId,
          inventoryItemId: requestItem.inventoryItemId,
          itemName: requestItem.itemName,
          quantity: requestItem.quantity,
          unit: requestItem.unit,
          unitPrice: requestItem.unitPrice,
          totalPrice: requestItem.totalPrice,
          specifications: requestItem.specifications,
        })
        .from(requestItem)
        .where(inArray(requestItem.requestId, requestIds))
      : [];

    // Group approvals by requestId
    const approvalsByRequest = approvals.reduce((acc, appr) => {
      if (!acc[appr.requestId]) {
        acc[appr.requestId] = [];
      }
      acc[appr.requestId].push(appr);
      return acc;
    }, {} as Record<string, typeof approvals>);

    // Group items by requestId
    const itemsByRequest = items.reduce((acc, item) => {
      if (!acc[item.requestId]) {
        acc[item.requestId] = [];
      }
      acc[item.requestId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Combine requests with their approvals and items
    const requestsWithDetails = requests.map(req => ({
      ...req,
      approvals: approvalsByRequest[req.id] || [],
      items: itemsByRequest[req.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: requestsWithDetails,
    });
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST - Create new request
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      requestType,
      transactionSubtype, // For TRANSACTION type
      expenseCategoryId,
      amount,
      description,
      justification,
      priority,
      neededByDate,
      // For INVENTORY
      inventoryItemId,
      movementType,
      quantity,
      // For PROCUREMENT
      items,
    } = body;

    // Validate required fields
    if (!requestType || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (requestType === 'INVENTORY') {
      if (!inventoryItemId || !movementType || !quantity) {
        return NextResponse.json(
          { success: false, error: 'INVENTORY request requires inventoryItemId, movementType, and quantity' },
          { status: 400 }
        );
      }
    }

    if (requestType === 'PROCUREMENT') {
      if (!items || items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'PROCUREMENT request requires at least one item' },
          { status: 400 }
        );
      }
    }

    // Generate request code
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Get count of requests today for sequence number
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const todayRequests = await db
      .select({ count: request.id })
      .from(request)
      .where(
        and(
          eq(request.requesterUserId, session.user.id)
        )
      );

    const sequence = (todayRequests.length + 1).toString().padStart(3, '0');
    const requestCode = `REQ-${dateStr}-${sequence}`;

    // Create request
    const newRequest = await db
      .insert(request)
      .values({
        requestCode,
        requestType,
        requesterUserId: session.user.id,
        transactionSubtype: transactionSubtype || null,
        expenseCategoryId: expenseCategoryId || null,
        amount: amount || '0',
        description,
        justification: justification || null,
        priority: priority || 'MEDIUM',
        neededByDate: neededByDate || null,
        status: 'PENDING',
      })
      .returning();

    const requestId = newRequest[0].id;

    // For INVENTORY requests, store the inventory-specific data in description/metadata
    // We'll retrieve this when processing the approval
    if (requestType === 'INVENTORY') {
      // Get inventory item details for better description
      const item = await db
        .select()
        .from(inventoryItem)
        .where(eq(inventoryItem.id, inventoryItemId))
        .limit(1);

      if (item.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Inventory item not found' },
          { status: 404 }
        );
      }

      // Create a request item to track the inventory movement details
      await db.insert(requestItem).values({
        requestId,
        inventoryItemId,
        itemName: item[0].name,
        quantity: movementType === 'OUT' ? -quantity : quantity, // Negative for OUT
        unit: item[0].unit,
        unitPrice: item[0].averageUnitCost,
        totalPrice: (parseFloat(item[0].averageUnitCost) * quantity).toString(),
        specifications: `Movement Type: ${movementType}`,
      });
    }

    // For PROCUREMENT requests, store the items
    if (requestType === 'PROCUREMENT' && items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        requestId,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        specifications: item.specifications || null,
        inventoryItemId: item.inventoryItemId || null, // Link to existing inventory item if provided
      }));

      await db.insert(requestItem).values(itemsToInsert);
    }

    // Create approval records based on request type
    // Calculate timeout (7 days from now)
    const timeoutDate = new Date();
    timeoutDate.setDate(timeoutDate.getDate() + 7);

    // const { role } = await auth.api.getActiveMemberRole({
    //   headers: await headers(),
    // });

    if (requestType === 'TRANSACTION') {
      // TRANSACTION requires BENDAHARA (level 1) and KETUA (level 2) approval
      await db.insert(approval).values([
        {
          requestId,
          approvalLevel: 1,
          roleName: 'BENDAHARA',
          status: 'PENDING',
          timeoutAt: timeoutDate,
        },
        {
          requestId,
          approvalLevel: 2,
          roleName: 'KETUA',
          status: 'PENDING',
          timeoutAt: timeoutDate,
        },
      ]);
    } else if (requestType === 'INVENTORY') {
      // INVENTORY requires only KETUA approval (single level)
      await db.insert(approval).values({
        requestId,
        approvalLevel: 1,
        roleName: 'KETUA',
        status: 'PENDING',
        timeoutAt: timeoutDate,
      });
    } else if (requestType === 'PROCUREMENT') {
      // PROCUREMENT requires only KETUA approval (single level)
      await db.insert(approval).values({
        requestId,
        approvalLevel: 1,
        roleName: 'KETUA',
        status: 'PENDING',
        timeoutAt: timeoutDate,
      });
    }

    return NextResponse.json({
      success: true,
      data: newRequest[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
