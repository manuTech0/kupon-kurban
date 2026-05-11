CREATE TYPE "public"."log_level" AS ENUM('info', 'warn', 'error');--> statement-breakpoint
ALTER TYPE "public"."log_status" ADD VALUE 'processing';--> statement-breakpoint
ALTER TABLE "job_log" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_log" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "meta" jsonb;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "level" "log_level";