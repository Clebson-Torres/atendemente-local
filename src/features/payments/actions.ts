"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { appointments, payments } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/log";
import { requireUser } from "@/lib/auth/session";
import { paymentFormSchema } from "@/features/payments/schemas";
import type { ActionResponse } from "@/types/domain";

export async function upsertAppointmentPaymentAction(
  input: unknown,
): Promise<ActionResponse<{ appointmentId: string }>> {
  const user = await requireUser();
  const parsed = paymentFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os dados do pagamento.",
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
        isNull(appointments.deletedAt),
      ),
    );

  if (!appointment) {
    return {
      success: false,
      message: "Atendimento nao encontrado.",
    };
  }

  const [payment] = await db
    .insert(payments)
    .values({
      userId: user.id,
      appointmentId: parsed.data.appointmentId,
      status: parsed.data.status,
      method: parsed.data.method,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
      amountReceivedCents: parsed.data.amountReceivedCents,
      notes: parsed.data.notes || null,
    })
    .onConflictDoUpdate({
      target: payments.appointmentId,
      set: {
        status: parsed.data.status,
        method: parsed.data.method,
        paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
        amountReceivedCents: parsed.data.amountReceivedCents,
        notes: parsed.data.notes || null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: payments.id });

  await writeAuditLog({
    userId: user.id,
    action: "update",
    entityType: "payment",
    entityId: payment.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  revalidatePath(`/appointments/${parsed.data.appointmentId}`);
  revalidatePath(`/patients/${appointment.patientId}`);

  return {
    success: true,
    message: "Pagamento salvo com sucesso.",
    data: { appointmentId: parsed.data.appointmentId },
  };
}
