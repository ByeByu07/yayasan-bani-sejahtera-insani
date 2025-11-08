ALTER TABLE "invitationToken" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "invitationToken" ADD COLUMN "maxUsage" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "invitationToken" ADD COLUMN "usedCount" integer DEFAULT 0 NOT NULL;