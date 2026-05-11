import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { LogMeta } from "./../../types/log";

// =====================
// ENUMS
// =====================
export const userRole = pgEnum("userRole", ["ADMIN", "SCANNER"]);
export const historyStatus = pgEnum("status", ["USED", "DUPLICATE", "VALID"]);
export const logSource = pgEnum("source", ["backend", "worker"]);
export const logStatus = pgEnum("log_status", [
	"duplicate",
	"queued",
	"invalid",
	"success",
	"failed",
	"processing",
]);
export const logLevel = pgEnum("log_level", ["info", "warn", "error"]);

// =====================
// MISC
// =====================
export const couponCodeSeq = sql;

export const setup = pgTable("setup", {
	id: integer("id").primaryKey().default(1),
	status: boolean("status").default(false),
});

// =====================
// USERS
// =====================
export const users = pgTable("user", {
	userId: uuid("user_id").primaryKey().defaultRandom(),
	name: text("name"),
	token_hash: text("token").notNull(),
	role: userRole("role").default("SCANNER"),
});

// =====================
// RECIPIENTS
// =====================
export const recipients = pgTable("recipients", {
	id: uuid("id").defaultRandom().primaryKey(),
	idInt: serial("id_int"),
	name: varchar("name", { length: 255 }).notNull(),
	address: text("address").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipientsRelations = relations(recipients, ({ one }) => ({
	coupon: one(coupons, {
		fields: [recipients.id],
		references: [coupons.recipientId],
	}),
}));

// =====================
// COUPONS
// =====================
export const coupons = pgTable(
	"coupons",
	{
		couponId: uuid("coupon_id").defaultRandom().primaryKey(),
		time: varchar("time", { length: 10 }),
		code: serial("code").unique(),
		recipientId: uuid("recipient_id").references(() => recipients.id, {
			onDelete: "cascade",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		codeIdx: index("code_index").on(t.code),
	}),
);

export const jobs = pgTable(
	"jobs",
	{
		jobId: uuid("job_id").primaryKey().defaultRandom(),
		userId: uuid("user_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		idIdx: index("job_id_index").on(t.jobId),
		userIdx: index("user_id_index").on(t.userId),
	}),
);

export const jobLogs = pgTable(
	"job_log",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		jobId: uuid("job_id").references(() => jobs.jobId),
		userId: uuid("user_id"),
		source: logSource("source").notNull(),
		status: logStatus("status").notNull(),
		workerId: varchar("worker_id"),
		meta: jsonb("meta").$type<LogMeta>(),
		level: logLevel("level"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		jobIdIdx: index("job_logs_job_id_idx").on(table.jobId),

		userIdIdx: index("job_logs_user_id_idx").on(table.userId),

		createdAtIdx: index("job_logs_created_at_idx").on(table.createdAt),
	}),
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
	user: one(users, {
		fields: [jobs.userId],
		references: [users.userId],
	}),

	logs: many(jobLogs),
}));

export const jobLogsRelations = relations(jobLogs, ({ one }) => ({
	job: one(jobs, {
		fields: [jobLogs.jobId],
		references: [jobs.jobId],
	}),

	user: one(users, {
		fields: [jobLogs.userId],
		references: [users.userId],
	}),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
	recipient: one(recipients, {
		fields: [coupons.recipientId],
		references: [recipients.id],
	}),
	history: many(couponHistory),
}));

// =====================
// COUPON HISTORY
// =====================
export const couponHistory = pgTable("coupon_history", {
	id: uuid("id").defaultRandom().primaryKey(),
	couponCodeId: uuid("coupon_code_id")
		.references(() => coupons.couponId)
		.notNull(),
	recipientId: uuid("recipient_id").references(() => recipients.id, {
		onDelete: "cascade",
	}),
	userId: uuid("users_id").references(() => users.userId, {
		onDelete: "cascade",
	}),
	used: boolean("used").default(false),
	status: historyStatus("status").default("USED"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const couponHistoryRelations = relations(couponHistory, ({ one }) => ({
	coupon: one(coupons, {
		fields: [couponHistory.couponCodeId],
		references: [coupons.couponId],
	}),
	recipient: one(recipients, {
		fields: [couponHistory.recipientId],
		references: [recipients.id],
	}),
	user: one(users, {
		fields: [couponHistory.userId],
		references: [users.userId],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	history: many(couponHistory),
	jobs: many(jobs),

	logs: many(jobLogs),
}));
