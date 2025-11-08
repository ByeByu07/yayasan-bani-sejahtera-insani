import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog, user, organization } from '@/drizzle/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Fetch audit logs with pagination
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const severity = searchParams.get('severity');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    if (action) {
      conditions.push(eq(auditLog.action, action));
    }

    if (resourceType) {
      conditions.push(eq(auditLog.resourceType, resourceType));
    }

    if (severity) {
      conditions.push(eq(auditLog.severity, severity));
    }

    if (userId) {
      conditions.push(eq(auditLog.userId, userId));
    }

    if (search) {
      conditions.push(
        or(
          like(auditLog.description, `%${search}%`),
          like(auditLog.resourceId, `%${search}%`)
        )!
      );
    }

    // Fetch audit logs with user and organization info
    const logs = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        userName: user.name,
        userEmail: user.email,
        organizationId: auditLog.organizationId,
        organizationName: organization.name,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        description: auditLog.description,
        oldValues: auditLog.oldValues,
        newValues: auditLog.newValues,
        metadata: auditLog.metadata,
        severity: auditLog.severity,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.userId, user.id))
      .leftJoin(organization, eq(auditLog.organizationId, organization.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get distinct values for filters
    const [actions, resourceTypes, severities] = await Promise.all([
      db.selectDistinct({ value: auditLog.action }).from(auditLog),
      db.selectDistinct({ value: auditLog.resourceType }).from(auditLog),
      db.selectDistinct({ value: auditLog.severity }).from(auditLog),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        actions: actions.map(a => a.value).filter(Boolean),
        resourceTypes: resourceTypes.map(r => r.value).filter(Boolean),
        severities: severities.map(s => s.value).filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
