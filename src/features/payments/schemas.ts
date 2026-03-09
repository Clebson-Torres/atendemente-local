import { z } from "zod";
import { parseBRLToCents } from "@/lib/utils";
import { paymentMethods, paymentStatuses } from "@/types/domain";

export const paymentFormSchema = z.object({
  appointmentId: z.uuid("Atendimento invalido."),
  status: z.enum(paymentStatuses),
  method: z.enum(paymentMethods),
  paidAt: z.string().optional().or(z.literal("")),
  amountReceivedCents: z.preprocess(
    (value) => parseBRLToCents(value as string | number | null | undefined),
    z.number().int().min(0, "Informe um valor valido."),
  ),
  notes: z.string().max(2_000).optional().or(z.literal("")),
});

export type PaymentFormInput = z.input<typeof paymentFormSchema>;
