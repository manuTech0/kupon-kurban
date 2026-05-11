import { db } from "$lib/server/db";
import { jobs, jobLogs, recipients, users } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export type JobLog = {
	id: string;
	jobId: string | null;
	status: "duplicate" | "queued" | "invalid" | "success" | "failed" | "processing";
	source: "backend" | "worker";
	level: "info" | "warn" | "error" | null;
	workerId: string | null;
	meta: Record<string, any> | null;
	createdAt: Date;
};

export type Job = {
	jobId: string;
	userId: string | null;
	createdAt: Date;
	userName: string | null;
	logs: JobLog[];
};

export type RecipientGroup = {
	recipientId: string;
	name: string;
	address: string;
	totalJobs: number;
	latestStatus: string;
	latestAt: Date;
	jobs: Job[];
};

export const load: PageServerLoad = async () => {
	// Fetch all raw rows (flat join: 1 row per log)
	const rows = await db
		.select({
			jobId: jobs.jobId,
			jobUserId: jobs.userId,
			jobCreatedAt: jobs.createdAt,
			userName: users.name,
			logId: jobLogs.id,
			logStatus: jobLogs.status,
			logSource: jobLogs.source,
			logLevel: jobLogs.level,
			logWorkerId: jobLogs.workerId,
			logMeta: jobLogs.meta,
			logCreatedAt: jobLogs.createdAt,
		})
		.from(jobs)
		.leftJoin(jobLogs, eq(jobs.jobId, jobLogs.jobId))
		.leftJoin(users, eq(jobs.userId, users.userId))
		.orderBy(desc(jobs.createdAt), desc(jobLogs.createdAt));

	const allRecipients = await db.select().from(recipients);
	const recipientMap = new Map(allRecipients.map((r) => [r.id, r]));

	// Aggregate: Map<recipientId, Map<jobId, Job>>
	const recipientJobs = new Map<string, Map<string, Job>>();

	for (const row of rows) {
		const recipientId = (row.logMeta as any)?.recipientId as string | undefined;
		if (!recipientId) continue;

		if (!recipientJobs.has(recipientId)) {
			recipientJobs.set(recipientId, new Map());
		}

		const jobsForRecipient = recipientJobs.get(recipientId)!;

		if (!jobsForRecipient.has(row.jobId)) {
			jobsForRecipient.set(row.jobId, {
				jobId: row.jobId,
				userId: row.jobUserId,
				createdAt: row.jobCreatedAt,
				userName: row.userName ?? null,
				logs: [],
			});
		}

		// Only add log if it exists (leftJoin may yield null logId)
		if (row.logId && row.logCreatedAt) {
			const job = jobsForRecipient.get(row.jobId)!;
			// Prevent duplicates if query returns multiple rows per log
			if (!job.logs.find((l) => l.id === row.logId)) {
				job.logs.push({
					id: row.logId,
					jobId: row.jobId,
					status: row.logStatus!,
					source: row.logSource!,
					level: row.logLevel ?? null,
					workerId: row.logWorkerId ?? null,
					meta: row.logMeta as any,
					createdAt: row.logCreatedAt,
				});
			}
		}
	}

	// Build final grouped structure
	const grouped: RecipientGroup[] = [];

	for (const [recipientId, jobsMap] of recipientJobs.entries()) {
		const recipient = recipientMap.get(recipientId);
		const jobsArr = Array.from(jobsMap.values());

		// Latest log across all jobs for this recipient
		const allLogs = jobsArr.flatMap((j) => j.logs);
		allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		grouped.push({
			recipientId,
			name: recipient?.name ?? `Recipient ${recipientId.slice(0, 8)}`,
			address: recipient?.address ?? "—",
			totalJobs: jobsArr.length,
			latestStatus: allLogs[0]?.status ?? "queued",
			latestAt: allLogs[0]?.createdAt ?? jobsArr[0].createdAt,
			jobs: jobsArr,
		});
	}

	// Sort recipients: most recently active first
	grouped.sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());

	return {
		grouped,
		recipients: allRecipients,
	};
};
