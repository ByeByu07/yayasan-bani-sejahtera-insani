import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryItem } from '@/drizzle/schema';
import { eq, desc, and, or, like, sql, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuditLogger, AuditResourceType, AuditSeverity } from '@/lib/audit-logger';

// GET - Fetch inventory items with filters
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

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const lowStock = searchParams.get('lowStock');
    const search = searchParams.get('search');

    // Build query conditions
    const conditions = [];

    if (category && category !== 'all') {
      conditions.push(eq(inventoryItem.category, category));
    }

    if (isActive !== null && isActive !== undefined && isActive !== 'all') {
      conditions.push(eq(inventoryItem.isActive, isActive === 'true'));
    }

    if (lowStock === 'true') {
      conditions.push(sql`${inventoryItem.quantityOnHand} < ${inventoryItem.minimumStock}`);
    }

    if (search) {
      conditions.push(
        or(
          like(inventoryItem.itemCode, `%${search}%`),
          like(inventoryItem.name, `%${search}%`)
        )!
      );
    }

    // Fetch inventory items
    const items = await db
      .select({
        id: inventoryItem.id,
        itemCode: inventoryItem.itemCode,
        name: inventoryItem.name,
        category: inventoryItem.category,
        unit: inventoryItem.unit,
        quantityOnHand: inventoryItem.quantityOnHand,
        minimumStock: inventoryItem.minimumStock,
        averageUnitCost: inventoryItem.averageUnitCost,
        isActive: inventoryItem.isActive,
        createdAt: inventoryItem.createdAt,
        updatedAt: inventoryItem.updatedAt,
      })
      .from(inventoryItem)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(inventoryItem.name);

    // Calculate statistics
    const stats = await db
      .select({
        category: inventoryItem.category,
        count: sql<number>`count(*)::int`,
        totalValue: sql<string>`SUM(${inventoryItem.quantityOnHand} * ${inventoryItem.averageUnitCost})`,
      })
      .from(inventoryItem)
      .where(eq(inventoryItem.isActive, true))
      .groupBy(inventoryItem.category);

    // Count low stock items
    const lowStockCount = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(inventoryItem)
      .where(
        and(
          eq(inventoryItem.isActive, true),
          sql`${inventoryItem.quantityOnHand} < ${inventoryItem.minimumStock}`
        )
      );

    return NextResponse.json({
      success: true,
      data: items,
      stats,
      lowStockCount: lowStockCount[0]?.count || 0,
    });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new inventory item
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
      itemCode,
      name,
      category,
      unit,
      quantityOnHand,
      minimumStock,
      averageUnitCost,
      isActive
    } = body;

    // Validate required fields
    if (!itemCode || !name || !category || !unit) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if item code already exists
    const existingItem = await db
      .select()
      .from(inventoryItem)
      .where(eq(inventoryItem.itemCode, itemCode))
      .limit(1);

    if (existingItem.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Item code already exists' },
        { status: 409 }
      );
    }

    // Create new inventory item
    const newItem = await db
      .insert(inventoryItem)
      .values({
        itemCode,
        name,
        category,
        unit,
        quantityOnHand: quantityOnHand || 0,
        minimumStock: minimumStock || 0,
        averageUnitCost: averageUnitCost || '0',
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    // Log audit
    await AuditLogger.log({
      userId: session.user.id,
      organizationId: session.session.activeOrganizationId,
      resourceType: AuditResourceType.INVENTORY,
      resourceId: newItem[0].id,
      action: 'CREATE (Tambah Inventaris)',
      severity: AuditSeverity.INFO,
      description: `Inventaris yang dibuat: ${newItem[0].name}`,
      metadata: {
        itemCode: newItem[0].itemCode,
        name: newItem[0].name,
        category: newItem[0].category,
        unit: newItem[0].unit,
        quantityOnHand: newItem[0].quantityOnHand,
        minimumStock: newItem[0].minimumStock,
        averageUnitCost: newItem[0].averageUnitCost,
        isActive: newItem[0].isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: newItem[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
