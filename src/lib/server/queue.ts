import { Queue } from "bullmq";
import { getRedis } from "./redis";

export const logQueue = new Queue("log-queue", {
	connection: getRedis(),
});

export type QueueData = {
	userId: string;
	recipientId: string;
	couponCode: number;
	jobId: string;
};
