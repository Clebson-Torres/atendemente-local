import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { appointments } from "@/db/schema/appointments";
import { users } from "@/db/schema/users";

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "cash",
  "card",
  "bank_transfer",
  "other",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "restrict" }),
    status: paymentStatusEnum("status").notNull().default("pending"),
    method: paymentMethodEnum("method").notNull().default("other"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    amountReceivedCents: integer("amount_received_cents").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("payments_user_idx").on(table.userId),
    appointmentIdx: uniqueIndex("payments_appointment_uidx").on(table.appointmentId),
    statusIdx: index("payments_status_idx").on(table.status),
    deletedIdx: index("payments_deleted_idx").on(table.deletedAt),
  }),
);
