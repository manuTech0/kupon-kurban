import { db } from "$lib/server/db";
import { couponHistory, coupons, recipients } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	// const rows = await db
	// 	.select({
	// 		recipient: recipients,
	// 		coupon: coupons,
	// 		history: couponHistory,
	// 	})
	// 	.from(recipients)
	// 	.leftJoin(coupons, eq(coupons.recipientId, recipients.id))
	// 	.leftJoin(couponHistory, eq(couponHistory.couponCodeId, coupons.couponId))
	// 	.orderBy(recipients.createdAt);
	// type RowsType = NonNullable<(typeof rows)[number]>;
	//
	// type param = RowsType["recipient"] & {
	// 	coupons: Map<
	// 		string,
	// 		RowsType["coupon"] & {
	// 			history: RowsType["history"];
	// 		}
	// 	>;
	// };
	// const recipientMap = new Map<string, param>();
	// for (const row of rows) {
	// 	const r = row.recipient;
	// 	const c = row.coupon;
	// 	const h = row.history;
	//
	// 	// === recipient ===
	// 	if (!recipientMap.has(r.id)) {
	// 		recipientMap.set(r.id, {
	// 			...r,
	// 			coupons: new Map(),
	// 		});
	// 	}
	//
	// 	const recipientEntry = recipientMap.get(r.id)!;
	//
	// 	// === coupon ===
	// 	if (c) {
	// 		if (!recipientEntry.coupons.has(c.couponId)) {
	// 			recipientEntry.coupons.set(c.couponId, {
	// 				...c,
	// 				history: [] as any,
	// 			});
	// 		}
	//
	// 		const couponEntry = recipientEntry.coupons.get(c.couponId)!;
	//
	// 		// === history ===
	// 		if (h) {
	// 			(couponEntry?.history as any).push(h);
	// 		}
	// 	}
	// }
	//
	// // convert Map -> Array
	// const result = Array.from(recipientMap.values()).map((r) => ({
	// 	...r,
	// 	coupons: Array.from(r.coupons.values()),
	// }));

	const results = await db.query.recipients.findMany({
		// orderBy: (r, { asc }) => [asc(r.createdAt)],
		with: {
			coupon: {
				with: {
					history: true,
				},
			},
		},
	});

	return {
		recipients: results,
	};
};
