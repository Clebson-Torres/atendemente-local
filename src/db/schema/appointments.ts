import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { patients } from "@/db/schema/patients";
import { recurringSeries } from "@/db/schema/recurring-series";
import { users } from "@/db/schema/users";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);
export const appointmentConfirmationStatusEnum = pgEnum("appointment_confirmation_status", [
  "unconfirmed",
  "confirmed",
  "cancelled",
]);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    seriesId: uuid("series_id").references(() => recurringSeries.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    confirmationStatus: appointmentConfirmationStatusEnum("confirmation_status").notNull().default("unconfirmed"),
    sessionPriceCents: integer("session_price_cents").notNull().default(0),
    quickNotes: text("quick_notes"),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("appointments_user_idx").on(table.userId),
    patientIdx: index("appointments_patient_idx").on(table.patientId),
    seriesIdx: index("appointments_series_idx").on(table.seriesId),
    startsAtIdx: index("appointments_starts_at_idx").on(table.startsAt),
    statusIdx: index("appointments_status_idx").on(table.status),
    confirmationStatusIdx: index("appointments_confirmation_status_idx").on(table.confirmationStatus),
    deletedIdx: index("appointments_deleted_idx").on(table.deletedAt),
  }),
);
