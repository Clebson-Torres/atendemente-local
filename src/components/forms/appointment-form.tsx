"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  cancelAppointmentAction,
  createAppointmentAction,
  updateAppointmentAction,
} from "@/features/appointments/actions";
import {
  appointmentFormSchema,
  type AppointmentFormInput,
  type AppointmentFormOutput,
} from "@/features/appointments/schemas";
import { appointmentConfirmationStatuses, appointmentStatuses, recurrenceEndModes, recurrenceFrequencies } from "@/types/domain";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addOneHourToTimeInput,
  combineDateAndTimeInput,
  formatCentsForInput,
  formatDateInputBR,
  getRecurrenceEndModeLabel,
  getRecurrenceFrequencyLabel,
  getAppointmentConfirmationLabel,
  getAppointmentStatusLabel,
  maskDateInputBR,
  maskTimeInput,
  normalizeBRLCurrencyInput,
  parseBRLToCents,
  parseDateInputBR,
  splitDateTimeInput,
} from "@/lib/utils";

type AppointmentFormProps = {
  appointmentId?: string;
  patientOptions: Array<{ id: string; fullName: string }>;
  defaultValues?: Partial<AppointmentFormInput>;
  afterSuccess?: (appointmentId: string) => void;
};

function getPriceInputValue(value: AppointmentFormInput["sessionPriceCents"] | undefined) {
  if (typeof value === "number") {
    return formatCentsForInput(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "180,00";
}

export function AppointmentForm({
  appointmentId,
  patientOptions,
  defaultValues,
  afterSuccess,
}: AppointmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priceInput, setPriceInput] = useState(() => getPriceInputValue(defaultValues?.sessionPriceCents));
  const [duplicateAppointmentId, setDuplicateAppointmentId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(() => formatDateInputBR(defaultValues?.startsAt));
  const [startTimeInput, setStartTimeInput] = useState(() => splitDateTimeInput(defaultValues?.startsAt).time);
  const [endTimeInput, setEndTimeInput] = useState(() => splitDateTimeInput(defaultValues?.endsAt).time);
  const [recurrenceUntilDateInput, setRecurrenceUntilDateInput] = useState("");

  const form = useForm<AppointmentFormInput, unknown, AppointmentFormOutput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: defaultValues?.patientId ?? patientOptions[0]?.id ?? "",
      startsAt: defaultValues?.startsAt ?? "",
      endsAt: defaultValues?.endsAt ?? "",
      status: defaultValues?.status ?? "scheduled",
      confirmationStatus: defaultValues?.confirmationStatus ?? "unconfirmed",
      sessionPriceCents: getPriceInputValue(defaultValues?.sessionPriceCents),
      recurrenceFrequency: defaultValues?.recurrenceFrequency ?? null,
      recurrenceEndMode: defaultValues?.recurrenceEndMode ?? "occurrences",
      recurrenceUntilDate: defaultValues?.recurrenceUntilDate ?? "",
      recurrenceOccurrences: defaultValues?.recurrenceOccurrences ?? 8,
      quickNotes: defaultValues?.quickNotes ?? "",
      cancelReason: defaultValues?.cancelReason ?? "",
    },
  });

  useEffect(() => {
    const startParts = splitDateTimeInput(defaultValues?.startsAt);
    const endParts = splitDateTimeInput(defaultValues?.endsAt);

    setDateInput(formatDateInputBR(defaultValues?.startsAt));
    setStartTimeInput(startParts.time);
    setEndTimeInput(endParts.time);
    setPriceInput(getPriceInputValue(defaultValues?.sessionPriceCents));

    form.setValue("patientId", defaultValues?.patientId ?? patientOptions[0]?.id ?? "");
    form.setValue("startsAt", defaultValues?.startsAt ?? "");
    form.setValue("endsAt", defaultValues?.endsAt ?? "");
    form.setValue("status", defaultValues?.status ?? "scheduled");
    form.setValue("confirmationStatus", defaultValues?.confirmationStatus ?? "unconfirmed");
    form.setValue("sessionPriceCents", getPriceInputValue(defaultValues?.sessionPriceCents));
    form.setValue("recurrenceFrequency", defaultValues?.recurrenceFrequency ?? null);
    form.setValue("recurrenceEndMode", defaultValues?.recurrenceEndMode ?? "occurrences");
    form.setValue("recurrenceUntilDate", defaultValues?.recurrenceUntilDate ?? "");
    form.setValue("recurrenceOccurrences", defaultValues?.recurrenceOccurrences ?? 8);
    setRecurrenceUntilDateInput(formatDateInputBR(defaultValues?.recurrenceUntilDate));
  }, [
    defaultValues?.confirmationStatus,
    defaultValues?.endsAt,
    defaultValues?.patientId,
    defaultValues?.recurrenceEndMode,
    defaultValues?.recurrenceFrequency,
    defaultValues?.recurrenceOccurrences,
    defaultValues?.recurrenceUntilDate,
    defaultValues?.sessionPriceCents,
    defaultValues?.startsAt,
    defaultValues?.status,
    form,
    patientOptions,
  ]);

  const syncDateAndTimes = (nextDate: string, nextStartTime: string, nextEndTime: string) => {
    form.setValue("startsAt", combineDateAndTimeInput(nextDate, nextStartTime), {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("endsAt", combineDateAndTimeInput(nextDate, nextEndTime), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setDuplicateAppointmentId(null);
      const result = appointmentId
        ? await updateAppointmentAction(appointmentId, values)
        : await createAppointmentAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setDuplicateAppointmentId(result.data?.duplicateAppointmentId ?? null);
      const nextAppointmentId = result.data?.appointmentId ?? appointmentId;

      if (nextAppointmentId && afterSuccess) {
        afterSuccess(nextAppointmentId);
        router.refresh();
        return;
      }

      if (!appointmentId && nextAppointmentId) {
        router.push(`/appointments/${nextAppointmentId}`);
      }

      router.refresh();
    });
  });

  const handleCancel = () => {
    if (!appointmentId) {
      return;
    }

    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId, form.getValues("cancelReason") || "");

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <input type="hidden" {...form.register("startsAt")} />
      <input type="hidden" {...form.register("endsAt")} />
      <input type="hidden" {...form.register("sessionPriceCents")} />
      <input type="hidden" {...form.register("recurrenceUntilDate")} />

      <div className="space-y-2">
        <Label htmlFor="patientId">Paciente</Label>
        <Select id="patientId" {...form.register("patientId")}>
          {patientOptions.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.fullName}
            </option>
          ))}
        </Select>
        <FieldError message={form.formState.errors.patientId?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appointment-date">Data selecionada</Label>
        <Input
          id="appointment-date"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          value={dateInput}
          onChange={(event) => {
            const nextDate = maskDateInputBR(event.target.value);
            setDateInput(nextDate);
            syncDateAndTimes(nextDate, startTimeInput, endTimeInput);
          }}
        />
        <FieldError message={form.formState.errors.startsAt?.message} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start-time">Horario de inicio</Label>
          <Input
            id="start-time"
            inputMode="numeric"
            placeholder="hh:mm"
            value={startTimeInput}
            onChange={(event) => {
              const nextStartTime = maskTimeInput(event.target.value);
              const nextEndTime = addOneHourToTimeInput(nextStartTime);
              setStartTimeInput(nextStartTime);
              setEndTimeInput(nextEndTime);
              syncDateAndTimes(dateInput, nextStartTime, nextEndTime);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-time">Horario final</Label>
          <Input
            id="end-time"
            inputMode="numeric"
            placeholder="hh:mm"
            value={endTimeInput}
            onChange={(event) => {
              const nextEndTime = maskTimeInput(event.target.value);
              setEndTimeInput(nextEndTime);
              syncDateAndTimes(dateInput, startTimeInput, nextEndTime);
            }}
          />
          <FieldError message={form.formState.errors.endsAt?.message} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status do atendimento</Label>
          <Select id="status" {...form.register("status")}>
            {appointmentStatuses.map((status) => (
              <option key={status} value={status}>
                {getAppointmentStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmationStatus">Confirmacao</Label>
          <Select id="confirmationStatus" {...form.register("confirmationStatus")}>
            {appointmentConfirmationStatuses.map((status) => (
              <option key={status} value={status}>
                {getAppointmentConfirmationLabel(status)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!appointmentId ? (
        <div className="space-y-4 rounded-3xl border border-border/80 bg-muted/25 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Recorrencia</p>
            <p className="text-sm text-muted-foreground">
              Use quando este paciente ja tem horario fixo semanal ou quinzenal.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrenceFrequency">Tipo de agendamento</Label>
            <Select
              id="recurrenceFrequency"
              {...form.register("recurrenceFrequency")}
              onChange={(event) => {
                const value = event.target.value || null;
                form.setValue("recurrenceFrequency", value as AppointmentFormInput["recurrenceFrequency"], {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <option value="">Atendimento unico</option>
              {recurrenceFrequencies.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {getRecurrenceFrequencyLabel(frequency)}
                </option>
              ))}
            </Select>
          </div>

          {form.watch("recurrenceFrequency") ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recurrenceEndMode">Termino da serie</Label>
                <Select id="recurrenceEndMode" {...form.register("recurrenceEndMode")}>
                  {recurrenceEndModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {getRecurrenceEndModeLabel(mode)}
                    </option>
                  ))}
                </Select>
                <FieldError message={form.formState.errors.recurrenceEndMode?.message} />
              </div>

              {form.watch("recurrenceEndMode") === "until_date" ? (
                <div className="space-y-2">
                  <Label htmlFor="recurrenceUntilDateInput">Ate quando repetir</Label>
                  <Input
                    id="recurrenceUntilDateInput"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={recurrenceUntilDateInput}
                    onChange={(event) => {
                      const nextValue = maskDateInputBR(event.target.value);
                      setRecurrenceUntilDateInput(nextValue);
                      form.setValue("recurrenceUntilDate", parseDateInputBR(nextValue), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  <FieldError message={form.formState.errors.recurrenceUntilDate?.message} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="recurrenceOccurrences">Quantidade de sessoes</Label>
                  <Input
                    id="recurrenceOccurrences"
                    inputMode="numeric"
                    min={2}
                    type="number"
                    {...form.register("recurrenceOccurrences")}
                  />
                  <FieldError message={form.formState.errors.recurrenceOccurrences?.message} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="sessionPriceInput">Valor da sessao (R$)</Label>
        <Input
          id="sessionPriceInput"
          inputMode="decimal"
          placeholder="180,00"
          value={priceInput}
          onBlur={() => {
            const cents = parseBRLToCents(priceInput);
            if (Number.isFinite(cents)) {
              const normalized = formatCentsForInput(cents);
              setPriceInput(normalized);
              form.setValue("sessionPriceCents", normalized, { shouldValidate: true, shouldDirty: true });
            }
          }}
          onChange={(event) => {
            const nextValue = normalizeBRLCurrencyInput(event.target.value);
            setPriceInput(nextValue);
            form.setValue("sessionPriceCents", nextValue, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <FieldError message={form.formState.errors.sessionPriceCents?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quickNotes">Observacoes administrativas rapidas</Label>
        <Textarea id="quickNotes" {...form.register("quickNotes")} />
      </div>

      {duplicateAppointmentId ? (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Ja existe outro agendamento deste paciente no mesmo dia.
          {" "}
          <Link className="font-semibold underline" href={`/appointments/${duplicateAppointmentId}`}>
            Abrir agendamento existente
          </Link>
        </div>
      ) : null}

      {appointmentId ? (
        <div className="space-y-2">
          <Label htmlFor="cancelReason">Motivo do cancelamento</Label>
          <Textarea id="cancelReason" {...form.register("cancelReason")} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : appointmentId ? "Salvar alteracoes" : "Criar atendimento"}
        </Button>
        {appointmentId ? (
          <Button disabled={isPending} onClick={handleCancel} type="button" variant="outline">
            Cancelar atendimento
          </Button>
        ) : null}
      </div>
    </form>
  );
}
