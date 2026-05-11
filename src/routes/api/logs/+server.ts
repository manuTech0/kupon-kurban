import type { jobLogs } from "$lib/server/db/schema";
import { getRedis } from "$lib/server/redis";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, request }) => {
	const sub = getRedis().duplicate();

	await sub.subscribe("logs");

	const encoder = new TextEncoder();

	let closed = false;

	const stream = new ReadableStream({
		start(controller) {
			const onMessage = (_: string, message: string) => {
				if (closed) return;

				try {
					const data: typeof jobLogs.$inferSelect = JSON.parse(message);

					if (
						locals.user.role === "ADMIN" ||
						(locals.user.role === "SCANNER" &&
							locals.user.userId === data.userId)
					) {
						controller.enqueue(encoder.encode(`data: ${message}\n\n`));
					}
				} catch (err) {
					console.error(err);
				}
			};

			sub.on("message", onMessage);

			const cleanup = async () => {
				if (closed) return;

				closed = true;

				sub.off("message", onMessage);

				try {
					await sub.unsubscribe("logs");
				} catch {}

				try {
					sub.disconnect();
				} catch {}
			};

			request.signal.addEventListener("abort", cleanup);

			return cleanup;
		},

		async cancel() {
			closed = true;

			try {
				await sub.unsubscribe("logs");
			} catch {}

			try {
				sub.disconnect();
			} catch {}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
};
