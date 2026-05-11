import { json, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { jobs } from "$lib/server/db/schema";
import { logQueue, type QueueData } from "$lib/server/queue";
import { appendLog } from "$lib/server/log";
import { getSession } from "$lib/auth";

export const POST: RequestHandler = async ({ cookies, request }) => {
	const session = await getSession(cookies);
	if (!session)
		return json(
			{
				success: false,
				message: "User not found",
			},
			{ status: 401 },
		);
	const userId = session.userId;
	const data: {
		id: string;
		code: number;
	} = await request.json();

	const [job] = await db
		.insert(jobs)
		.values({
			userId,
		})
		.returning();

	await appendLog({
		jobId: job.jobId,
		userId,
		source: "backend",
		status: "queued",
		level: "info",
		meta: {
			recipientId: data.id,
			couponCode: data.code,
		},
	});

	await logQueue.add("process", {
		jobId: job.jobId,
		userId,
		couponCode: data.code,
		recipientId: data.id,
	} satisfies QueueData);

	return json({
		success: true,
		jobId: job.jobId,
	});
};
