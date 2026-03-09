import { relations } from "drizzle-orm";
import {
  appointments,
  auditLogs,
  patients,
  payments,
  recordFiles,
  sessionRecords,
  users,
} from "@/db/schema";

export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients),
  appointments: many(appointments),
  payments: many(payments),
  sessionRecords: many(sessionRecords),
  recordFiles: many(recordFiles),
  auditLogs: many(auditLogs),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  sessionRecords: many(sessionRecords),
  recordFiles: many(recordFiles),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  payment: one(payments, {
    fields: [appointments.id],
    references: [payments.appointmentId],
  }),
  sessionRecord: one(sessionRecords, {
    fields: [appointments.id],
    references: [sessionRecords.appointmentId],
  }),
  files: many(recordFiles),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
  receiptFiles: many(recordFiles),
}));

export const sessionRecordsRelations = relations(sessionRecords, ({ one }) => ({
  user: one(users, {
    fields: [sessionRecords.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [sessionRecords.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [sessionRecords.appointmentId],
    references: [appointments.id],
  }),
}));

export const recordFilesRelations = relations(recordFiles, ({ one }) => ({
  user: one(users, {
    fields: [recordFiles.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [recordFiles.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [recordFiles.appointmentId],
    references: [appointments.id],
  }),
  payment: one(payments, {
    fields: [recordFiles.paymentId],
    references: [payments.id],
  }),
}));
