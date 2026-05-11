CREATE TYPE "public"."source" AS ENUM('backend', 'worker');--> statement-breakpoint
CREATE TYPE "public"."log_status" AS ENUM('duplicate', 'queued', 'invalid', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "job_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"user_id" uuid,
	"source" "source",
	"status" "log_status",
	"worker_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"job_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_log" ADD CONSTRAINT "job_log_job_id_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_logs_job_id_idx" ON "job_log" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_logs_user_id_idx" ON "job_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_logs_created_at_idx" ON "job_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_id_index" ON "jobs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "user_id_index" ON "jobs" USING btree ("user_id");