import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { patient } from '@/drizzle/schema';
import { eq, desc, or, like, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import AuditLogger, { AuditResourceType, AuditSeverity } from '@/lib/audit-logger';

// GET - Fetch patients with search
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
    const search = searchParams.get('search');

    let query = db
      .select({
        id: patient.id,
        patientCode: patient.patientCode,
        name: patient.name,
        birthDate: patient.birthDate,
        gender: patient.gender,
        address: patient.address,
        phone: patient.phone,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        medicalNotes: patient.medicalNotes,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      })
      .from(patient);

    if (search) {
      query = query.where(
        or(
          like(patient.name, `%${search}%`),
          like(patient.patientCode, `%${search}%`),
          like(patient.phone, `%${search}%`)
        )!
      );
    }

    const patients = await query.orderBy(desc(patient.createdAt));

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - Create new patient
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
    const { name, birthDate, gender, address, phone, emergencyContact, emergencyPhone, medicalNotes } = body;

    // Generate patient code
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of patients created today
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const existingToday = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patient)
      .where(sql`DATE(${patient.createdAt}) = DATE(${todayStart})`);

    const sequence = (existingToday[0]?.count || 0) + 1;
    const patientCode = `PAT-${dateStr}-${String(sequence).padStart(3, '0')}`;

    const newPatient = await db.insert(patient).values({
      patientCode,
      name,
      birthDate,
      gender,
      address,
      phone,
      emergencyContact,
      emergencyPhone,
      medicalNotes,
    }).returning();

    await AuditLogger.log({
      userId: session.user.id,
      organizationId: session.session.activeOrganizationId,
      resourceType: AuditResourceType.PATIENT,
      resourceId: newPatient[0].id,
      action: 'CREATE (Tambah Pasien)',
      severity: AuditSeverity.INFO,
      description: `Pasien baru dibuat: ${newPatient[0].name} (${newPatient[0].patientCode})`,
      metadata: {
        patientCode: newPatient[0].patientCode,
        name: newPatient[0].name,
        birthDate: newPatient[0].birthDate,
        gender: newPatient[0].gender,
      },
    });

    return NextResponse.json({
      success: true,
      data: newPatient[0],
    });
  } catch (error) {
    console.error('Failed to create patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
