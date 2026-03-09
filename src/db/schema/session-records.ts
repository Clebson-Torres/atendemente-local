import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { appointments } from "@/db/schema/appointments";
import { patients } from "@/db/schema/patients";
import { users } from "@/db/schema/users";

export const sessionRecords = pgTable(
  "session_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "restrict" }),
    encryptedPayload: text("encrypted_payload").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    keyVersion: integer("key_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("session_records_user_idx").on(table.userId),
    patientIdx: index("session_records_patient_idx").on(table.patientId),
    appointmentIdx: uniqueIndex("session_records_appointment_uidx").on(table.appointmentId),
    deletedIdx: index("session_records_deleted_idx").on(table.deletedAt),
  }),
);
