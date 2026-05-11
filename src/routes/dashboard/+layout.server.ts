import { getSession } from "$lib/auth";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
	const auth = await getSession(cookies);
	return {
		user: auth ? auth : undefined,
	};
};
