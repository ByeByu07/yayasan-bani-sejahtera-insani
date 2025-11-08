# Shift Flow - Money Audit System

## 🎯 Purpose
Track **physical cash** at the location and detect variances for audit purposes.

---

## 💰 Money in the Organization

### Total Organization Money = 50M (Initial Capital)
This is split into:

1. **System Money** (Tracked in database)
   - Bank account balance
   - Digital/accounting records
   - Example: 48M in bank

2. **Physical Cash** (At the location)
   - Cash box / safe
   - Example: 2M in physical cash
   - **This is what shifts track!**

**Total: 48M (bank) + 2M (physical) = 50M** ✅

---

## 🔄 Shift Flow - Step by Step

### **Step 1: Shift OPENS** 🟢

```
Time: 08:00 AM
```

**Actions:**
1. Supervisor/First worker arrives
2. **Opens the shift** in system → Creates `shift` record (status: OPEN)
3. **All workers CHECK-IN** → Records in `shiftWorker` table
   - Worker A checks in at 08:00
   - Worker B checks in at 08:05
   - Worker C checks in at 08:10

4. **COUNT physical cash together**
   - Open cash box
   - Count: 2,000,000 Rupiah
   - Record: `cashBeginning = 2,000,000`

**Database:**
```sql
INSERT INTO shift (
    shiftCode: 'SHIFT-20250106-001',
    shiftDate: '2025-01-06',
    shiftType: 'MORNING',
    startTime: '2025-01-06 08:00:00',
    cashBeginning: 2000000,
    status: 'OPEN',
    openedByUserId: 'user-supervisor-id'
)

INSERT INTO shiftWorker (shiftId, userId, role, checkInTime, status)
VALUES
    ('shift-id', 'worker-a-id', 'NURSE', '08:00:00', 'PRESENT'),
    ('shift-id', 'worker-b-id', 'NURSE', '08:05:00', 'PRESENT'),
    ('shift-id', 'worker-c-id', 'ADMIN', '08:10:00', 'PRESENT')
```

---

### **Step 2: During Shift - Transactions** 💸

#### Transaction Example 1: Patient Pays CASH
```
Patient A books room, pays 500,000 CASH
```

**Actions:**
1. Worker receives 500K cash
2. Put in cash box
3. System records:
   - Create `bookingPayment` (amount: 500000, method: CASH)
   - Create `transaction` (type: REVENUE, amount: 500000)
   - **Auto-update shift**: `cashReceived += 500000`

**Result:**
- Physical cash box: 2,000,000 + 500,000 = 2,500,000
- `shift.cashReceived`: 500,000

---

#### Transaction Example 2: Patient Pays TRANSFER
```
Patient B books room, pays 1,000,000 via BANK TRANSFER
```

**Actions:**
1. Worker confirms transfer received
2. System records:
   - Create `bookingPayment` (amount: 1000000, method: TRANSFER)
   - Create `transaction` (type: REVENUE, amount: 1000000)
   - **No effect on shift physical cash!**

**Result:**
- Physical cash box: Still 2,500,000 (unchanged)
- Bank account: 48M + 1M = 49M
- Shift not affected (only tracks physical cash)

---

#### Transaction Example 3: Spend CASH (with approved request)
```
Approved request: Buy medical supplies 300,000
Worker pays with CASH
```

**Actions:**
1. Request already APPROVED (Bendahara → Ketua)
2. Worker takes 300K from cash box
3. Buy supplies
4. System records:
   - Create `transaction` (type: EXPENSE, amount: 300000, referenceType: REQUEST)
   - **Auto-update shift**: `cashExpenses += 300000`

**Result:**
- Physical cash box: 2,500,000 - 300,000 = 2,200,000
- `shift.cashExpenses`: 300,000

---

#### Transaction Example 4: Spend via TRANSFER (with approved request)
```
Approved request: Pay utilities 500,000
Organization pays via BANK TRANSFER
```

**Actions:**
1. Request already APPROVED
2. Admin transfers from bank account
3. System records:
   - Create `transaction` (type: EXPENSE, amount: 500000)
   - **No effect on shift physical cash!**

**Result:**
- Physical cash box: Still 2,200,000 (unchanged)
- Bank account: 49M - 500K = 48.5M
- Shift not affected (only tracks physical cash)

---

### **Step 3: Shift CLOSES** 🔴

```
Time: 16:00 PM
```

**Actions:**
1. All workers gather
2. **COUNT physical cash together**
   - Open cash box
   - Count: 2,150,000 Rupiah (actual count)

3. **System calculates expected:**
   ```
   cashExpected = cashBeginning + cashReceived - cashExpenses
   cashExpected = 2,000,000 + 500,000 - 300,000
   cashExpected = 2,200,000
   ```

4. **Compare:**
   ```
   cashActual = 2,150,000 (what workers counted)
   cashExpected = 2,200,000 (what system calculated)
   cashVariance = 2,150,000 - 2,200,000 = -50,000 ⚠️
   ```

5. **Record variance:**
   - Status: CLOSED
   - Variance: -50,000 (MISSING 50K!)
   - All workers must provide explanation

6. **Workers CHECK-OUT:**
   - Worker A checks out at 16:00
   - Worker B checks out at 16:05
   - Worker C checks out at 16:10

