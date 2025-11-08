import { pgTable, text, boolean, timestamp, uuid, decimal, integer, date, json } from "drizzle-orm/pg-core";

// ============================================
// BETTER AUTH CORE TABLES
// ============================================

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('activeOrganizationId').references(() => organization.id, { onDelete: 'set null' })
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow()
});

// ============================================
// BETTER AUTH ORGANIZATION PLUGIN TABLES
// ============================================

export const organization = pgTable("organization", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    metadata: text('metadata'), // JSON string
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const member = pgTable("member", {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // owner, admin, member, KETUA, BENDAHARA, SEKRETARIS, OPERASIONAL, PENGADAAN, NURSE
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const invitation = pgTable("invitation", {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    inviterId: text('inviterId').notNull().references(() => member.id, { onDelete: 'cascade' }),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    status: text('status').notNull(), // pending, accepted, rejected, canceled
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull()
});

// ============================================
// CAPITAL & FOUNDERS
// ============================================

export const founderCapital = pgTable("founder_capital", {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: text('memberId').notNull().references(() => member.id, { onDelete: 'cascade' }),
    initialInvestment: decimal('initialInvestment', { precision: 15, scale: 2 }).notNull().default('0'),
    totalContributed: decimal('totalContributed', { precision: 15, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const capitalInjection = pgTable("capital_injection", {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: text('memberId').references(() => member.id, { onDelete: 'set null' }), // nullable for organization injection
    source: text('source').notNull(), // FOUNDER or ORGANIZATION
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    description: text('description'),
    proofDocumentUrl: text('proofDocumentUrl'),
    injectionDate: date('injectionDate').notNull(),
    approvedByUserId: text('approvedByUserId').notNull().references(() => user.id),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// CUSTOM ROLES & PERMISSIONS (using Organization AC)
// ============================================

export const permission = pgTable("permission", {
    id: uuid('id').primaryKey().defaultRandom(),
    resource: text('resource').notNull(), // patients, rooms, requests, bookings, inventory
    action: text('action').notNull(), // create, read, update, delete, approve
    description: text('description')
});

export const rolePermission = pgTable("role_permission", {
    id: uuid('id').primaryKey().defaultRandom(),
    roleName: text('roleName').notNull(), // KETUA, BENDAHARA, SEKRETARIS, OPERASIONAL, PENGADAAN, NURSE
    permissionId: uuid('permissionId').notNull().references(() => permission.id, { onDelete: 'cascade' }),
    approvalLevel: integer('approvalLevel') // 1=Bendahara, 2=Ketua, NULL=no approval
});

// ============================================
// ROOMS & FACILITIES
// ============================================

export const room = pgTable("room", {
    id: uuid('id').primaryKey().defaultRandom(),
    roomNumber: text('roomNumber').notNull().unique(),
    roomType: text('roomType').notNull(), // VIP, STANDARD, ICU
    capacity: integer('capacity').notNull().default(1),
    baseRate: decimal('baseRate', { precision: 15, scale: 2 }).notNull(),
    status: text('status').notNull().default('AVAILABLE'), // AVAILABLE, OCCUPIED, MAINTENANCE
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const facility = pgTable("facility", {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    additionalPrice: decimal('additionalPrice', { precision: 15, scale: 2 }).notNull().default('0'),
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const roomFacility = pgTable("room_facility", {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('roomId').notNull().references(() => room.id, { onDelete: 'cascade' }),
    facilityId: uuid('facilityId').notNull().references(() => facility.id, { onDelete: 'cascade' }),
    addedAt: timestamp('addedAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// PATIENTS & BOOKINGS
// ============================================

export const patient = pgTable("patient", {
    id: uuid('id').primaryKey().defaultRandom(),
    patientCode: text('patientCode').notNull().unique(), // AUTO: PAT-YYYYMMDD-XXX
    name: text('name').notNull(),
    birthDate: date('birthDate').notNull(),
    gender: text('gender').notNull(), // MALE, FEMALE, OTHER
    address: text('address'),
    phone: text('phone'),
    emergencyContact: text('emergencyContact'),
    emergencyPhone: text('emergencyPhone'),
    medicalNotes: text('medicalNotes'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const booking = pgTable("booking", {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingCode: text('bookingCode').notNull().unique(), // AUTO: BKG-YYYYMMDD-XXX
    patientId: uuid('patientId').notNull().references(() => patient.id, { onDelete: 'restrict' }),
    roomId: uuid('roomId').notNull().references(() => room.id, { onDelete: 'restrict' }),
    registeredByUserId: text('registeredByUserId').notNull().references(() => user.id),
    checkIn: timestamp('checkIn', { withTimezone: true }).notNull(),
    checkOut: timestamp('checkOut', { withTimezone: true }),
    totalDays: integer('totalDays').notNull().default(0),
    roomCharge: decimal('roomCharge', { precision: 15, scale: 2 }).notNull(),
    facilitiesCharge: decimal('facilitiesCharge', { precision: 15, scale: 2 }).notNull().default('0'),
    totalCharge: decimal('totalCharge', { precision: 15, scale: 2 }).notNull(),
    paidAmount: decimal('paidAmount', { precision: 15, scale: 2 }).notNull().default('0'),
    paymentStatus: text('paymentStatus').notNull().default('UNPAID'), // PAID, PARTIAL, UNPAID
    bookingStatus: text('bookingStatus').notNull().default('ACTIVE'), // ACTIVE, COMPLETED, CANCELLED
    notes: text('notes'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const bookingFacility = pgTable("booking_facility", {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('bookingId').notNull().references(() => booking.id, { onDelete: 'cascade' }),
    facilityId: uuid('facilityId').notNull().references(() => facility.id, { onDelete: 'restrict' }),
    priceAtBooking: decimal('priceAtBooking', { precision: 15, scale: 2 }).notNull()
});

export const bookingPayment = pgTable("booking_payment", {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('bookingId').notNull().references(() => booking.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    paymentMethod: text('paymentMethod').notNull(), // CASH, TRANSFER, CARD
    proofDocumentUrl: text('proofDocumentUrl'),
    receivedByUserId: text('receivedByUserId').notNull().references(() => user.id),
    paymentDate: timestamp('paymentDate', { withTimezone: true }).notNull(),
    notes: text('notes')
});

// ============================================
// STAFF SHIFTS & CASH RECONCILIATION
// ============================================

export const shift = pgTable("shift", {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'restrict' }), // nurse
    shiftDate: date('shiftDate').notNull(),
    shiftType: text('shiftType').notNull(), // MORNING, AFTERNOON, NIGHT
    startTime: timestamp('startTime', { withTimezone: true }).notNull(),
    endTime: timestamp('endTime', { withTimezone: true }).notNull(),
    cashBeginning: decimal('cashBeginning', { precision: 15, scale: 2 }).notNull().default('0'),
    cashReceived: decimal('cashReceived', { precision: 15, scale: 2 }).notNull().default('0'),
    cashExpenses: decimal('cashExpenses', { precision: 15, scale: 2 }).notNull().default('0'),
    cashEnding: decimal('cashEnding', { precision: 15, scale: 2 }).notNull().default('0'), // calculated
    cashActual: decimal('cashActual', { precision: 15, scale: 2 }).notNull().default('0'), // physical count
    cashVariance: decimal('cashVariance', { precision: 15, scale: 2 }).notNull().default('0'), // actual - ending
    status: text('status').notNull().default('OPEN'), // OPEN, SUBMITTED, VERIFIED
    notes: text('notes'),
    verifiedByUserId: text('verifiedByUserId').references(() => user.id), // bendahara
    verifiedAt: timestamp('verifiedAt', { withTimezone: true }),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// REQUESTS & APPROVALS
// ============================================

export const transactionCategory = pgTable("transaction_category", {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(), // FOOD, MEDICAL_SUPPLIES, SALARIES, OPERATIONAL, UTILITIES
    type: text('type').notNull(), // REVENUE, EXPENSE
    code: text('code').notNull().unique(), // CAT-XXX
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true)
});

export const request = pgTable("request", {
    id: uuid('id').primaryKey().defaultRandom(),
    requestCode: text('requestCode').notNull().unique(), // AUTO: REQ-YYYYMMDD-XXX
    requestType: text('requestType').notNull(), // INVENTORY, EXPENSE, PROCUREMENT
    requesterUserId: text('requesterUserId').notNull().references(() => user.id),
    expenseCategoryId: uuid('expenseCategoryId').references(() => transactionCategory.id, { onDelete: 'restrict' }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    description: text('description'),
    justification: text('justification'),
    status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, CANCELLED, TIMEOUT
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
    neededByDate: date('neededByDate'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const requestItem = pgTable("request_item", {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('requestId').notNull().references(() => request.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventoryItemId').references(() => inventoryItem.id, { onDelete: 'set null' }),
    itemName: text('itemName').notNull(),
    quantity: integer('quantity').notNull(),
    unit: text('unit').notNull(),
    unitPrice: decimal('unitPrice', { precision: 15, scale: 2 }).notNull(),
    totalPrice: decimal('totalPrice', { precision: 15, scale: 2 }).notNull(),
    specifications: text('specifications')
});

export const approval = pgTable("approval", {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('requestId').notNull().references(() => request.id, { onDelete: 'cascade' }),
    approvalLevel: integer('approvalLevel').notNull(), // 1=Bendahara, 2=Ketua (sequential)
    roleName: text('roleName').notNull(), // BENDAHARA or KETUA
    approverUserId: text('approverUserId').references(() => user.id), // nullable until approved
    status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, TIMEOUT
    comments: text('comments'),
    timeoutAt: timestamp('timeoutAt', { withTimezone: true }),
    approvedAt: timestamp('approvedAt', { withTimezone: true }),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// INVENTORY
// ============================================

export const inventoryItem = pgTable("inventory_item", {
    id: uuid('id').primaryKey().defaultRandom(),
    itemCode: text('itemCode').notNull().unique(), // AUTO: INV-XXX
    name: text('name').notNull(),
    category: text('category').notNull(), // MEDICAL_SUPPLIES, FOOD, GENERAL
    unit: text('unit').notNull(), // pcs, box, kg, liter
    quantityOnHand: integer('quantityOnHand').notNull().default(0),
    minimumStock: integer('minimumStock').notNull().default(0),
    averageUnitCost: decimal('averageUnitCost', { precision: 15, scale: 2 }).notNull().default('0'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const inventoryMovement = pgTable("inventory_movement", {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryItemId: uuid('inventoryItemId').notNull().references(() => inventoryItem.id, { onDelete: 'restrict' }),
    movementType: text('movementType').notNull(), // IN, OUT, ADJUSTMENT
    quantity: integer('quantity').notNull(), // positive for IN, negative for OUT
    unitCost: decimal('unitCost', { precision: 15, scale: 2 }), // for IN movements
    referenceType: text('referenceType'), // REQUEST, PURCHASE, USAGE, ADJUSTMENT
    referenceId: uuid('referenceId'),
    performedByUserId: text('performedByUserId').notNull().references(() => user.id),
    notes: text('notes'),
    movementDate: timestamp('movementDate', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// FINANCIAL TRANSACTIONS
// ============================================

export const transaction = pgTable("transaction", {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionCode: text('transactionCode').notNull().unique(), // AUTO: TRX-YYYYMMDD-XXX
    transactionType: text('transactionType').notNull(), // CAPITAL_INJECTION, REVENUE, EXPENSE
    categoryId: uuid('categoryId').references(() => transactionCategory.id, { onDelete: 'restrict' }), // nullable for capital
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    transactionDate: date('transactionDate').notNull(),
    referenceType: text('referenceType'), // BOOKING, REQUEST, CAPITAL_INJECTION, SHIFT
    referenceId: uuid('referenceId'),
    description: text('description'),
    proofDocumentUrl: text('proofDocumentUrl'),
    createdByUserId: text('createdByUserId').notNull().references(() => user.id),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// AUDIT LOGS
// ============================================

export const auditLog = pgTable("audit_log", {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'restrict' }),
    organizationId: text('organizationId').references(() => organization.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT, etc
    resourceType: text('resourceType').notNull(), // PATIENT, BOOKING, REQUEST, TRANSACTION, USER, etc
    resourceId: text('resourceId').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    description: text('description').notNull(),
    oldValues: json('oldValues'), // Previous state (for UPDATE/DELETE)
    newValues: json('newValues'), // New state (for CREATE/UPDATE)
    metadata: json('metadata'), // Additional context
    severity: text('severity').notNull().default('INFO'), // INFO, WARNING, CRITICAL
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});