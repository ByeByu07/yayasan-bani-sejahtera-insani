import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { approval, request, transactionCategory, user, transaction, inventoryMovement, inventoryItem, requestItem } from '@/drizzle/schema';
import { eq, and, or, inArray, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Fetch approvals based on user's role
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

    // Get user's active role using better-auth organization plugin
    const { role } = await auth.api.getActiveMemberRole({
      headers: await headers(),
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'No active role found' },
        { status: 403 }
      );
    }

    // Determine which approvals to fetch based on role
    let approvalsData: any[] = [];

    if (role === 'BENDAHARA' || role === 'SEKRETARIS') {
      // Level 1 approvers: see their pending approvals at level 1
      approvalsData = await db
        .select({
          approvalId: approval.id,
          approvalLevel: approval.approvalLevel,
          roleName: approval.roleName,
          approvalStatus: approval.status,
          comments: approval.comments,
          timeoutAt: approval.timeoutAt,
          createdAt: approval.createdAt,
          // Request data
          requestId: request.id,
          requestCode: request.requestCode,
          requestType: request.requestType,
          transactionSubtype: request.transactionSubtype,
          amount: request.amount,
          description: request.description,
          justification: request.justification,
          requestStatus: request.status,
          priority: request.priority,
          neededByDate: request.neededByDate,
          requestCreatedAt: request.createdAt,
          // Category
          categoryName: transactionCategory.name,
          // Requester
          requesterName: user.name,
          requesterEmail: user.email,
        })
        .from(approval)
        .innerJoin(request, eq(approval.requestId, request.id))
        .leftJoin(transactionCategory, eq(request.expenseCategoryId, transactionCategory.id))
        .leftJoin(user, eq(request.requesterUserId, user.id))
        .where(
          and(
            eq(approval.roleName, role),
            eq(approval.status, 'PENDING'),
            eq(approval.approvalLevel, 1)
          )
        );
    } else if (role === 'KETUA' || role === 'owner') {
      // KETUA can have approvals at level 1 OR level 2 depending on request type:
      // - INVENTORY/PROCUREMENT: KETUA at level 1 (no prerequisites)
      // - TRANSACTION: KETUA at level 2 (needs BENDAHARA level 1 first)

      // Get all KETUA pending approvals
      const ketuaPendingApprovals = await db
        .select({
          id: approval.id,
          requestId: approval.requestId,
          approvalLevel: approval.approvalLevel,
        })
        .from(approval)
        .where(
          and(
            eq(approval.roleName, 'KETUA'),
            eq(approval.status, 'PENDING')
          )
        );

      // Separate level 1 and level 2 approvals
      const level1Approvals = ketuaPendingApprovals.filter(a => a.approvalLevel === 1);
      const level2Approvals = ketuaPendingApprovals.filter(a => a.approvalLevel === 2);

      let eligibleRequestIds: string[] = [];

      // Level 1 KETUA approvals are always eligible (INVENTORY/PROCUREMENT)
      eligibleRequestIds = level1Approvals.map(a => a.requestId);

      // For level 2 KETUA approvals, check if level 1 is approved (TRANSACTION)
      if (level2Approvals.length > 0) {
        const level2RequestIds = level2Approvals.map(a => a.requestId);

        const level1ApprovedRequests = await db
          .select({
            requestId: approval.requestId,
          })
          .from(approval)
          .where(
            and(
              inArray(approval.requestId, level2RequestIds),
              eq(approval.approvalLevel, 1),
              eq(approval.status, 'APPROVED')
            )
          );

        // Add level 2 requests where level 1 is approved
        eligibleRequestIds.push(...level1ApprovedRequests.map(a => a.requestId));
      }

      // Fetch full approval data for eligible requests
      if (eligibleRequestIds.length > 0) {
        approvalsData = await db
          .select({
            approvalId: approval.id,
            approvalLevel: approval.approvalLevel,
            roleName: approval.roleName,
            approvalStatus: approval.status,
            comments: approval.comments,
            timeoutAt: approval.timeoutAt,
            createdAt: approval.createdAt,
            // Request data
            requestId: request.id,
            requestCode: request.requestCode,
            requestType: request.requestType,
            transactionSubtype: request.transactionSubtype,
            amount: request.amount,
            description: request.description,
            justification: request.justification,
            requestStatus: request.status,
            priority: request.priority,
            neededByDate: request.neededByDate,
            requestCreatedAt: request.createdAt,
            // Category
            categoryName: transactionCategory.name,
            // Requester
            requesterName: user.name,
            requesterEmail: user.email,
          })
          .from(approval)
          .innerJoin(request, eq(approval.requestId, request.id))
          .leftJoin(transactionCategory, eq(request.expenseCategoryId, transactionCategory.id))
          .leftJoin(user, eq(request.requesterUserId, user.id))
          .where(
            and(
              eq(approval.roleName, 'KETUA'),
              eq(approval.status, 'PENDING'),
              inArray(approval.requestId, eligibleRequestIds)
            )
          );
      }
    }

    // Fetch request items for all approvals
    const requestIds = approvalsData.map(a => a.requestId);
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

    // Group items by requestId
    const itemsByRequest = items.reduce((acc, item) => {
      if (!acc[item.requestId]) {
        acc[item.requestId] = [];
      }
      acc[item.requestId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Add items to approval data
    const approvalsWithItems = approvalsData.map(appr => ({
      ...appr,
      items: itemsByRequest[appr.requestId] || [],
    }));

    return NextResponse.json({
      success: true,
      data: approvalsWithItems,
      userRole: role,
    });
  } catch (error) {
    console.error('Failed to fetch approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

// POST - Approve or Reject an approval
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

    // Get user's active role
    const { role } = await auth.api.getActiveMemberRole({
      headers: await headers(),
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'No active role found' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { approvalId, action, comments } = body;

    if (!approvalId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the approval record
    const approvalRecord = await db
      .select()
      .from(approval)
      .where(eq(approval.id, approvalId))
      .limit(1);

    if (approvalRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      );
    }

    const appr = approvalRecord[0];

    // Check if user has permission to approve this
    if (appr.roleName !== role && role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to approve this request' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (appr.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'This approval has already been processed' },
        { status: 400 }
      );
    }

    // For Level 2, check if Level 1 is approved
    if (appr.approvalLevel === 2) {
      const level1 = await db
        .select()
        .from(approval)
        .where(
          and(
            eq(approval.requestId, appr.requestId),
            eq(approval.approvalLevel, 1)
          )
        )
        .limit(1);

      if (level1.length === 0 || level1[0].status !== 'APPROVED') {
        return NextResponse.json(
          { success: false, error: 'Level 1 approval must be completed first' },
          { status: 400 }
        );
      }
    }

    // Update approval
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await db
      .update(approval)
      .set({
        status: newStatus,
        approverUserId: session.user.id,
        approvedAt: new Date(),
        comments: comments || null,
      })
      .where(eq(approval.id, approvalId));

    // If all approvals are complete, update request status and execute business logic
    if (action === 'APPROVE') {
      const allApprovals = await db
        .select()
        .from(approval)
        .where(eq(approval.requestId, appr.requestId));

      const allApproved = allApprovals.every(a => a.status === 'APPROVED');

      if (allApproved) {
        // Get the full request details
        const requestData = await db
          .select()
          .from(request)
          .where(eq(request.id, appr.requestId))
          .limit(1);

        if (requestData.length === 0) {
          throw new Error('Request not found');
        }

        const req = requestData[0];

        // Update request status
        await db
          .update(request)
          .set({
            status: 'APPROVED',
            updatedAt: new Date(),
          })
          .where(eq(request.id, appr.requestId));

        // Execute business logic based on request type
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        if (req.requestType === 'TRANSACTION') {
          // Create transaction based on subtype
          const todayTransactions = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(transaction)
            .where(sql`DATE(${transaction.createdAt}) = CURRENT_DATE`);

          const sequence = ((todayTransactions[0]?.count || 0) + 1).toString().padStart(3, '0');
          const transactionCode = `TRX-${dateStr}-${sequence}`;

          // Map transaction subtype to transaction type
          let transactionType = 'EXPENSE'; // default
          if (req.transactionSubtype === 'REVENUE') {
            transactionType = 'REVENUE';
          } else if (req.transactionSubtype === 'CAPITAL_INJECTION') {
            transactionType = 'CAPITAL_INJECTION';
          }

          await db.insert(transaction).values({
            transactionCode,
            transactionType,
            categoryId: req.expenseCategoryId || null, // CAPITAL_INJECTION doesn't need category
            amount: req.amount,
            transactionDate: today.toISOString().split('T')[0],
            referenceType: 'REQUEST',
            referenceId: req.id,
            description: req.description,
            createdByUserId: session.user.id,
          });

        } else if (req.requestType === 'INVENTORY') {
          // Get request items for inventory movement
          const items = await db
            .select()
            .from(requestItem)
            .where(eq(requestItem.requestId, req.id));

          for (const item of items) {
            if (!item.inventoryItemId) continue;

            // Determine movement type from quantity (negative = OUT, positive = IN)
            const movementType = item.quantity < 0 ? 'OUT' : 'IN';
            const absQuantity = Math.abs(item.quantity);

            // Create inventory movement
            await db.insert(inventoryMovement).values({
              inventoryItemId: item.inventoryItemId,
              movementType,
              quantity: item.quantity, // Keep as negative for OUT
              unitCost: item.unitPrice,
              referenceType: 'REQUEST',
              referenceId: req.id,
              performedByUserId: session.user.id,
              notes: req.description,
              movementDate: new Date(),
            });

            // Update inventory quantity
            await db
              .update(inventoryItem)
              .set({
                quantityOnHand: sql`${inventoryItem.quantityOnHand} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(inventoryItem.id, item.inventoryItemId));
          }

        } else if (req.requestType === 'PROCUREMENT') {
          // Create expense transaction for procurement
          const todayTransactions = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(transaction)
            .where(sql`DATE(${transaction.createdAt}) = CURRENT_DATE`);

          const sequence = ((todayTransactions[0]?.count || 0) + 1).toString().padStart(3, '0');
          const transactionCode = `TRX-${dateStr}-${sequence}`;

          const newTransaction = await db.insert(transaction).values({
            transactionCode,
            transactionType: 'EXPENSE',
            categoryId: req.expenseCategoryId,
            amount: req.amount,
            transactionDate: today.toISOString().split('T')[0],
            referenceType: 'REQUEST',
            referenceId: req.id,
            description: `Pengadaan: ${req.description}`,
            createdByUserId: session.user.id,
          }).returning();

          // Get request items for procurement
          const items = await db
            .select()
            .from(requestItem)
            .where(eq(requestItem.requestId, req.id));

          // Create inventory movements for procured items
          for (const item of items) {
            let targetInventoryItemId = item.inventoryItemId;

            // If item is NOT linked to existing inventory, create a new inventory item
            if (!item.inventoryItemId) {
              // Generate itemCode for new inventory item
              const todayInventoryItems = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(inventoryItem)
                .where(sql`DATE(${inventoryItem.createdAt}) = CURRENT_DATE`);

              const sequence = ((todayInventoryItems[0]?.count || 0) + 1).toString().padStart(3, '0');
              const itemCode = `INV-${dateStr}-${sequence}`;

              // Extract category from specifications or default to GENERAL
              // Expected format in specifications: "category:MEDICAL_SUPPLIES" or just use GENERAL
              let category = 'GENERAL';
              if (item.specifications && item.specifications.includes('category:')) {
                const categoryMatch = item.specifications.match(/category:(\w+)/);
                if (categoryMatch) {
                  category = categoryMatch[1];
                }
              }

              // Create new inventory item
              const newInventoryItem = await db.insert(inventoryItem).values({
                itemCode,
                name: item.itemName,
                category: category,
                unit: item.unit,
                quantityOnHand: 0, // Will be updated by movement
                minimumStock: 0, // Default, can be updated later
                averageUnitCost: item.unitPrice,
                isActive: true,
              }).returning();

              targetInventoryItemId = newInventoryItem[0].id;
            }

            // Create inventory movement
            await db.insert(inventoryMovement).values({
              inventoryItemId: targetInventoryItemId!,
              movementType: 'IN',
              quantity: item.quantity,
              unitCost: item.unitPrice,
              referenceType: 'REQUEST',
              referenceId: req.id,
              performedByUserId: session.user.id,
              notes: `Procurement: ${item.itemName}`,
              movementDate: new Date(),
            });

            // Update inventory quantity (and recalculate average cost for existing items)
            const currentItem = await db
              .select()
              .from(inventoryItem)
              .where(eq(inventoryItem.id, targetInventoryItemId!))
              .limit(1);

            if (currentItem.length > 0) {
              const current = currentItem[0];
              const oldQuantity = current.quantityOnHand;
              const oldAvgCost = parseFloat(current.averageUnitCost);
              const newQuantity = oldQuantity + item.quantity;

              // Calculate weighted average cost
              const newAvgCost = oldQuantity === 0
                ? parseFloat(item.unitPrice)
                : ((oldQuantity * oldAvgCost) + (item.quantity * parseFloat(item.unitPrice))) / newQuantity;

              await db
                .update(inventoryItem)
                .set({
                  quantityOnHand: newQuantity,
                  averageUnitCost: newAvgCost.toString(),
                  updatedAt: new Date(),
                })
                .where(eq(inventoryItem.id, targetInventoryItemId!));
            }
          }
        }
      }
    } else {
      // If rejected, update request status to REJECTED
      await db
        .update(request)
        .set({
          status: 'REJECTED',
          updatedAt: new Date(),
        })
        .where(eq(request.id, appr.requestId));
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
