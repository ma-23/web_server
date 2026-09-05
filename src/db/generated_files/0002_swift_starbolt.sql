CREATE TABLE "chirps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"body" varchar(140) NOT NULL,
	"userId" uuid
);
--> statement-breakpoint
ALTER TABLE "chirps" ADD CONSTRAINT "chirps_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;