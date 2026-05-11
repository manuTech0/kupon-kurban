import { randomUUID } from "node:crypto";
import { setSessions } from "./src/lib/auth";
import { getRedis } from "./src/lib/server/redis";

const sid = randomUUID();
const a = await setSessions(sid, {
	createdAt: new Date(),
	role: "ADMIN",
	userId: sid,
});
console.log(a, sid);
console.log(await getRedis().get(`sessions:${sid}`));
