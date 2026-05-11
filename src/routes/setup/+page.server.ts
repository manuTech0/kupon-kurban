import { type Actions, type Load, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { setup, users } from "$lib/server/db/schema";
import { generateUserToken } from "$lib/userToken";
import { createSessionFromToken } from "$lib/auth";

export const load: Load = async () => {
	const status = await db.query.setup.findFirst({
		where: (setup, { eq }) => eq(setup.id, 1),
	});
	if (status?.status) {
		throw redirect(303, "/login");
	}
};

export const actions: Actions = {
	setup: async ({ request }) => {
		try {
			const formData = await request.formData();
			const name = formData.get("name")?.toString();
			if (!name) {
				throw new Error("Name required");
			}
			const token = await generateUserToken();
			const [user] = await db
				.insert(users)
				.values({
					token_hash: token.code,
					name,
					role: "ADMIN",
				})
				.returning();
			const userToken = token.userToken(user.userId);
			return {
				success: true,
				userToken,
			};
		} catch (e) {
			if (e instanceof Error) {
				return {
					success: false,
					message: e.message,
				};
			}
			return {
				success: false,
				message: "Unexpected error",
			};
		}
	},
	complete: async ({ request, cookies }) => {
		try {
			const formData = await request.formData();
			const token = formData.get("token")?.toString();
			if (!token) {
				throw new Error("Token required");
			}
			await db
				.insert(setup)
				.values({
					id: 1,
					status: true,
				})
				.onConflictDoUpdate({
					target: setup.id,
					set: {
						status: true,
					},
				});
			const sessions = await createSessionFromToken(token, cookies);
			if (typeof sessions === "boolean" && !sessions) {
				return redirect(303, "/login");
			}
			if (sessions.role === "ADMIN") {
				return redirect(308, "/dashboard");
			} else if (sessions.role === "SCANNER") {
				return redirect(308, "/scanner");
			}
			return redirect(303, "/login");
		} catch (e) {
			if (e instanceof Error) {
				return {
					success: false,
					message: e.message,
				};
			}
			return {
				success: false,
				message: "Unexpected error",
			};
		}
	},
};
