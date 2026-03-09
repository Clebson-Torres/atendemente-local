"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertAppointmentPaymentAction } from "@/features/payments/actions";
import { paymentFormSchema, type PaymentFormInput } from "@/features/payments/schemas";
import { paymentMethods, paymentStatuses } from "@/types/domain";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCentsForInput,
  formatDateInputBR,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  maskDateInputBR,
  normalizeBRLCurrencyInput,
  parseBRLToCents,
  parseDateInputBR,
} from "@/lib/utils";

type PaymentFormProps = {
  defaultValues: PaymentFormInput;
};

function getPaymentAmountInputValue(value: PaymentFormInput["amountReceivedCents"]) {
  if (typeof value === "number") {
    return formatCentsForInput(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

export function PaymentForm({ defaultValues }: PaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentDateInput, setPaymentDateInput] = useState(() => formatDateInputBR(defaultValues.paidAt));
  const [amountInput, setAmountInput] = useState(() => getPaymentAmountInputValue(defaultValues.amountReceivedCents));

  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      ...defaultValues,
      amountReceivedCents: getPaymentAmountInputValue(defaultValues.amountReceivedCents),
    },
  });

  useEffect(() => {
    setPaymentDateInput(formatDateInputBR(defaultValues.paidAt));
    setAmountInput(getPaymentAmountInputValue(defaultValues.amountReceivedCents));
    form.setValue("paidAt", defaultValues.paidAt ?? "");
    form.setValue("amountReceivedCents", getPaymentAmountInputValue(defaultValues.amountReceivedCents));
  }, [defaultValues.amountReceivedCents, defaultValues.paidAt, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertAppointmentPaymentAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <input type="hidden" {...form.register("paidAt")} />
      <input type="hidden" {...form.register("amountReceivedCents")} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment-status">Status</Label>
          <Select id="payment-status" {...form.register("status")}>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {getPaymentStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-method">Forma de pagamento</Label>
          <Select id="payment-method" {...form.register("method")}>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {getPaymentMethodLabel(method)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment-date-input">Data de pagamento</Label>
          <Input
            id="payment-date-input"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={paymentDateInput}
            onChange={(event) => {
              const nextValue = maskDateInputBR(event.target.value);
              setPaymentDateInput(nextValue);
              form.setValue("paidAt", parseDateInputBR(nextValue), { shouldValidate: true, shouldDirty: true });
            }}
          />
          <FieldError message={form.formState.errors.paidAt?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-value-input">Valor recebido (R$)</Label>
          <Input
            id="payment-value-input"
            inputMode="decimal"
            placeholder="180,00"
            value={amountInput}
            onBlur={() => {
              const cents = parseBRLToCents(amountInput);
              if (Number.isFinite(cents)) {
                const normalized = formatCentsForInput(cents);
                setAmountInput(normalized);
                form.setValue("amountReceivedCents", normalized, { shouldValidate: true, shouldDirty: true });
              }
            }}
            onChange={(event) => {
              const nextValue = normalizeBRLCurrencyInput(event.target.value);
              setAmountInput(nextValue);
              form.setValue("amountReceivedCents", nextValue, { shouldValidate: true, shouldDirty: true });
            }}
          />
          <FieldError message={form.formState.errors.amountReceivedCents?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-notes">Observacoes</Label>
        <Textarea id="payment-notes" {...form.register("notes")} />
      </div>

      <input type="hidden" {...form.register("appointmentId")} />

      <Button disabled={isPending} type="submit">
        {isPending ? "Salvando..." : "Salvar pagamento"}
      </Button>
    </form>
  );
}
