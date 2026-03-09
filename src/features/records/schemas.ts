import { z } from "zod";

export const sessionRecordFormSchema = z.object({
  appointmentId: z.uuid("Atendimento invalido."),
  patientId: z.uuid("Paciente invalido."),
  content: z.string().trim().min(10, "Escreva um resumo com pelo menos 10 caracteres."),
});

export type SessionRecordFormInput = z.infer<typeof sessionRecordFormSchema>;
