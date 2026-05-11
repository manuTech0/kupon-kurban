import type { LayoutServerData, LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
	};
};
