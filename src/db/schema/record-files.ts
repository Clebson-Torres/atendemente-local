import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { appointments } from "@/db/schema/appointments";
import { patients } from "@/db/schema/patients";
import { payments } from "@/db/schema/payments";
import { users } from "@/db/schema/users";

export const recordFileKindEnum = pgEnum("record_file_kind", ["session_attachment", "payment_receipt"]);

export const recordFiles = pgTable(
  "record_files",
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
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "restrict" }),
    kind: recordFileKindEnum("kind").notNull().default("session_attachment"),
    storagePath: text("storage_path").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("record_files_user_idx").on(table.userId),
    patientIdx: index("record_files_patient_idx").on(table.patientId),
    appointmentIdx: index("record_files_appointment_idx").on(table.appointmentId),
    paymentIdx: index("record_files_payment_idx").on(table.paymentId),
    deletedIdx: index("record_files_deleted_idx").on(table.deletedAt),
  }),
);