**Database:**
```sql
UPDATE shift SET
    endTime = '2025-01-06 16:00:00',
    cashReceived = 500000,
    cashExpenses = 300000,
    cashExpected = 2200000,
    cashActual = 2150000,
    cashVariance = -50000,
    status = 'CLOSED',
    varianceNotes = 'Workers cannot explain 50K shortage',
    closedByUserId = 'user-supervisor-id'
WHERE id = 'shift-id'

UPDATE shiftWorker SET
    checkOutTime = '16:00:00'
WHERE shiftId = 'shift-id'
```

---

### **Step 4: Bendahara VERIFIES** ✅

```
Next day or later
```

**Actions:**
1. Bendahara reviews the shift
2. Reviews variance report
3. Investigates with workers
4. Approves/Verifies the shift

**Database:**
```sql
UPDATE shift SET
    status = 'VERIFIED',
    verifiedByUserId = 'bendahara-user-id',
    verifiedAt = '2025-01-07 09:00:00'
WHERE id = 'shift-id'
```

---

## 📊 Shift Schema Explained

### `shift` Table
```typescript
{
    id: uuid,
    shiftCode: 'SHIFT-YYYYMMDD-XXX',
    shiftDate: date,
    shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT',
    startTime: timestamp,
    endTime: timestamp,

    // Physical cash tracking
    cashBeginning: 2000000,     // Count at start
    cashReceived: 500000,       // Auto-calculated from cash payments
    cashExpenses: 300000,       // Auto-calculated from cash expenses
    cashExpected: 2200000,      // Auto-calculated: beginning + received - expenses
    cashActual: 2150000,        // Count at end
    cashVariance: -50000,       // actual - expected (ALERT if not zero!)

    status: 'OPEN' | 'CLOSED' | 'VERIFIED',
    varianceNotes: string,      // Required if variance != 0

    openedByUserId: uuid,
    closedByUserId: uuid,
    verifiedByUserId: uuid,     // Bendahara
    verifiedAt: timestamp
}
```

### `shiftWorker` Table (Attendance)
```typescript
{
    id: uuid,
    shiftId: uuid,
    userId: uuid,
    role: 'NURSE' | 'SUPERVISOR' | 'ADMIN',
    checkInTime: timestamp,     // REQUIRED - proves attendance
    checkOutTime: timestamp,
    status: 'PRESENT' | 'ABSENT' | 'LATE',
    notes: string
}
```

---

## 🎯 Responsibility Model

### ❌ If Variance Found (cashVariance ≠ 0)

**ALL workers in that shift are collectively responsible** because:
1. All workers checked in (attendance tracked)
2. Shared cash box (not individual responsibility)
3. Small organization
4. All workers should monitor each other

**Actions:**
- Shift cannot be VERIFIED until variance explained
- Workers must provide `varianceNotes`
- Bendahara investigates
- May require disciplinary action or reimbursement

---

## 🔗 Integration with Request/Approval System

### Spending Money Flow:

```
1. Worker needs to buy supplies
   ↓
2. Creates REQUEST (requestType: TRANSACTION, amount: 300000)
   ↓
3. APPROVAL Level 1: Bendahara approves
   ↓
4. APPROVAL Level 2: Ketua approves
   ↓
5. Request status: APPROVED
   ↓
6. NOW worker can spend:
   - Option A: Pay with CASH → shift.cashExpenses += 300000
   - Option B: Pay with TRANSFER → bank account decreases (no shift effect)
   ↓
7. System creates TRANSACTION record linked to request
```

**Key:** Shift only tracks if payment method is CASH!

---

## 📈 Reports & Audit

### Daily Shift Report:
```
Shift: SHIFT-20250106-001
Date: 2025-01-06
Type: MORNING
Workers: Worker A, Worker B, Worker C

Cash Beginning: 2,000,000
Cash Received:    500,000  (Patient A room payment)
Cash Expenses:   -300,000  (Medical supplies)
Cash Expected:  2,200,000

Cash Actual:    2,150,000  (Physical count)
VARIANCE:        -50,000  ⚠️ ALERT!

Status: CLOSED (Awaiting Bendahara verification)
```

### Monthly Variance Report:
```
January 2025 - All Shifts

Total Shifts: 90
Shifts with Variance: 3
Total Variance: -125,000

Alerts:
- SHIFT-20250106-001: -50,000
- SHIFT-20250115-002: -30,000
- SHIFT-20250123-003: -45,000
```

---

## ✅ Summary

1. **Shift tracks ONLY physical cash** (not bank/system money)
2. **Workers count cash at start and end** of shift
3. **System auto-calculates expected** based on transactions
4. **Variance = Actual - Expected**
5. **All workers share responsibility** for variance
6. **Bendahara verifies** all shifts
7. **Cash transactions auto-update shift** (`cashReceived`, `cashExpenses`)
8. **Transfer transactions don't affect shift** (only bank account)

---

## 🚀 Next Steps for Implementation

1. Build shift opening UI (count beginning cash)
2. Auto-link cash transactions to active shift
3. Build shift closing UI (count actual cash, show variance)
4. Alert system for variances
5. Bendahara verification dashboard
6. Reports & analytics

Does this match your organization's needs? 🎯
