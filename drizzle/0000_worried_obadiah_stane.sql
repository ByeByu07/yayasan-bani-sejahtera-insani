CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requestId" uuid NOT NULL,
	"approvalLevel" integer NOT NULL,
	"roleName" text NOT NULL,
	"approverUserId" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"comments" text,
	"timeoutAt" timestamp with time zone,
	"approvedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"organizationId" text,
	"action" text NOT NULL,
	"resourceType" text NOT NULL,
	"resourceId" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"description" text NOT NULL,
	"oldValues" json,
	"newValues" json,
	"metadata" json,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingCode" text NOT NULL,
	"patientId" uuid NOT NULL,
	"roomId" uuid NOT NULL,
	"registeredByUserId" text NOT NULL,
	"checkIn" timestamp with time zone NOT NULL,
	"checkOut" timestamp with time zone,
	"totalDays" integer DEFAULT 0 NOT NULL,
	"roomCharge" numeric(15, 0) NOT NULL,
	"facilitiesCharge" numeric(15, 0) DEFAULT '0' NOT NULL,
	"totalCharge" numeric(15, 0) NOT NULL,
	"paidAmount" numeric(15, 0) DEFAULT '0' NOT NULL,
	"paymentStatus" text DEFAULT 'UNPAID' NOT NULL,
	"bookingStatus" text DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_bookingCode_unique" UNIQUE("bookingCode")
);
--> statement-breakpoint
CREATE TABLE "bookingFacility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingId" uuid NOT NULL,
	"facilityId" uuid NOT NULL,
	"priceAtBooking" numeric(15, 0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookingPayment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingId" uuid NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"paymentMethod" text NOT NULL,
	"paymentGateway" text,
	"gatewayOrderId" text,
	"gatewayTransactionId" text,
	"gatewayStatus" text,
	"gatewayResponse" json,
	"proofDocumentUrl" text,
	"receivedByUserId" text NOT NULL,
	"paymentDate" timestamp with time zone NOT NULL,
	"settledAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capitalInjection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memberId" text,
	"source" text NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"description" text,
	"proofDocumentUrl" text,
	"injectionDate" date NOT NULL,
	"approvedByUserId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentCode" text NOT NULL,
	"categoryId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"fileUrl" text NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" integer NOT NULL,
	"mimeType" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tags" json,
	"uploadedByUserId" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"relatedEntityType" text,
	"relatedEntityId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_documentCode_unique" UNIQUE("documentCode")
);
--> statement-breakpoint
CREATE TABLE "documentCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documentCategory_name_unique" UNIQUE("name"),
	CONSTRAINT "documentCategory_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "documentVersion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"versionNumber" integer NOT NULL,
	"fileUrl" text NOT NULL,
	"fileSize" integer NOT NULL,
	"uploadedByUserId" text NOT NULL,
	"changeNotes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"additionalPrice" numeric(15, 0) DEFAULT '0' NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facility_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "founderCapital" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memberId" text NOT NULL,
	"initialInvestment" numeric(15, 0) DEFAULT '0' NOT NULL,
	"totalContributed" numeric(15, 0) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itemCode" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"quantityOnHand" integer DEFAULT 0 NOT NULL,
	"minimumStock" integer DEFAULT 0 NOT NULL,
	"averageUnitCost" numeric(15, 0) DEFAULT '0' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventoryItem_itemCode_unique" UNIQUE("itemCode")
);
--> statement-breakpoint
CREATE TABLE "inventoryMovement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventoryItemId" uuid NOT NULL,
	"movementType" text NOT NULL,
	"quantity" integer NOT NULL,
	"unitCost" numeric(15, 0),
	"referenceType" text,
	"referenceId" uuid,
	"performedByUserId" text NOT NULL,
	"notes" text,
	"movementDate" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviterId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patientCode" text NOT NULL,
	"name" text NOT NULL,
	"birthDate" date NOT NULL,
	"gender" text NOT NULL,
	"address" text,
	"phone" text,
	"emergencyContact" text,
	"emergencyPhone" text,
	"medicalNotes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_patientCode_unique" UNIQUE("patientCode")
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requestCode" text NOT NULL,
	"requestType" text NOT NULL,
	"requesterUserId" text NOT NULL,
	"expenseCategoryId" uuid,
	"amount" numeric(15, 0) DEFAULT '0',
	"documentId" uuid,
	"documentAction" text,
	"description" text,
	"justification" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"neededByDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_requestCode_unique" UNIQUE("requestCode")
);
--> statement-breakpoint
CREATE TABLE "requestItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requestId" uuid NOT NULL,
	"inventoryItemId" uuid,
	"itemName" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text NOT NULL,
	"unitPrice" numeric(15, 0) NOT NULL,
	"totalPrice" numeric(15, 0) NOT NULL,
	"specifications" text
);
--> statement-breakpoint
CREATE TABLE "rolePermission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roleName" text NOT NULL,
	"permissionId" uuid NOT NULL,
	"approvalLevel" integer,
	"requestType" text
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roomNumber" text NOT NULL,
	"roomType" text NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"baseRate" numeric(15, 0) NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_roomNumber_unique" UNIQUE("roomNumber")
);
--> statement-breakpoint
CREATE TABLE "roomFacility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roomId" uuid NOT NULL,
	"facilityId" uuid NOT NULL,
	"addedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shift" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shiftCode" text NOT NULL,
	"shiftDate" date NOT NULL,
	"shiftType" text NOT NULL,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone,
	"cashBeginning" numeric(15, 0) NOT NULL,
	"cashReceived" numeric(15, 0) DEFAULT '0' NOT NULL,
	"cashExpenses" numeric(15, 0) DEFAULT '0' NOT NULL,
	"cashExpected" numeric(15, 0) DEFAULT '0' NOT NULL,
	"cashActual" numeric(15, 0),
	"cashVariance" numeric(15, 0) DEFAULT '0',
	"status" text DEFAULT 'OPEN' NOT NULL,
	"notes" text,
	"varianceNotes" text,
	"openedByUserId" text NOT NULL,
	"closedByUserId" text,
	"verifiedByUserId" text,
	"verifiedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shift_shiftCode_unique" UNIQUE("shiftCode")
);
--> statement-breakpoint
CREATE TABLE "shiftWorker" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shiftId" uuid NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"checkInTime" timestamp with time zone NOT NULL,
	"checkOutTime" timestamp with time zone,
	"status" text DEFAULT 'PRESENT' NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transactionCode" text NOT NULL,
	"transactionType" text NOT NULL,
	"categoryId" uuid,
	"amount" numeric(15, 0) NOT NULL,
	"transactionDate" date NOT NULL,
	"referenceType" text,
	"referenceId" uuid,
	"description" text,
	"proofDocumentUrl" text,
	"createdByUserId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_transactionCode_unique" UNIQUE("transactionCode")
);
--> statement-breakpoint
CREATE TABLE "transactionCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "transactionCategory_name_unique" UNIQUE("name"),
	CONSTRAINT "transactionCategory_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_requestId_request_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_approverUserId_user_id_fk" FOREIGN KEY ("approverUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_patientId_patient_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patient"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_registeredByUserId_user_id_fk" FOREIGN KEY ("registeredByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingFacility" ADD CONSTRAINT "bookingFacility_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingFacility" ADD CONSTRAINT "bookingFacility_facilityId_facility_id_fk" FOREIGN KEY ("facilityId") REFERENCES "public"."facility"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingPayment" ADD CONSTRAINT "bookingPayment_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingPayment" ADD CONSTRAINT "bookingPayment_receivedByUserId_user_id_fk" FOREIGN KEY ("receivedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capitalInjection" ADD CONSTRAINT "capitalInjection_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capitalInjection" ADD CONSTRAINT "capitalInjection_approvedByUserId_user_id_fk" FOREIGN KEY ("approvedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_categoryId_documentCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."documentCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploadedByUserId_user_id_fk" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentVersion" ADD CONSTRAINT "documentVersion_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentVersion" ADD CONSTRAINT "documentVersion_uploadedByUserId_user_id_fk" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founderCapital" ADD CONSTRAINT "founderCapital_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryMovement" ADD CONSTRAINT "inventoryMovement_inventoryItemId_inventoryItem_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItem"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryMovement" ADD CONSTRAINT "inventoryMovement_performedByUserId_user_id_fk" FOREIGN KEY ("performedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_member_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_requesterUserId_user_id_fk" FOREIGN KEY ("requesterUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_expenseCategoryId_transactionCategory_id_fk" FOREIGN KEY ("expenseCategoryId") REFERENCES "public"."transactionCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requestItem" ADD CONSTRAINT "requestItem_requestId_request_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requestItem" ADD CONSTRAINT "requestItem_inventoryItemId_inventoryItem_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItem"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermission" ADD CONSTRAINT "rolePermission_permissionId_permission_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roomFacility" ADD CONSTRAINT "roomFacility_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roomFacility" ADD CONSTRAINT "roomFacility_facilityId_facility_id_fk" FOREIGN KEY ("facilityId") REFERENCES "public"."facility"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_activeOrganizationId_organization_id_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_openedByUserId_user_id_fk" FOREIGN KEY ("openedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_closedByUserId_user_id_fk" FOREIGN KEY ("closedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_verifiedByUserId_user_id_fk" FOREIGN KEY ("verifiedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shiftWorker" ADD CONSTRAINT "shiftWorker_shiftId_shift_id_fk" FOREIGN KEY ("shiftId") REFERENCES "public"."shift"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shiftWorker" ADD CONSTRAINT "shiftWorker_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_categoryId_transactionCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."transactionCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;