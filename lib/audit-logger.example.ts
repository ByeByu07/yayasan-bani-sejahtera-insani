/**
 * AUDIT LOGGER - USAGE EXAMPLES
 *
 * This file demonstrates how to use the AuditLogger utility
 * throughout your application.
 */

import { AuditLogger, AuditResourceType, AuditSeverity } from './audit-logger';

// ============================================
// EXAMPLE 1: CREATE a patient
// ============================================

async function createPatientExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  const newPatient = {
    id: 'patient-789',
    name: 'John Doe',
    birthDate: '1990-01-01',
    gender: 'MALE',
  };

  // ... create patient in database ...

  // Log the audit trail
  await AuditLogger.logCreate({
    userId,
    organizationId,
    resourceType: AuditResourceType.PATIENT,
    resourceId: newPatient.id,
    newValues: newPatient,
    metadata: {
      registeredBy: 'Nurse Jane',
      location: 'Front Desk',
    },
  });
}

// ============================================
// EXAMPLE 2: UPDATE a booking
// ============================================

async function updateBookingExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  const oldBooking = {
    id: 'booking-001',
    roomId: 'room-101',
    totalCharge: 1000000,
  };

  const newBooking = {
    id: 'booking-001',
    roomId: 'room-102', // Changed room
    totalCharge: 1500000, // Changed price
  };

  // ... update booking in database ...

  // Log the audit trail
  await AuditLogger.logUpdate({
    userId,
    organizationId,
    resourceType: AuditResourceType.BOOKING,
    resourceId: oldBooking.id,
    oldValues: oldBooking,
    newValues: newBooking,
    description: 'Room changed from 101 to 102',
    metadata: {
      reason: 'Patient requested upgrade',
      approvedBy: 'Manager',
    },
  });
}

// ============================================
// EXAMPLE 3: DELETE a document
// ============================================

async function deleteDocumentExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  const document = {
    id: 'doc-555',
    title: 'Patient Consent Form',
    fileUrl: 'https://example.com/doc.pdf',
  };

  // ... delete document in database ...

  // Log the audit trail (with WARNING severity for deletes)
  await AuditLogger.logDelete({
    userId,
    organizationId,
    resourceType: AuditResourceType.DOCUMENT,
    resourceId: document.id,
    oldValues: document,
    severity: AuditSeverity.WARNING,
    metadata: {
      reason: 'Duplicate document',
    },
  });
}

// ============================================
// EXAMPLE 4: APPROVE a request
// ============================================

async function approveRequestExample() {
  const userId = 'bendahara-user-id';
  const organizationId = 'org-456';

  const requestId = 'req-20250106-001';

  // ... approve request in database ...

  // Log the audit trail
  await AuditLogger.logApprove({
    userId,
    organizationId,
    resourceType: AuditResourceType.REQUEST,
    resourceId: requestId,
    description: 'Bendahara approved expense request for medical supplies',
    metadata: {
      approvalLevel: 1,
      roleName: 'BENDAHARA',
      amount: 5000000,
      category: 'MEDICAL_SUPPLIES',
    },
  });
}

// ============================================
// EXAMPLE 5: REJECT a request
// ============================================

async function rejectRequestExample() {
  const userId = 'ketua-user-id';
  const organizationId = 'org-456';

  const requestId = 'req-20250106-002';

  // ... reject request in database ...

  // Log the audit trail
  await AuditLogger.logReject({
    userId,
    organizationId,
    resourceType: AuditResourceType.REQUEST,
    resourceId: requestId,
    description: 'Ketua rejected expense request - insufficient budget',
    metadata: {
      approvalLevel: 2,
      roleName: 'KETUA',
      rejectionReason: 'Exceeds monthly budget allocation',
    },
  });
}

// ============================================
// EXAMPLE 6: LOGIN event
// ============================================

async function loginExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  // After successful login...

  await AuditLogger.logLogin({
    userId,
    organizationId,
    metadata: {
      loginMethod: 'email',
      deviceType: 'mobile',
    },
  });
}

// ============================================
// EXAMPLE 7: LOGOUT event
// ============================================

async function logoutExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  // Before logout...

  await AuditLogger.logLogout({
    userId,
    organizationId,
    metadata: {
      sessionDuration: '2 hours 15 minutes',
    },
  });
}

