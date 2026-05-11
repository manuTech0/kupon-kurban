import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import {
	recipients,
	users,
	coupons,
	couponHistory,
} from "$lib/server/db/schema";
import { eq, count, desc } from "drizzle-orm";

export const load: PageServerLoad = async ({ setHeaders, depends }) => {
	depends("dash:stats");
	setHeaders({
		"cache-control": "no-store",
	});
	try {
		// Get counts for each entity
		const recipientCount = await db.select({ count: count() }).from(recipients);
		const userCount = await db.select({ count: count() }).from(users);
		const couponCount = await db.select({ count: count() }).from(coupons);
		const history = await db
			.select()
			.from(couponHistory)
			.leftJoin(coupons, eq(coupons.couponId, couponHistory.couponCodeId))
			.leftJoin(recipients, eq(coupons.recipientId, recipients.id))
			.orderBy(desc(couponHistory.createdAt));

		const stats = {
			recipients: recipientCount[0]?.count || 0,
			users: userCount[0]?.count || 0,
			coupons: couponCount[0]?.count || 0,
			couponHistory: history.length || 0,
		};

		return {
			stats,
			oldHistory: history,
		};
	} catch (error) {
		console.error("Error loading dashboard stats:", error);
		return {
			stats: {
				recipients: 0,
				users: 0,
				coupons: 0,
				couponHistory: 0,
			},
		};
	}
};
