import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db";
import {
	couponHistory,
	coupons,
	recipients,
	users,
} from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { getSession } from "$lib/auth";

const ZodPost = z.object({
	couponCodeId: z.string().uuid("Invalid coupon ID"),
	recipientId: z.string().uuid("Invalid recipient ID"),
	used: z.coerce.boolean().optional(),
	status: z.enum(["USED", "DUPLICATE", "VALID"], {
		error: "Status must be USED, DUPLICATE, or VALID",
	}),
});

export const load: PageServerLoad = async () => {
	// const historyList = await db
	// 	.select({
	// 		id: couponHistory.id,
	// 		used: couponHistory.used,
	// 		status: couponHistory.status,
	// 		createdAt: couponHistory.createdAt,
	// 		couponCodeId: couponHistory.couponCodeId,
	// 		recipientId: couponHistory.recipientId,
	// 		userId: couponHistory.userId,
	// 		couponCode: coupons.code,
	// 		recipientName: recipients.name,
	// 		userName: users.name,
	// 	})
	// 	.from(couponHistory)
	// 	.leftJoin(coupons, eq(couponHistory.couponCodeId, coupons.couponId))
	// 	.leftJoin(recipients, eq(couponHistory.recipientId, recipients.id))
	// 	.leftJoin(users, eq(couponHistory.userId, users.userId))
	// 	.orderBy(couponHistory.createdAt);
	//
	// const couponsList = await db.select().from(coupons);
	// const recipientsList = await db.select().from(recipients);
	// const usersList = await db.select().from(users);

	const result = await db.query.recipients.findMany({
		with: {
			coupon: {
				with: {
					history: {
						with: {
							user: true
						}
					}
				}
			}
		}
	})
	const history = result.flatMap(r => r.coupon.history.map(h => ({
		...h,
		recipient: r
	})))
	history
	return {
		history,
		recipient: result
		// history: historyList,
		// coupons: couponsList,
		// recipients: recipientsList,
		// users: usersList,
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		try {
			const auth = await getSession(cookies);
			const formData = await request.formData();
			const parsed = ZodPost.safeParse(Object.fromEntries(formData));

			if (!parsed.success) {
				return fail(400, {
					error: parsed.error.issues[0].message,
					data: Object.fromEntries(formData),
				});
			}

			await db.insert(couponHistory).values({
				couponCodeId: parsed.data.couponCodeId,
				recipientId: parsed.data.recipientId,
				userId: auth ? auth.userId : undefined,
				used: parsed.data.used,
				status: parsed.data.status,
			});

			return { success: true, message: "Coupon history created successfully" };
		} catch (error) {
			console.error("Error creating coupon history:", error);
			return fail(500, { error: "Failed to create coupon history" });
		}
	},

	update: async ({ request, cookies }) => {
		try {
			const auth = await getSession(cookies);
			const formData = await request.formData();
			const id = formData.get("id") as string;

			if (!id) {
				return fail(400, { error: "History ID is required" });
			}

			const parsed = ZodPost.safeParse(Object.fromEntries(formData));

			if (!parsed.success) {
				return fail(400, {
					error: parsed.error.issues[0].message,
					data: Object.fromEntries(formData),
				});
			}

			await db
				.update(couponHistory)
				.set({
					couponCodeId: parsed.data.couponCodeId,
					recipientId: parsed.data.recipientId,
					userId: auth ? auth.userId : undefined,
					used: parsed.data.used,
					status: parsed.data.status,
				})
				.where(eq(couponHistory.id, id));

			return { success: true, message: "Coupon history updated successfully" };
		} catch (error) {
			console.error("Error updating coupon history:", error);
			return fail(500, { error: "Failed to update coupon history" });
		}
	},

	delete: async ({ request }) => {
		try {
			const formData = await request.formData();
			const id = formData.get("id") as string;

			if (!id) {
				return fail(400, { error: "History ID is required" });
			}

			await db.delete(couponHistory).where(eq(couponHistory.id, id));

			return { success: true, message: "Coupon history deleted successfully" };
		} catch (error) {
			console.error("Error deleting coupon history:", error);
			return fail(500, { error: "Failed to delete coupon history" });
		}
	},
};
