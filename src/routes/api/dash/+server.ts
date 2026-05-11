import { getSession } from "$lib/auth";
import { db } from "$lib/server/db";
import {
	couponHistory,
	coupons,
	recipients,
	users,
} from "$lib/server/db/schema";
import { json, type RequestHandler } from "@sveltejs/kit";
import { count } from "drizzle-orm";
import { success } from "zod";

export const GET: RequestHandler = async ({ cookies }) => {
	const auth = await getSession(cookies);
	if (!auth) {
		return json(
			{
				success: false,
				message: "Access Danied",
			},
			{
				status: 401,
			},
		);
	}
	try {
		const recipientCount = await db.select({ count: count() }).from(recipients);
		const userCount = await db.select({ count: count() }).from(users);
		const couponCount = await db.select({ count: count() }).from(coupons);
		const historyCount = await db
			.select({ count: count() })
			.from(couponHistory);

		const stats = {
			recipients: recipientCount[0]?.count || 0,
			users: userCount[0]?.count || 0,
			coupons: couponCount[0]?.count || 0,
			couponHistory: historyCount[0]?.count || 0,
		};
		return json({
			success: true,
			stats,
		});
	} catch (e) {
		console.log(`Error: ${__dirname}`, e);
		return json(
			{
				success: false,
				message: "System unknown error",
			},
			{
				status: 500,
			},
		);
	}
};
