CREATE TYPE "public"."contract_status" AS ENUM('active', 'pending_expiry', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."dispute_raised_by" AS ENUM('customer', 'photographer');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'waiting_response', 'under_review', 'resolved_customer', 'resolved_photographer', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."dp_status" AS ENUM('unpaid', 'pending', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."initiated_by" AS ENUM('photographer', 'mitra');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mitra_type" AS ENUM('wedding_organizer', 'kampus', 'event_organizer', 'komunitas', 'perusahaan', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'dp_paid', 'ongoing', 'delivered', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('direct', 'event');--> statement-breakpoint
CREATE TYPE "public"."photographer_type" AS ENUM('independent', 'mitra_permanent', 'event_only');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('unpaid', 'pending', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"alamat" text,
	"nomor_telepon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"raised_by" "dispute_raised_by" NOT NULL,
	"raised_by_clerk_id" text NOT NULL,
	"alasan" text NOT NULL,
	"bukti_urls" text[] DEFAULT '{}' NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"response_text" text,
	"response_at" timestamp,
	"response_bukti_urls" text[] DEFAULT '{}' NOT NULL,
	"resolved_by_clerk_id" text,
	"catatan_resolusi" text,
	"resolved_at" timestamp,
	"auto_resolve_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_photographers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"photographer_id" uuid NOT NULL,
	"photographer_type" "photographer_type" NOT NULL,
	"initiated_by" "initiated_by",
	"invitation_status" "invitation_status",
	"invitation_message" text,
	"mou_generated_url" text,
	"photographer_signed_at" timestamp,
	"mitra_signed_at" timestamp,
	"photographer_ip" text,
	"mitra_ip" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mitra_id" uuid NOT NULL,
	"nama_event" text NOT NULL,
	"deskripsi" text,
	"tanggal_mulai" timestamp NOT NULL,
	"tanggal_selesai" timestamp NOT NULL,
	"lokasi" text NOT NULL,
	"cover_image_url" text,
	"fee_pg_tetap" integer,
	"fee_pg_per_event" integer,
	"kuota_pg_tetap" integer DEFAULT 0 NOT NULL,
	"kuota_pg_per_event" integer DEFAULT 0 NOT NULL,
	"is_open_recruitment" boolean DEFAULT false NOT NULL,
	"deadline_request" timestamp,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"clerk_id" text PRIMARY KEY NOT NULL,
	"roles" text[] DEFAULT '{"customer"}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"username" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "photographer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"bio" text,
	"kota_domisili" text NOT NULL,
	"username" text,
	"username_updated_at" timestamp,
	"kategori" text[] DEFAULT '{}' NOT NULL,
	"portfolio_urls" text[] DEFAULT '{}' NOT NULL,
	"rating_average" real DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"is_accepting_orders" boolean DEFAULT true NOT NULL,
	"base_minimum_fee" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "photographer_profiles_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "photographer_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "mitra_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"nama_organisasi" text NOT NULL,
	"tipe_mitra" "mitra_type" NOT NULL,
	"alamat" text NOT NULL,
	"nomor_telepon" text NOT NULL,
	"website_url" text,
	"dokumen_legalitas_url" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"platform_fee_percent" real DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mitra_profiles_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photographer_id" uuid NOT NULL,
	"nama_paket" text NOT NULL,
	"deskripsi" text NOT NULL,
	"harga" integer NOT NULL,
	"durasi_jam" integer NOT NULL,
	"jumlah_foto_min" integer NOT NULL,
	"includes_editing" boolean DEFAULT false NOT NULL,
	"kategori" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mitra_photographers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mitra_id" uuid NOT NULL,
	"photographer_id" uuid NOT NULL,
	"initiated_by" "initiated_by" NOT NULL,
	"invitation_status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invitation_message" text,
	"minimum_fee_per_event" integer,
	"tanggal_mulai" timestamp,
	"tanggal_selesai" timestamp,
	"mou_generated_url" text,
	"photographer_signed_at" timestamp,
	"mitra_signed_at" timestamp,
	"photographer_ip" text,
	"mitra_ip" text,
	"contract_status" "contract_status",
	"terminated_at" timestamp,
	"termination_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_clerk_id" text NOT NULL,
	"photographer_id" uuid NOT NULL,
	"paket_id" uuid,
	"order_type" "order_type" NOT NULL,
	"event_id" uuid,
	"lokasi" text NOT NULL,
	"tanggal_potret" timestamp NOT NULL,
	"catatan" text,
	"total_harga" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp,
	"dp_paid_at" timestamp,
	"delivered_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"jumlah_dp" integer NOT NULL,
	"status_dp" "dp_status" DEFAULT 'unpaid' NOT NULL,
	"xendit_invoice_id_dp" text,
	"tanggal_dp" timestamp,
	"jumlah_pelunasan" integer NOT NULL,
	"status_pelunasan" "settlement_status" DEFAULT 'unpaid' NOT NULL,
	"xendit_invoice_id_settle" text,
	"tanggal_pelunasan" timestamp,
	"jumlah_platform" integer,
	"jumlah_fotografer" integer,
	"platform_fee_percent" real NOT NULL,
	"metode_pembayaran" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"foto_url" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"ukuran_bytes" integer NOT NULL,
	"resolusi_width" integer,
	"resolusi_height" integer,
	"format" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"photographer_id" uuid NOT NULL,
	"customer_clerk_id" text NOT NULL,
	"rating" integer NOT NULL,
	"komentar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"sender_clerk_id" text NOT NULL,
	"pesan" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_clerk_id_users_clerk_id_fk" FOREIGN KEY ("clerk_id") REFERENCES "public"."users"("clerk_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_photographers" ADD CONSTRAINT "event_photographers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_photographers" ADD CONSTRAINT "event_photographers_photographer_id_photographer_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_mitra_id_mitra_profiles_id_fk" FOREIGN KEY ("mitra_id") REFERENCES "public"."mitra_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photographer_profiles" ADD CONSTRAINT "photographer_profiles_clerk_id_users_clerk_id_fk" FOREIGN KEY ("clerk_id") REFERENCES "public"."users"("clerk_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitra_profiles" ADD CONSTRAINT "mitra_profiles_clerk_id_users_clerk_id_fk" FOREIGN KEY ("clerk_id") REFERENCES "public"."users"("clerk_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_photographer_id_photographer_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitra_photographers" ADD CONSTRAINT "mitra_photographers_mitra_id_mitra_profiles_id_fk" FOREIGN KEY ("mitra_id") REFERENCES "public"."mitra_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mitra_photographers" ADD CONSTRAINT "mitra_photographers_photographer_id_photographer_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_photographer_id_photographer_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_paket_id_packages_id_fk" FOREIGN KEY ("paket_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_photographer_id_photographer_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;