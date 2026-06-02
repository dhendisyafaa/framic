CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'success', 'rejected');--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photographer_id" uuid NOT NULL,
	"jumlah" integer NOT NULL,
	"bank_name" text NOT NULL,
	"rekening_number" text NOT NULL,
	"rekening_name" text NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"rejected_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_photographer_id_photographer_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographer_profiles"("id") ON DELETE cascade ON UPDATE no action;