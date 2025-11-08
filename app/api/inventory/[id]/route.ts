import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryItem } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// PATCH - Update inventory item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      category,
      unit,
      quantityOnHand,
      minimumStock,
      averageUnitCost,
      isActive
    } = body;

    // Check if item exists
    const existingItem = await db
      .select()
      .from(inventoryItem)
      .where(eq(inventoryItem.id, id))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Update inventory item (excluding itemCode as it should not be changed)
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (unit !== undefined) updateData.unit = unit;
    if (quantityOnHand !== undefined) updateData.quantityOnHand = quantityOnHand;
    if (minimumStock !== undefined) updateData.minimumStock = minimumStock;
    if (averageUnitCost !== undefined) updateData.averageUnitCost = averageUnitCost;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedItem = await db
      .update(inventoryItem)
      .set(updateData)
      .where(eq(inventoryItem.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedItem[0],
    });
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// GET - Get single inventory item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const item = await db
      .select()
      .from(inventoryItem)
      .where(eq(inventoryItem.id, id))
      .limit(1);

    if (item.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item[0],
    });
  } catch (error) {
    console.error('Failed to fetch inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}
