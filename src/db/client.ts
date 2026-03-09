import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getRequiredEnv } from "@/lib/env";

function createDatabase() {
  const client = postgres(getRequiredEnv("DATABASE_URL"), {
    max: 1,
    prepare: false,
  });

  return drizzle(client, { schema });
}

type Database = ReturnType<typeof createDatabase>;

declare global {
  var __atendementeDb__: Database | undefined;
}

export function getDb() {
  if (!global.__atendementeDb__) {
    global.__atendementeDb__ = createDatabase();
  }

  return global.__atendementeDb__;
}
