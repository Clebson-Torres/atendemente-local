import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const requestLimits = pgTable(
  "request_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: text("scope").notNull(),
    identifier: text("identifier").notNull(),
    hits: integer("hits").notNull().default(0),
    windowStartsAt: timestamp("window_starts_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    scopeIdentifierIdx: index("request_limits_scope_identifier_idx").on(table.scope, table.identifier),
    windowIdx: index("request_limits_window_idx").on(table.windowStartsAt),
  }),
);
