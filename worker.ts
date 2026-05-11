import { Worker } from "bullmq";
import { appendLog } from "./src/lib/server/log";
import type { QueueData } from "./src/lib/server/queue";
import { db } from "./src/lib/server/db";
import { getRedis } from "./src/lib/server/redis";
import { isWithin3Months } from "./src/lib/helper/within3Month";
import "dotenv";
import { couponHistory } from "./src/lib/server/db/schema";
import crypto from "crypto";

const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;

function log(level: "info" | "error" | "warn", msg: string, meta?: any) {
  console.log(
    `[${new Date().toISOString()}] [${workerId}] [${level.toUpperCase()}] ${msg}`,
    meta ? JSON.stringify(meta, null, 2) : ""
  );
}
log("info", "Worker Profile", {
	workerId,
	startIn: new Date().toISOString()
})

const worker = new Worker(
  "log-queue",
  async (job) => {
    const { jobId, userId, couponCode, recipientId } =
      job.data as QueueData;

    const attempt = job.attemptsMade + 1;

    log("info", "JOB START", {
      jobId,
      bullJobId: job.id,
      attempt,
      userId,
    });

    await appendLog({
      jobId,
      userId,
      source: "worker",
      status: "processing",
      level: "info",
      workerId,
      meta: { couponCode, recipientId },
    });

    try {
      log("info", "FETCH RECIPIENT START", {
        recipientId,
      });

      const data = await db.query.recipients.findFirst({
        where: (r, op) => op.eq(r.id, recipientId),
        with: {
          coupon: {
            with: {
              history: {
                orderBy: (h, { desc }) => [
                  desc(h.createdAt),
                ],
                limit: 4,
              },
            },
          },
        },
      });

      if (!data) {
        log("error", "RECIPIENT NOT FOUND", { recipientId });
        throw new Error("RECIPIENT_NOT_FOUND");
      }

      log("info", "RECIPIENT FETCHED", {
        recipientId,
        couponId: data.coupon?.couponId,
      });

      if (data?.coupon.code !== couponCode) {
        log("error", "INVALID COUPON CODE", {
          expected: data?.coupon.code,
          received: couponCode,
        });

        await appendLog({
          jobId,
          userId,
          source: "worker",
          status: "invalid",
          level: "error",
      		workerId,
          meta: {
            couponCode,
            recipientId,
          },
        });

        return;
      }

      const latestHistory = data.coupon.history?.[0];

      const isDuplicate =
        latestHistory &&
        latestHistory.status === "USED" &&
        isWithin3Months(latestHistory.createdAt);

      if (isDuplicate) {
        log("warn", "DUPLICATE DETECTED", {
          latestHistoryId: latestHistory?.id,
        });

        await appendLog({
          jobId,
          userId,
          source: "worker",
          status: "duplicate",
      		workerId,
          level: "error",
          meta: {
            couponCode,
            recipientId,
          },
        });

        return;
      }

      log("info", "START TRANSACTION");

      await db.transaction(async (tx) => {
        const latest =
          await tx.query.couponHistory.findFirst({
            where: (f, { eq }) =>
              eq(f.couponCodeId, data.coupon.couponId),
            orderBy: (h, { desc }) => [
              desc(h.createdAt),
            ],
          });

        const alreadyUsed =
          latest &&
          latest.status === "USED" &&
          isWithin3Months(latest.createdAt);

        if (alreadyUsed) {
          log("error", "RACE CONDITION DUPLICATE", {
            latestId: latest?.id,
          });
          throw new Error("DUPLICATE_COUPON");
        }

        await tx.insert(couponHistory).values({
          status: "USED",
          used: true,
          couponCodeId: data.coupon.couponId,
          recipientId,
          userId,
        });
      });

      log("info", "TRANSACTION SUCCESS");

      await appendLog({
        jobId,
        userId,
        source: "worker",
        status: "success",
        level: "info",
        workerId,
        meta: {
          couponCode,
          recipientId,
        },
      });

      log("info", "JOB COMPLETED SUCCESS");
    } catch (e) {
      log("error", "JOB FAILED", {
        error: e instanceof Error ? e.message : e,
      });

      console.error(e);

      if (
        e instanceof Error &&
        e.message === "DUPLICATE_COUPON"
      ) {
        await appendLog({
          jobId,
          userId,
          source: "worker",
          status: "duplicate",
          level: "error",
          workerId,
          meta: {
            couponCode,
            recipientId,
          },
        });
        return;
      }

      await appendLog({
        jobId,
        userId,
        source: "worker",
        status: "failed",
        level: "error",
        workerId,
        meta: {
          couponCode,
          recipientId,
        },
      });
    }
  },
  {
    connection: getRedis(),
    concurrency: 10,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  }
);

worker.on("completed", (job) => {
  console.log(
    `[${workerId}] COMPLETED job=${job.id} attempts=${job.attemptsMade}`
  );
});

worker.on("failed", (job, err) => {
  console.error(
    `[${workerId}] FAILED job=${job?.id} attempts=${job?.attemptsMade}`,
    err
  );
});
