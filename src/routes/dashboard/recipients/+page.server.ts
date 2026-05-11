import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db";
import {
	coupons,
	recipients,
} from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { getSlot } from "$lib/server/time";

const ZodPost = z.object({
	name: z.string().min(1, "Name is required").max(255, "Name too long"),
	address: z.string().min(1, "Address is required"),
});

export const load: PageServerLoad = async () => {
	const result = await db.query.recipients.findMany({
		with: {
			coupon: {
				with: {
					history: true
				}
			}
		}
	})
	return {
		recipients: result,
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const formData = await request.formData();
			const parsed = ZodPost.safeParse(Object.fromEntries(formData));

			if (!parsed.success) {
				return fail(400, {
					error: parsed.error.issues[0].message,
					data: Object.fromEntries(formData),
				});
			}
			await db.transaction(async (tx) => {
				const recp = await tx
					.insert(recipients)
					.values({
						name: parsed.data.name,
						address: parsed.data.address,
					})
					.returning();
				await tx.insert(coupons).values({
					recipientId: recp[0].id,
					time: getSlot(),
				});
			});

			return { success: true, message: "Recipient created successfully" };
		} catch (error) {
			console.error("Error creating recipient:", error);
			return fail(500, { error: "Failed to create recipient" });
		}
	},

	update: async ({ request }) => {
		try {
			const formData = await request.formData();
			const id = formData.get("id") as string;

			if (!id) {
				return fail(400, { error: "Recipient ID is required" });
			}

			const parsed = ZodPost.safeParse(Object.fromEntries(formData));

			if (!parsed.success) {
				return fail(400, {
					error: parsed.error.issues[0].message,
					data: Object.fromEntries(formData),
				});
			}

			await db
				.update(recipients)
				.set({
					name: parsed.data.name,
					address: parsed.data.address,
				})
				.where(eq(recipients.id, id));

			return { success: true, message: "Recipient updated successfully" };
		} catch (error) {
			console.error("Error updating recipient:", error);
			return fail(500, { error: "Failed to update recipient" });
		}
	},

	delete: async ({ request }) => {
		try {
			const formData = await request.formData();
			const id = formData.get("id") as string;

			if (!id) {
				return fail(400, { error: "Recipient ID is required" });
			}

			await db.delete(recipients).where(eq(recipients.id, id));

			return { success: true, message: "Recipient deleted successfully" };
		} catch (error) {
			console.error("Error deleting recipient:", error);
			return fail(500, { error: "Failed to delete recipient" });
		}
	},
};