// ============================================
// EXAMPLE 8: CRITICAL security event
// ============================================

async function securityEventExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  // When detecting suspicious activity...

  await AuditLogger.logSecurityEvent({
    userId,
    organizationId,
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    resourceType: 'TRANSACTION',
    resourceId: 'trx-sensitive-001',
    description: 'User attempted to access transaction outside their organization',
    metadata: {
      attemptedOrganization: 'org-999',
      actualOrganization: 'org-456',
      blocked: true,
    },
  });
}

// ============================================
// EXAMPLE 9: Custom action with full control
// ============================================

async function customAuditLogExample() {
  const userId = 'user-123';
  const organizationId = 'org-456';

  // For custom actions not covered by helper methods...

  await AuditLogger.log({
    userId,
    organizationId,
    action: 'EXPORT',
    resourceType: AuditResourceType.TRANSACTION,
    resourceId: 'export-batch-001',
    description: 'Exported transaction data to Excel',
    severity: AuditSeverity.INFO,
    metadata: {
      exportFormat: 'XLSX',
      recordCount: 150,
      dateRange: '2025-01 to 2025-03',
      exportedBy: 'Bendahara',
    },
  });
}

// ============================================
// EXAMPLE 10: In API Route
// ============================================

// File: app/api/patients/create/route.ts
/*
import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger, AuditResourceType } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId } = await getSession(); // Your auth function

    // Create patient in database
    const patient = await db.insert(patient).values(body).returning();

    // Log audit trail (IP and user agent automatically captured)
    await AuditLogger.logCreate({
      userId,
      organizationId,
      resourceType: AuditResourceType.PATIENT,
      resourceId: patient[0].id,
      newValues: patient[0],
    });

    return NextResponse.json({ success: true, data: patient[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
*/

// ============================================
// EXAMPLE 11: In Server Action
// ============================================

// File: app/actions/update-booking.ts
/*
'use server'

import { AuditLogger, AuditResourceType } from '@/lib/audit-logger';

export async function updateBooking(bookingId: string, updates: any) {
  const { userId, organizationId } = await getSession();

  // Get old booking
  const oldBooking = await db.query.booking.findFirst({
    where: eq(booking.id, bookingId)
  });

  // Update booking
  const newBooking = await db
    .update(booking)
    .set(updates)
    .where(eq(booking.id, bookingId))
    .returning();

  // Log audit trail
  await AuditLogger.logUpdate({
    userId,
    organizationId,
    resourceType: AuditResourceType.BOOKING,
    resourceId: bookingId,
    oldValues: oldBooking,
    newValues: newBooking[0],
  });

  return { success: true };
}
*/

// ============================================
// EXAMPLE 12: Shift cash variance (WARNING severity)
// ============================================

async function shiftVarianceExample() {
  const userId = 'supervisor-user-id';
  const organizationId = 'org-456';

  const shiftId = 'shift-20250106-001';
  const variance = -50000; // Missing 50K

  await AuditLogger.log({
    userId,
    organizationId,
    action: 'VERIFY',
    resourceType: AuditResourceType.SHIFT,
    resourceId: shiftId,
    description: `Shift closed with cash variance of ${variance.toLocaleString('id-ID')} IDR`,
    severity: AuditSeverity.WARNING,
    metadata: {
      cashExpected: 2200000,
      cashActual: 2150000,
      variance: variance,
      workers: ['worker-a', 'worker-b', 'worker-c'],
      shiftType: 'MORNING',
    },
  });
}

// ============================================
// EXAMPLE 13: Batch operations
// ============================================

async function batchImportExample() {
  const userId = 'admin-user-id';
  const organizationId = 'org-456';

  const importedCount = 50;
  const failedCount = 3;

  await AuditLogger.log({
    userId,
    organizationId,
    action: 'IMPORT',
    resourceType: AuditResourceType.INVENTORY,
    resourceId: 'import-batch-20250106',
    description: `Bulk imported ${importedCount} inventory items (${failedCount} failed)`,
    severity: failedCount > 0 ? AuditSeverity.WARNING : AuditSeverity.INFO,
    metadata: {
      totalRecords: importedCount + failedCount,
      successCount: importedCount,
      failedCount: failedCount,
      importFile: 'inventory-2025-01.xlsx',
    },
  });
}
