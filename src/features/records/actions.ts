"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { appointments, sessionRecords } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/log";
import { requireUser } from "@/lib/auth/session";
import { encryptRecordContent } from "@/lib/crypto/records";
import { sessionRecordFormSchema } from "@/features/records/schemas";
import type { ActionResponse } from "@/types/domain";

export async function saveSessionRecordAction(
  input: unknown,
): Promise<ActionResponse<{ appointmentId: string }>> {
  const user = await requireUser();
  const parsed = sessionRecordFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique o registro do atendimento.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = getDb();
  const [appointment] = await db
    .select({ id: appointments.id, patientId: appointments.patientId })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, parsed.data.appointmentId),
        eq(appointments.userId, user.id),
        eq(appointments.patientId, parsed.data.patientId),
        isNull(appointments.deletedAt),
      ),
    );

  if (!appointment) {
    return {
      success: false,
      message: "Atendimento nao encontrado.",
    };
  }

  const encrypted = encryptRecordContent(parsed.data.content);

  await db
    .insert(sessionRecords)
    .values({
      userId: user.id,
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      ...encrypted,
    })
    .onConflictDoUpdate({
      target: sessionRecords.appointmentId,
      set: {
        ...encrypted,
        updatedAt: new Date(),
      },
    });

  await writeAuditLog({
    userId: user.id,
    action: "update",
    entityType: "session_record",
    entityId: parsed.data.appointmentId,
  });

  revalidatePath(`/appointments/${parsed.data.appointmentId}`);
  revalidatePath(`/patients/${parsed.data.patientId}`);

  return {
    success: true,
    message: "Registro salvo com seguranca.",
    data: { appointmentId: parsed.data.appointmentId },
  };
}
