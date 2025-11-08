import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { room, facility, roomFacility } from '@/drizzle/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { log } from 'console';
import AuditLogger, { AuditResourceType, AuditSeverity } from '@/lib/audit-logger';

// GET - Fetch rooms with filters
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
    const roomType = searchParams.get('roomType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build query conditions
    const conditions = [];

    if (roomType && roomType !== 'all') {
      conditions.push(eq(room.roomType, roomType));
    }

    if (status && status !== 'all') {
      conditions.push(eq(room.status, status));
    }

    if (isActive !== null && isActive !== undefined && isActive !== 'all') {
      conditions.push(eq(room.isActive, isActive === 'true'));
    }

    if (search) {
      conditions.push(
        or(
          like(room.roomNumber, `%${search}%`),
          like(room.description, `%${search}%`)
        )!
      );
    }

    // Fetch rooms
    const rooms = await db
      .select({
        id: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        baseRate: room.baseRate,
        status: room.status,
        description: room.description,
        isActive: room.isActive,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      })
      .from(room)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(room.roomNumber);

    // Fetch facilities for each room
    const roomsWithFacilities = await Promise.all(
      rooms.map(async (r) => {
        const facilities = await db
          .select({
            id: facility.id,
            name: facility.name,
            additionalPrice: facility.additionalPrice,
          })
          .from(roomFacility)
          .innerJoin(facility, eq(roomFacility.facilityId, facility.id))
          .where(eq(roomFacility.roomId, r.id));

        return {
          ...r,
          facilities,
        };
      })
    );

    // Get summary statistics
    const stats = await db
      .select({
        status: room.status,
        count: sql<number>`count(*)::int`,
      })
      .from(room)
      .where(eq(room.isActive, true))
      .groupBy(room.status);

    return NextResponse.json({
      success: true,
      data: roomsWithFacilities,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { roomNumber, roomType, capacity, baseRate, status, description, isActive } = body;

    const newRoom = await db.insert(room).values({
      roomNumber,
      roomType,
      capacity,
      baseRate,
      status,
      description,
      isActive,
    }).returning();

    await AuditLogger.log({
      userId: session.user.id,
      organizationId: session.session.activeOrganizationId,
      resourceType: AuditResourceType.ROOM,
      resourceId: newRoom[0].id,
      action: 'CREATE (Tambah Kamar)',
      severity: AuditSeverity.INFO,
      description: `Kamar yang dibuat: ${newRoom[0].roomNumber}`,
      metadata: {
        roomNumber: newRoom[0].roomNumber,
        roomType: newRoom[0].roomType,
        capacity: newRoom[0].capacity,
        baseRate: newRoom[0].baseRate,
        status: newRoom[0].status,
        description: newRoom[0].description,
        isActive: newRoom[0].isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: newRoom,
    });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    );
  }

}
