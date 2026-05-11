import { randomUUID } from "node:crypto";
import { env } from "node:process";
import type { Cookies } from "@sveltejs/kit";
import ms, { type StringValue } from "ms";

import { SESSIONS_DURATION } from "$env/static/private";
import { db } from "./server/db";
import { getRedis } from "./server/redis";
import { verifyUserToken } from "./userToken";

export type SessionRole = "ADMIN" | "SCANNER";

export interface SessionPayload {
        userId: string;
        role: SessionRole;
        createdAt: number;
        name?: string ;
}

const SESSION_DURATION_MS = ms(
        (SESSIONS_DURATION ?? "1 days") as StringValue,
);

const SESSION_DURATION_SECONDS = Math.floor(
        SESSION_DURATION_MS / 1000,
);

export const sessionsKey = (sid: string) => `sessions:${sid}`;

export async function setSession(
        sid: string,
        payload: SessionPayload,
) {
        return getRedis().set(
                sessionsKey(sid),
                JSON.stringify(payload),
                "EX",
                SESSION_DURATION_SECONDS,
        );
}

export async function createSessionFromToken(
        token: string,
        cookies: Cookies,
) {
        try {
                const parseToken = verifyUserToken(token);

                const user = await db.query.users.findFirst({
                        columns: {
                                userId: true,
                                role: true,
                                name: true
                        },
                        where: (users, { eq }) =>
                                eq(users.userId, parseToken.data.userId),
                });

                if (
                        !user ||
                        (user.role !== "ADMIN" &&
                                user.role !== "SCANNER")
                ) {
                        throw new Error("Invalid role");
                }

                const sid = randomUUID();

                const payload: SessionPayload = {
                        userId: user.userId,
                        role: user.role,
                        createdAt: Date.now(),
                        name: user.name || undefined
                };

                await setSession(sid, payload);

                cookies.set("sid", sid, {
                        path: "/",
                        httpOnly: true,
                        sameSite: "strict",
                        secure: env.NODE_ENV === "production",
                        expires: new Date(
                                Date.now() + SESSION_DURATION_MS,
                        ),
                        maxAge: SESSION_DURATION_SECONDS,
                });

                return payload;
        } catch (e) {
                console.error("Failed create session", e);
                return false;
        }
}

export async function getSession(
        cookies: Cookies,
): Promise<(SessionPayload & { sid: string }) | false> {
        try {
                const sid = cookies.get("sid");

                if (!sid) return false;

                const redis = getRedis();

                const key = sessionsKey(sid);

                const payload = await redis.get(key);

                if (!payload) return false;

                const parsed = JSON.parse(payload) as SessionPayload;

                // sliding expiration
                await redis.expire(key, SESSION_DURATION_SECONDS);

                return {
                        sid,
                        ...parsed,
                };
        } catch (e) {
                console.error("Failed get session", e);
                return false;
        }
}

export async function deleteSession(cookies: Cookies) {
        try {
                const sid = cookies.get("sid");

                if (sid) {
                        await getRedis().del(sessionsKey(sid));
                }
        } catch (e) {
                console.error("Failed delete session", e);
        }

        cookies.delete("sid", {
                path: "/",
        });
}
