import type { userRole } from "$lib/server/db/schema";

export interface Sessions {
	userId: string;
	role: (typeof userRole.enumValues)[number];
	createdAt: Date;
}
