import type { LogMeta } from "$lib/types/log";
import { db } from "./db";
import { jobLogs } from "./db/schema";
import { getRedis } from "./redis";

export async function appendLog(data: {
	jobId: string;
	userId: string;
	source: "backend" | "worker";
	status:
		| "queued"
		| "duplicate"
		| "invalid"
		| "success"
		| "failed"
		| "processing";

	level: "info" | "warn" | "error";
	meta?: LogMeta;
	workerId?: string;
}) {
	const [log] = await db.insert(jobLogs).values(data).returning();

	await getRedis().publish("logs", JSON.stringify(log));

	return log;
}
