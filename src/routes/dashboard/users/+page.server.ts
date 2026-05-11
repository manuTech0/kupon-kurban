import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db";
import { userRole, users } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { generateUserToken } from "$lib/userToken";

const ZodPost = z.object({
	name: z.string().min(1, "Name is required").max(255, "Name too long"),
	role: z.enum(userRole.enumValues, {
		error: "Role must be ADMIN or SCANNER",
	}),
});

export const load: PageServerLoad = async () => {
	const userList = await db.select().from(users);
	return {
		users: userList,
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
			const token = await generateUserToken();
			const data = await db
				.insert(users)
				.values({
					name: parsed.data.name,
					role: parsed.data.role as "ADMIN" | "SCANNER",
					token_hash: token.code,
				})
				.returning();

			return {
				success: true,
				message: "User created successfully",
				userToken: `${parsed.data.name}: ${token.userToken(data[0].userId)}`,
			};
		} catch (error) {
			console.error("Error creating user:", error);
			return fail(500, { error: "Failed to create user" });
		}
	},

	update: async ({ request }) => {
		try {
			const formData = await request.formData();
			const userId = formData.get("userId") as string;

			if (!userId) {
				return fail(400, { error: "User ID is required" });
			}

			const parsed = ZodPost.safeParse(Object.fromEntries(formData));

			if (!parsed.success) {
				return fail(400, {
					error: parsed.error.issues[0].message,
					data: Object.fromEntries(formData),
				});
			}

			await db
				.update(users)
				.set({
					name: parsed.data.name,
					role: parsed.data.role as "ADMIN" | "SCANNER",
				})
				.where(eq(users.userId, userId));

			return { success: true, message: "User updated successfully" };
		} catch (error) {
			console.error("Error updating user:", error);
			return fail(500, { error: "Failed to update user" });
		}
	},

	delete: async ({ request }) => {
		try {
			const formData = await request.formData();
			const userId = formData.get("userId") as string;

			if (!userId) {
				return fail(400, { error: "User ID is required" });
			}

			await db.delete(users).where(eq(users.userId, userId));

			return { success: true, message: "User deleted successfully" };
		} catch (error) {
			console.error("Error deleting user:", error);
			return fail(500, { error: "Failed to delete user" });
		}
	},
};
