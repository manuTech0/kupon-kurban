ALTER TABLE "coupon_history" DROP CONSTRAINT "coupon_history_recipient_id_recipients_id_fk";
--> statement-breakpoint
ALTER TABLE "coupon_history" DROP CONSTRAINT "coupon_history_users_id_user_user_id_fk";
--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "time" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "recipient_id" uuid;--> statement-breakpoint
ALTER TABLE "coupon_history" ADD CONSTRAINT "coupon_history_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_history" ADD CONSTRAINT "coupon_history_users_id_user_user_id_fk" FOREIGN KEY ("users_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" DROP COLUMN "expired_at";