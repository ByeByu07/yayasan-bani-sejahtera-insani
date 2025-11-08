CREATE TABLE "invitationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	CONSTRAINT "invitationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "invitationToken" ADD CONSTRAINT "invitationToken_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;