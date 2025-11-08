# Schema Improvements Summary

## ✅ Changes Implemented

### 1. **ABAC (Attribute-Based Access Control) Enhancement**

#### Current Issues:
- ✅ Your schema has good ABAC foundation
- ⚠️ Different request types need different approval flows

#### Improvements Made:
- Added `requestType` field to `rolePermission` table to support different approval flows:
  - **TRANSACTION requests**: Bendahara (Level 1) → Ketua (Level 2)
  - **DOCUMENT requests**: Sekretaris (Level 1) → Ketua (Level 2)

```typescript
export const rolePermission = pgTable("rolePermission", {
    approvalLevel: integer('approvalLevel'),
    requestType: text('requestType') // NEW: TRANSACTION, DOCUMENT, NULL=all types
});
```

---

### 2. **Document Management System** 🆕

Added complete document management with version control:

#### New Tables:
- **`documentCategory`**: Categories for documents (CONTRACT, POLICY, INVOICE, etc.)
- **`document`**: Main document storage with metadata
  - Supports linking to other entities (PATIENT, BOOKING, REQUEST, etc.)
  - Version tracking
  - Tags for search
  - File metadata (size, mime type)
  - Status tracking (ACTIVE, ARCHIVED, DELETED)
- **`documentVersion`**: Document version history

#### Document Request Flow:
```
Request (type=DOCUMENT) → Approval L1 (Sekretaris) → Approval L2 (Ketua)
```

Enhanced `request` table with:
```typescript
documentId: uuid('documentId')
documentAction: text('documentAction') // CREATE, UPDATE, DELETE
```

---

### 3. **Payment Gateway Integration** 💳

Enhanced `bookingPayment` table to support **Midtrans** and **Xendit**:

```typescript
export const bookingPayment = pgTable("bookingPayment", {
    paymentMethod: text('paymentMethod'), // CASH, TRANSFER, CARD, QRIS, E_WALLET
    paymentGateway: text('paymentGateway'), // MIDTRANS, XENDIT, NULL
    gatewayOrderId: text('gatewayOrderId'), // External payment ID
    gatewayTransactionId: text('gatewayTransactionId'), // Gateway reference
    gatewayStatus: text('gatewayStatus'), // pending, settlement, expire, cancel
    gatewayResponse: json('gatewayResponse'), // Full response for debugging
    settledAt: timestamp('settledAt'), // Payment confirmation time
});
```

---

### 4. **Currency - Rupiah (Scale 0)** 💰

Changed ALL decimal fields from `scale: 2` to `scale: 0` for Rupiah:

**Before:**
```typescript
amount: decimal('amount', { precision: 15, scale: 2 })
```

**After:**
```typescript
amount: decimal('amount', { precision: 15, scale: 0 }) // Rupiah
```

Applied to:
- ✅ All financial amounts
- ✅ Room rates
- ✅ Facility prices
- ✅ Inventory costs
- ✅ Cash tracking
- ✅ Payments

---

### 5. **CamelCase Naming Convention** 🔤

Converted table names from `snake_case` to `camelCase`:

| Before | After |
|--------|-------|
| `founder_capital` | `founderCapital` |
| `capital_injection` | `capitalInjection` |
| `role_permission` | `rolePermission` |
| `room_facility` | `roomFacility` |
| `booking_facility` | `bookingFacility` |
| `booking_payment` | `bookingPayment` |
| `request_item` | `requestItem` |
| `inventory_item` | `inventoryItem` |
| `inventory_movement` | `inventoryMovement` |
| `transaction_category` | `transactionCategory` |
| `audit_log` | `auditLog` |

**Note:** Column names kept same format for consistency with Better Auth conventions.

---

### 6. **Multi-Worker Shift Support** 👥

#### Problem:
- Current design: ONE worker per shift
- Need: MULTIPLE workers per shift
- Need: Separate LOCAL CASH + BANK tracking for audit security

#### Solution:

**New `shift` table structure:**
```typescript
export const shift = pgTable("shift", {
    shiftCode: text('shiftCode').notNull().unique(), // NEW

    // LOCAL CASH tracking
    cashLocalBeginning: decimal('cashLocalBeginning', { scale: 0 }),
    cashLocalReceived: decimal('cashLocalReceived', { scale: 0 }),
    cashLocalExpenses: decimal('cashLocalExpenses', { scale: 0 }),
    cashLocalEnding: decimal('cashLocalEnding', { scale: 0 }),
    cashLocalActual: decimal('cashLocalActual', { scale: 0 }),
    cashLocalVariance: decimal('cashLocalVariance', { scale: 0 }),

    // BANK tracking
    bankBeginning: decimal('bankBeginning', { scale: 0 }),
    bankReceived: decimal('bankReceived', { scale: 0 }),
    bankExpenses: decimal('bankExpenses', { scale: 0 }),
    bankEnding: decimal('bankEnding', { scale: 0 }),
    bankActual: decimal('bankActual', { scale: 0 }),
    bankVariance: decimal('bankVariance', { scale: 0 }),

    // TOTAL verification
    totalExpected: decimal('totalExpected', { scale: 0 }),
    totalActual: decimal('totalActual', { scale: 0 }),
});
```

