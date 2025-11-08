import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transaction, transactionCategory } from '@/drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

const categoryColors: Record<string, string> = {
  FOOD: '#22c55e',
  MEDICAL_SUPPLIES: '#3b82f6',
  SALARIES: '#f59e0b',
  OPERATIONAL: '#a855f7',
  UTILITIES: '#ef4444',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupBy = searchParams.get('groupBy') || 'category'; // 'category' or 'month'
    const selectedMonth = searchParams.get('month'); // optional filter (format: YYYY-MM)
    const selectedCategory = searchParams.get('category'); // optional filter

    // Build WHERE conditions
    const conditions = [
      eq(transaction.transactionType, 'EXPENSE') // Only show expenses
    ];

    // Filter by month if provided
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]; // Last day of month

      conditions.push(
        gte(transaction.transactionDate, startDate),
        lte(transaction.transactionDate, endDate)
      );
    }

    // Filter by category if provided
    if (selectedCategory) {
      const categoryResult = await db
        .select({ id: transactionCategory.id })
        .from(transactionCategory)
        .where(eq(transactionCategory.name, selectedCategory))
        .limit(1);

      if (categoryResult.length > 0) {
        conditions.push(eq(transaction.categoryId, categoryResult[0].id));
      }
    }

    // Query transactions with category join
    const transactions = await db
      .select({
        categoryName: transactionCategory.name,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
      })
      .from(transaction)
      .leftJoin(transactionCategory, eq(transaction.categoryId, transactionCategory.id))
      .where(and(...conditions));

    // Group data
    let chartData: Array<{ name: string; value: number; fill: string }> = [];

    if (groupBy === 'category') {
      // Group by category
      const grouped = transactions.reduce((acc, t) => {
        const categoryName = t.categoryName || 'UNCATEGORIZED';
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += parseFloat(t.amount || '0');
        return acc;
      }, {} as Record<string, number>);

      chartData = Object.entries(grouped).map(([category, amount]) => ({
        name: category.replace(/_/g, ' '),
        value: Math.round(amount),
        fill: categoryColors[category] || '#94a3b8',
      }));
    } else if (groupBy === 'month') {
      // Group by month
      const grouped = transactions.reduce((acc, t) => {
        if (t.transactionDate) {
          const date = new Date(t.transactionDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!acc[monthKey]) {
            acc[monthKey] = 0;
          }
          acc[monthKey] += parseFloat(t.amount || '0');
        }
        return acc;
      }, {} as Record<string, number>);

      chartData = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount], index) => ({
          name: new Date(month + '-01').toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric'
          }),
          value: Math.round(amount),
          fill: `hsl(${(index * 60) % 360}, 70%, 50%)`,
        }));
    }

    // Get available months and categories for filters
    const availableMonthsQuery = await db
      .select({
        month: sql<string>`TO_CHAR(${transaction.transactionDate}, 'YYYY-MM')`
      })
      .from(transaction)
      .where(eq(transaction.transactionType, 'EXPENSE'))
      .groupBy(sql`TO_CHAR(${transaction.transactionDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transaction.transactionDate}, 'YYYY-MM') DESC`);

    const availableMonths = availableMonthsQuery.map(m => m.month);

    const availableCategoriesQuery = await db
      .select({
        name: transactionCategory.name
      })
      .from(transactionCategory)
      .where(eq(transactionCategory.type, 'EXPENSE'))
      .orderBy(transactionCategory.name);

    const availableCategories = availableCategoriesQuery.map(c => c.name);

    return NextResponse.json({
      success: true,
      data: chartData,
      filters: {
        availableMonths,
        availableCategories,
      },
    });
  } catch (error) {
    console.error('Chart data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
