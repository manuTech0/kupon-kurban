CREATE TYPE "public"."status" AS ENUM('USED', 'DUPLICATE', 'VALID');--> statement-breakpoint
CREATE TYPE "public"."userRole" AS ENUM('ADMIN', 'SCANNER');--> statement-breakpoint
CREATE TABLE "coupon_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_code_id" uuid NOT NULL,
	"recipient_id" uuid,
	"users_id" uuid,
	"used" boolean DEFAULT false,
	"status" "status" DEFAULT 'USED',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"coupon_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time" timestamp,
	"code" serial NOT NULL,
	"expired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"token" text NOT NULL,
	"role" "userRole" DEFAULT 'SCANNER'
);
--> statement-breakpoint
ALTER TABLE "coupon_history" ADD CONSTRAINT "coupon_history_coupon_code_id_coupons_coupon_id_fk" FOREIGN KEY ("coupon_code_id") REFERENCES "public"."coupons"("coupon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_history" ADD CONSTRAINT "coupon_history_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_history" ADD CONSTRAINT "coupon_history_users_id_user_user_id_fk" FOREIGN KEY ("users_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_index" ON "coupons" USING btree ("code");
CREATE SEQUENCE IF NOT EXISTS coupon_code_seq START 1000000; --> statement-breakpoint