**New `shiftWorker` junction table:**
```typescript
export const shiftWorker = pgTable("shiftWorker", {
    shiftId: uuid('shiftId'),
    userId: text('userId'),
    role: text('role'), // NURSE, SUPERVISOR, ADMIN
    checkInTime: timestamp('checkInTime'),
    checkOutTime: timestamp('checkOutTime'),
});
```

#### Benefits:
✅ Multiple workers can work same shift
✅ Separate local cash + bank tracking
✅ Automatic variance detection: `(cashLocalActual + bankActual) should equal totalExpected`
✅ Better audit trail with check-in/out times
✅ More secure cash reconciliation

---

## 🔄 Migration Path

### Step 1: Backup current database
```bash
pg_dump your_database > backup.sql
```

### Step 2: Generate migration
```bash
drizzle-kit generate:pg --schema=./drizzle/schema-improved.ts
```

### Step 3: Review and apply migration
```bash
drizzle-kit push:pg
```

### Step 4: Seed initial data
Create seed scripts for:
- Document categories
- Initial permissions for documents
- Role permissions for new flows

---

## 📋 Implementation Checklist

### Backend Logic to Implement:

- [ ] **Approval Flow Logic**
  - [ ] Transaction request → Bendahara → Ketua
  - [ ] Document request → Sekretaris → Ketua
  - [ ] Timeout handling for approvals

- [ ] **Payment Gateway Integration**
  - [ ] Midtrans SDK integration
  - [ ] Xendit SDK integration
  - [ ] Webhook handlers for payment status
  - [ ] Payment reconciliation

- [ ] **Document Management**
  - [ ] File upload to cloud storage (S3, GCS, or local)
  - [ ] Version control logic
  - [ ] Document approval workflow
  - [ ] Search/filter by tags

- [ ] **Shift Management**
  - [ ] Multi-worker assignment
  - [ ] Cash reconciliation calculator
  - [ ] Variance alerts
  - [ ] Bank statement import/verification

- [ ] **Auto-generated Codes**
  - [ ] DOC-YYYYMMDD-XXX for documents
  - [ ] SHIFT-YYYYMMDD-XXX for shifts
  - [ ] Update existing code generators

---

## 🎯 ABAC Implementation Example

### Transaction Request Flow:
```typescript
// 1. User creates TRANSACTION request
const request = await createRequest({
    requestType: 'TRANSACTION',
    amount: 5000000, // Rupiah
    expenseCategoryId: 'category-uuid'
});

// 2. System auto-creates 2 approval records
await createApprovals(request.id, [
    { level: 1, roleName: 'BENDAHARA' },
    { level: 2, roleName: 'KETUA' }
]);

// 3. Bendahara approves (Level 1)
await approveRequest(request.id, level: 1, userId: 'bendahara-user-id');

// 4. Ketua approves (Level 2) → Request APPROVED
await approveRequest(request.id, level: 2, userId: 'ketua-user-id');
```

### Document Request Flow:
```typescript
// 1. User creates DOCUMENT request
const request = await createRequest({
    requestType: 'DOCUMENT',
    documentId: 'doc-uuid',
    documentAction: 'UPDATE'
});

// 2. System auto-creates 2 approval records
await createApprovals(request.id, [
    { level: 1, roleName: 'SEKRETARIS' },
    { level: 2, roleName: 'KETUA' }
]);

// 3. Sekretaris approves → Ketua approves → Document updated
```

---

## 🚀 Next Steps

1. **Review the improved schema** (`schema-improved.ts`)
2. **Test locally** with sample data
3. **Adjust based on your specific needs**
4. **Generate and apply migration**
5. **Update API/backend logic** for new features
6. **Update frontend** to support new flows

---

## ❓ Questions to Consider

1. **Document Storage**: Where will you store files? (AWS S3, Google Cloud Storage, local server?)
2. **Payment Gateway**: Will you use Midtrans, Xendit, or both?
3. **Approval Timeouts**: How long before approval requests timeout?
4. **Shift Scheduling**: Do you need advance shift scheduling or just record-keeping?
5. **Bank Integration**: Will you import bank statements automatically or manually enter?

---

## 📞 Need Help?

If you have questions about:
- Specific table relationships
- Implementation details
- Migration process
- Best practices

Just ask! I'm here to help. 🚀
