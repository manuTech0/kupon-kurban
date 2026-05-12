import { createSessionFromToken } from "$lib/auth";
import { type Actions, redirect } from "@sveltejs/kit";

export const actions: Actions = {
	signin: async ({ request, cookies }) => {
		const formData = await request.formData();
		const token = formData.get("token");
		if (!token) {
			return {
				success: false,
				message: "Token required",
			};
		}
		const sessions = await createSessionFromToken(token.toString(), cookies);
		if (typeof sessions === "boolean" && !sessions) {
			return {
				success: false,
				message: "Failed login",
			};
		}
		if (sessions.role === "ADMIN") {
			return redirect(303, "/dashboard");
		} else if (sessions.role === "SCANNER") {
			return redirect(303, "/scanner");
		}
		return {
			success: false,
			message: "Invalid user",
		};
	},
};
