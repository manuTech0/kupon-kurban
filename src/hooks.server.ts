// src/hooks.server.ts

import { redirect, type Handle } from "@sveltejs/kit";

import { getSession, deleteSession } from "$lib/auth";
import { db } from "$lib/server/db";

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	// setup check
	if (!pathname.startsWith("/setup")) {
		const setup = await db.query.setup.findFirst({
			columns: {
				status: true,
			},
			where: (setup, { eq }) => eq(setup.id, 1),
		});

		if (!setup?.status) {
			throw redirect(303, "/setup");
		}
	}

	const session = await getSession(event.cookies);

	if (session) {
		event.locals.user = {
			userId: session.userId,
			role: session.role,
		};
	}

	const isDashboard =
		pathname === "/dashboard" || pathname.startsWith("/dashboard/");

	const isScanner = pathname === "/scanner" || pathname.startsWith("/scanner/");

	const isLogin = pathname === "/login" || pathname.startsWith("/login/");

	// protected route
	if ((isDashboard || isScanner) && !session) {
		await deleteSession(event.cookies);

		throw redirect(303, "/login");
	}

	// dashboard admin only
	if (isDashboard && session && session?.role !== "ADMIN") {
		throw redirect(303, "/scanner");
	}

	// scanner only
	if (
		isScanner &&
		session &&
		session.role !== "ADMIN" &&
		session.role !== "SCANNER"
	) {
		await deleteSession(event.cookies);

		throw redirect(303, "/login");
	}

	// prevent login page access
	if (isLogin && session) {
		switch (session.role) {
			case "ADMIN":
				throw redirect(303, "/dashboard");

			case "SCANNER":
				throw redirect(303, "/scanner");
		}
	}

	return resolve(event);
};
