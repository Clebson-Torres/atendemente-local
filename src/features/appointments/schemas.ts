import { z } from "zod";
import { parseBRLToCents } from "@/lib/utils";
import {
  appointmentConfirmationStatuses,
  appointmentStatuses,
  recurrenceEndModes,
  recurrenceFrequencies,
} from "@/types/domain";

export const appointmentFormSchema = z
  .object({
    patientId: z.uuid("Paciente invalido."),
    startsAt: z.string().min(1, "Informe a data e horario de inicio."),
    endsAt: z.string().min(1, "Informe a data e horario de fim."),
    status: z.enum(appointmentStatuses).default("scheduled"),
    confirmationStatus: z.enum(appointmentConfirmationStatuses).default("unconfirmed"),
    sessionPriceCents: z.preprocess(
      (value) => parseBRLToCents(value as string | number | null | undefined),
      z.number().int().min(0, "Informe um valor valido."),
    ),
    recurrenceFrequency: z.enum(recurrenceFrequencies).optional().nullable(),
    recurrenceEndMode: z.enum(recurrenceEndModes).optional().nullable(),
    recurrenceUntilDate: z.string().optional().or(z.literal("")),
    recurrenceOccurrences: z.preprocess(
      (value) => {
        if (value === "" || value === null || value === undefined) {
          return undefined;
        }

        if (typeof value === "number") {
          return value;
        }

        const parsed = Number(String(value).replace(/\D/g, ""));
        return Number.isFinite(parsed) ? parsed : undefined;
      },
      z.number().int().min(2, "Informe pelo menos 2 sessoes.").max(52, "Limite de 52 sessoes por serie.").optional(),
    ),
    quickNotes: z.string().max(2_000).optional().or(z.literal("")),
    cancelReason: z.string().max(2_000).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startsAt);
    const end = new Date(value.endsAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe datas validas.",
        path: ["startsAt"],
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O fim precisa ser depois do inicio.",
        path: ["endsAt"],
      });
    }

    if (!value.recurrenceFrequency) {
      return;
    }

    if (!value.recurrenceEndMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escolha como a recorrencia termina.",
        path: ["recurrenceEndMode"],
      });
      return;
    }

    if (value.recurrenceEndMode === "until_date") {
      if (!value.recurrenceUntilDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a data final da serie.",
          path: ["recurrenceUntilDate"],
        });
      }
    }

    if (value.recurrenceEndMode === "occurrences" && !value.recurrenceOccurrences) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade de sessoes.",
        path: ["recurrenceOccurrences"],
      });
    }
  });

export type AppointmentFormInput = z.input<typeof appointmentFormSchema>;
export type AppointmentFormOutput = z.output<typeof appointmentFormSchema>;
