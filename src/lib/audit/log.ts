import "server-only";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { auditLogs } from "@/db/schema";
import type { AuditAction } from "@/types/domain";

type AuditInput = {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  const requestHeaders = await headers().catch(() => null);

  await getDb().insert(auditLogs).values({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
    ipAddress:
      input.ipAddress ??
      requestHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null,
    userAgent: input.userAgent ?? requestHeaders?.get("user-agent") ?? null,
  });
}
