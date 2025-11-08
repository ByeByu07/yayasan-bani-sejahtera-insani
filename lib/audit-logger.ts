import { db } from '@/lib/db';
import { auditLog } from '@/drizzle/schema';
import { headers } from 'next/headers';

// ============================================
// TYPES & ENUMS
// ============================================

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SUBMIT = 'SUBMIT',
  CANCEL = 'CANCEL',
  VERIFY = 'VERIFY',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum AuditResourceType {
  USER = 'USER',
  PATIENT = 'PATIENT',
  BOOKING = 'BOOKING',
  ROOM = 'ROOM',
  FACILITY = 'FACILITY',
  TRANSACTION = 'TRANSACTION',
  REQUEST = 'REQUEST',
  APPROVAL = 'APPROVAL',
  DOCUMENT = 'DOCUMENT',
  INVENTORY = 'INVENTORY',
  SHIFT = 'SHIFT',
  MEMBER = 'MEMBER',
  ORGANIZATION = 'ORGANIZATION',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  userId: string;
  organizationId?: string | null;
  action: AuditAction | string;
  resourceType: AuditResourceType | string;
  resourceId: string;
  description: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  severity?: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract IP address and User Agent from request headers
 * Call this in Server Components or API routes
 */
export async function getRequestContext() {
  const headersList = await headers();

  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    null;

  const userAgent = headersList.get('user-agent') || null;

  return { ipAddress, userAgent };
}

/**
 * Sanitize sensitive data before logging
 * Removes password, token, secret fields
 */
export function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Generate a human-readable description for common actions
 */
export function generateDescription(
  action: AuditAction | string,
  resourceType: AuditResourceType | string,
  resourceId: string,
  metadata?: Record<string, any>
): string {
  const resource = resourceType.toLowerCase();

  switch (action) {
    case AuditAction.CREATE:
      return `Created ${resource} ${resourceId}`;
    case AuditAction.UPDATE:
      return `Updated ${resource} ${resourceId}`;
    case AuditAction.DELETE:
      return `Deleted ${resource} ${resourceId}`;
    case AuditAction.APPROVE:
      return `Approved ${resource} ${resourceId}`;
    case AuditAction.REJECT:
      return `Rejected ${resource} ${resourceId}`;
    case AuditAction.LOGIN:
      return `User logged in`;
    case AuditAction.LOGOUT:
      return `User logged out`;
    default:
      return `${action} on ${resource} ${resourceId}`;
  }
}

// ============================================
// MAIN AUDIT LOGGER
// ============================================

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.insert(auditLog).values({
        userId: entry.userId,
        organizationId: entry.organizationId || null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        description: entry.description,
        oldValues: entry.oldValues ? sanitizeData(entry.oldValues) : null,
        newValues: entry.newValues ? sanitizeData(entry.newValues) : null,
        metadata: entry.metadata || null,
        severity: entry.severity || AuditSeverity.INFO,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Log a CREATE action
   */
  static async logCreate(params: {
    userId: string;
    organizationId?: string;
    resourceType: AuditResourceType | string;
    resourceId: string;
    newValues: Record<string, any>;
    description?: string;
    metadata?: Record<string, any>;
    severity?: AuditSeverity;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.CREATE,
      description: params.description || generateDescription(
        AuditAction.CREATE,
        params.resourceType,
        params.resourceId,
        params.metadata
      ),
      ...context,
    });
  }

  /**
   * Log an UPDATE action
   */
  static async logUpdate(params: {
    userId: string;
    organizationId?: string;
    resourceType: AuditResourceType | string;
    resourceId: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    description?: string;
    metadata?: Record<string, any>;
    severity?: AuditSeverity;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.UPDATE,
      description: params.description || generateDescription(
        AuditAction.UPDATE,
        params.resourceType,
        params.resourceId,
        params.metadata
      ),
      ...context,
    });
  }

  /**
   * Log a DELETE action
   */
  static async logDelete(params: {
    userId: string;
    organizationId?: string;
    resourceType: AuditResourceType | string;
    resourceId: string;
    oldValues: Record<string, any>;
    description?: string;
    metadata?: Record<string, any>;
    severity?: AuditSeverity;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.DELETE,
      description: params.description || generateDescription(
        AuditAction.DELETE,
        params.resourceType,
        params.resourceId,
        params.metadata
      ),
      severity: params.severity || AuditSeverity.WARNING,
      ...context,
    });
  }

  /**
   * Log an APPROVE action
   */
  static async logApprove(params: {
    userId: string;
    organizationId?: string;
    resourceType: AuditResourceType | string;
    resourceId: string;
    description?: string;
    metadata?: Record<string, any>;
    severity?: AuditSeverity;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.APPROVE,
      description: params.description || generateDescription(
        AuditAction.APPROVE,
        params.resourceType,
        params.resourceId,
        params.metadata
      ),
      ...context,
    });
  }

  /**
   * Log a REJECT action
   */
  static async logReject(params: {
    userId: string;
    organizationId?: string;
    resourceType: AuditResourceType | string;
    resourceId: string;
    description?: string;
    metadata?: Record<string, any>;
    severity?: AuditSeverity;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.REJECT,
      description: params.description || generateDescription(
        AuditAction.REJECT,
        params.resourceType,
        params.resourceId,
        params.metadata
      ),
      ...context,
    });
  }

  /**
   * Log a LOGIN action
   */
  static async logLogin(params: {
    userId: string;
    organizationId?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.LOGIN,
      resourceType: AuditResourceType.USER,
      resourceId: params.userId,
      description: params.description || `User ${params.userId} logged in`,
      ...context,
    });
  }

  /**
   * Log a LOGOUT action
   */
  static async logLogout(params: {
    userId: string;
    organizationId?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      action: AuditAction.LOGOUT,
      resourceType: AuditResourceType.USER,
      resourceId: params.userId,
      description: params.description || `User ${params.userId} logged out`,
      ...context,
    });
  }

  /**
   * Log a CRITICAL security event
   */
  static async logSecurityEvent(params: {
    userId: string;
    organizationId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const context = await getRequestContext();

    await this.log({
      ...params,
      severity: AuditSeverity.CRITICAL,
      ...context,
    });
  }
}

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export const auditLogger = AuditLogger;
export default AuditLogger;
