import { date, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { patients } from "@/db/schema/patients";
import { users } from "@/db/schema/users";

export const recurringFrequencyEnum = pgEnum("recurring_frequency", ["weekly", "biweekly"]);

export const recurringSeries = pgTable(
  "recurring_series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    frequency: recurringFrequencyEnum("frequency").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    occurrencesCount: integer("occurrences_count"),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("recurring_series_user_idx").on(table.userId),
    patientIdx: index("recurring_series_patient_idx").on(table.patientId),
    frequencyIdx: index("recurring_series_frequency_idx").on(table.frequency),
    cancelledIdx: index("recurring_series_cancelled_idx").on(table.cancelledAt),
  }),
);
