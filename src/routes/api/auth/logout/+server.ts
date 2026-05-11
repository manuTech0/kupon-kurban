import { deleteSession } from "$lib/auth";
import type { RequestHandler } from "@sveltejs/kit";

const handle: RequestHandler = async ({ cookies }) => {
	await deleteSession(cookies);
	return new Response(
		JSON.stringify({
			OK: true,
		}),
	);
};
export { handle as GET, handle as POST };
