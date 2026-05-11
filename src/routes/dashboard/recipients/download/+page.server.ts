import { db } from "$lib/server/db";
import { couponHistory, coupons, recipients } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async () => {
	const result = await db.query.recipients.findMany({
		with: {
			coupon: {
				with: {
					history: true,
				},
			},
		},
	});
	return {
		recipients: result,
	};
};
