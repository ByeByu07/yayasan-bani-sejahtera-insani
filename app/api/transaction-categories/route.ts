import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactionCategory } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type'); // REVENUE or EXPENSE

    const conditions = [eq(transactionCategory.isActive, true)];

    if (type) {
      conditions.push(eq(transactionCategory.type, type));
    }

    const categories = await db
      .select()
      .from(transactionCategory)
      .where(and(...conditions))
      .orderBy(transactionCategory.name);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
