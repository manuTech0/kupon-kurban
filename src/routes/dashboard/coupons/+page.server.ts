import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db";
import { coupons, recipients } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

const ZodPost = z.object({
	time: z.string().optional(),
	recipientId: z.string(),
});

export const load: PageServerLoad = async () => {
	const couponList = await db.select().from(coupons).orderBy(coupons.createdAt);
	const recipient = await db.select().from(recipients).orderBy(recipients.name);
	return {
		coupons: couponList,
		recipient,
	};
};

export const actions: Actions = {
	// create: async ({ request, cookies }) => {
	// 	try {
	// 		const auth = await getSessionsWithUser(cookies)
	// 		if(!auth) {
	// 			console.log("Sessions failed")
	// 		}
	// 		const formData = await request.formData();
	// 		const parsed = ZodPost.safeParse(Object.fromEntries(formData));
	//
	// 		if (!parsed.success) {
	// 			return fail(400, {
	// 				error: parsed.error.issues[0].message,
	// 				data: Object.fromEntries(formData),
	// 			});
	// 		}
	//
	// 		await db.insert(coupons).values({
	// 			time: parsed.data.time ? new Date(parsed.data.time) : null,
	// 			recipientId: parsed.data.recipientId
	// 		});
	//
	// 		return { success: true, message: "Coupon created successfully" };
	// 	} catch (error) {
	// 		console.error("Error creating coupon:", error);
	// 		return fail(500, { error: "Failed to create coupon" });
	// 	}
	// },

	update: async ({ request }) => {
		try {
			const formData = await request.formData();
			const couponId = formData.get("couponId")?.toString();

			if (!couponId) {
				return fail(400, { error: "Coupon ID is required" });
			}

			const parsed = ZodPost.safeParse(Object.fromEntries(formData));

			console.log(parsed.data, formData);
			if (!parsed.success) {
				return fail(400, {
					error: parsed.error.issues[0].message,
					data: Object.fromEntries(formData),
				});
			}

			await db
				.update(coupons)
				.set({
					time: parsed.data.time,
					recipientId: parsed.data.recipientId,
				})
				.where(eq(coupons.couponId, couponId));

			return { success: true, message: "Coupon updated successfully" };
		} catch (error) {
			console.error("Error updating coupon:", error);
			return fail(500, { error: "Failed to update coupon" });
		}
	},

	delete: async ({ request }) => {
		try {
			const formData = await request.formData();
			const couponId = formData.get("couponId") as string;

			if (!couponId) {
				return fail(400, { error: "Coupon ID is required" });
			}

			await db.delete(coupons).where(eq(coupons.couponId, couponId));

			return { success: true, message: "Coupon deleted successfully" };
		} catch (error) {
			console.error("Error deleting coupon:", error);
			return fail(500, { error: "Failed to delete coupon" });
		}
	},
};
