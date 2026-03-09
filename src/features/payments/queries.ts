import "server-only";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { appointments, patients, payments } from "@/db/schema";

export async function getFinancialSummary(userId: string) {
  const db = getDb();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setMilliseconds(-1);

  const [summary] = await db
    .select({
      paidCents:
        sql<number>`coalesce(sum(case when ${payments.status} = 'paid' then ${payments.amountReceivedCents} else 0 end), 0)`.mapWith(
          Number,
        ),
      pendingCents:
        sql<number>`coalesce(sum(case when ${payments.status} = 'pending' then ${appointments.sessionPriceCents} else 0 end), 0)`.mapWith(
          Number,
        ),
    })
    .from(payments)
    .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
    .where(
      and(
        eq(payments.userId, userId),
        isNull(payments.deletedAt),
        gte(appointments.startsAt, monthStart),
        lte(appointments.startsAt, monthEnd),
      ),
    );

  return {
    paidCents: summary?.paidCents ?? 0,
    pendingCents: summary?.pendingCents ?? 0,
  };
}

export async function listPendingPayments(userId: string) {
  return getDb()
    .select({
      id: payments.id,
      appointmentId: payments.appointmentId,
      status: payments.status,
      method: payments.method,
      amountReceivedCents: payments.amountReceivedCents,
      paidAt: payments.paidAt,
      patientName: patients.fullName,
      startsAt: appointments.startsAt,
      sessionPriceCents: appointments.sessionPriceCents,
    })
    .from(payments)
    .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .where(and(eq(payments.userId, userId), eq(payments.status, "pending"), isNull(payments.deletedAt)))
    .orderBy(desc(appointments.startsAt));
}

export async function listPayments(userId: string) {
  return getDb()
    .select({
      id: payments.id,
      appointmentId: payments.appointmentId,
      status: payments.status,
      method: payments.method,
      amountReceivedCents: payments.amountReceivedCents,
      paidAt: payments.paidAt,
      patientName: patients.fullName,
      startsAt: appointments.startsAt,
      sessionPriceCents: appointments.sessionPriceCents,
    })
    .from(payments)
    .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .where(and(eq(payments.userId, userId), isNull(payments.deletedAt)))
    .orderBy(desc(appointments.startsAt));
}
