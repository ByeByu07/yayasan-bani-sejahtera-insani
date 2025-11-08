import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transaction, transactionCategory, user } from '@/drizzle/schema';
import { eq, desc, and, gte, lte, or, like, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Fetch transactions with filters
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
    const type = searchParams.get('type'); // CAPITAL_INJECTION, REVENUE, EXPENSE
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build query conditions
    const conditions = [];

    if (type) {
      conditions.push(eq(transaction.transactionType, type));
    }

    if (categoryId) {
      conditions.push(eq(transaction.categoryId, categoryId));
    }

    if (startDate) {
      conditions.push(gte(transaction.transactionDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(transaction.transactionDate, endDate));
    }

    if (search) {
      conditions.push(
        or(
          like(transaction.transactionCode, `%${search}%`),
          like(transaction.description, `%${search}%`)
        )!
      );
    }

    // Fetch transactions with category and creator info
    const transactions = await db
      .select({
        id: transaction.id,
        transactionCode: transaction.transactionCode,
        transactionType: transaction.transactionType,
        categoryId: transaction.categoryId,
        categoryName: transactionCategory.name,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
        description: transaction.description,
        proofDocumentUrl: transaction.proofDocumentUrl,
        createdByUserId: transaction.createdByUserId,
        creatorName: user.name,
        creatorEmail: user.email,
        createdAt: transaction.createdAt,
      })
      .from(transaction)
      .leftJoin(transactionCategory, eq(transaction.categoryId, transactionCategory.id))
      .leftJoin(user, eq(transaction.createdByUserId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transaction.transactionDate), desc(transaction.createdAt));

    // Fetch all categories for filter
    const categories = await db
      .select({
        id: transactionCategory.id,
        name: transactionCategory.name,
        type: transactionCategory.type,
        code: transactionCategory.code,
      })
      .from(transactionCategory)
      .where(eq(transactionCategory.isActive, true));

    // Calculate summary statistics
    const summary = await db
      .select({
        type: transaction.transactionType,
        total: sql<string>`SUM(${transaction.amount})`,
      })
      .from(transaction)
      .groupBy(transaction.transactionType);

    return NextResponse.json({
      success: true,
      data: transactions,
      categories,
      summary,
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
