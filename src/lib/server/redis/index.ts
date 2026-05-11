import "dotenv/config";
import Redis from "ioredis";
import { env } from "process";

let redis: Redis | null = null;

export function getRedis(): Redis {
	if (redis) return redis;

	redis = new Redis(env.REDIS_URL, {
		maxRetriesPerRequest: null,
		retryStrategy(times) {
			const delay = Math.min(times * 50, 2000);
			return delay;
		},

		reconnectOnError(err) {
			const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
			if (targetErrors.some((e) => err.message.includes(e))) {
				return true;
			}
			return false;
		},

		enableReadyCheck: true,
		lazyConnect: false,
		keepAlive: 10_000,
	});

	// logging penting production
	redis.on("connect", () => {
		console.log("[redis] connected");
	});

	redis.on("error", (err) => {
		console.error("[redis] error", err);
	});

	redis.on("reconnecting", () => {
		console.warn("[redis] reconnecting...");
	});

	return redis;
}
