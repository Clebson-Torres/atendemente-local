import { clsx, type ClassValue } from "clsx";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import {
  appointmentConfirmationLabelMap,
  appointmentStatusLabelMap,
  type AppointmentConfirmationStatus,
  type PatientStatus,
  patientStatusLabelMap,
  paymentMethodLabelMap,
  paymentStatusLabelMap,
  type AppointmentStatus,
  type RecurrenceEndMode,
  recurrenceEndModeLabelMap,
  recurrenceFrequencyLabelMap,
  type RecurrenceFrequency,
  type PaymentMethod,
  type PaymentStatus,
  type RecordFileKind,
  recordFileKindLabelMap,
} from "@/types/domain";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toSafeDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  return new Date(value);
}

export function formatCurrencyBRL(valueInCents: number | null | undefined) {
  const value = (valueInCents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDateBR(value: Date | string | null | undefined) {
  if (!value) {
    return "Nao informado";
  }

  return format(toSafeDate(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTimeBR(value: Date | string | null | undefined) {
  if (!value) {
    return "Nao informado";
  }

  return format(toSafeDate(value), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function describeAppointmentTime(value: Date | string) {
  const date = toSafeDate(value);

  if (isToday(date)) {
    return `Hoje, ${format(date, "HH:mm", { locale: ptBR })}`;
  }

  if (isTomorrow(date)) {
    return `Amanha, ${format(date, "HH:mm", { locale: ptBR })}`;
  }

  return formatDateTimeBR(date);
}

export function formatPhone(value: string | null | undefined) {
  if (!value) {
    return "Nao informado";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value;
}

export function normalizePhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizePatientName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function buildPatientIdentityKey(input: {
  fullName: string | null | undefined;
  phone?: string | null | undefined;
}) {
  return `${normalizePatientName(input.fullName)}::${normalizePhone(input.phone)}`;
}

export function formatPhoneToWhatsApp(value: string | null | undefined) {
  const digits = normalizePhone(value);

  if (!digits) {
    return "";
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function buildWhatsAppUrl(value: string | null | undefined) {
  const phone = formatPhoneToWhatsApp(value);
  return phone ? `https://wa.me/${phone}` : "";
}

export function buildGoogleMeetUrl() {
  return "https://meet.google.com/new";
}

export function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(toSafeDate(value), "yyyy-MM-dd");
}

export function toDateTimeLocalValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(toSafeDate(value), "yyyy-MM-dd'T'HH:mm");
}

export function parseBRLToCents(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : Math.round(value * 100);
  }

  if (!value) {
    return 0;
  }

  const sanitized = value.replace(/\s/g, "").replace(/R\$/gi, "").replace(/[^0-9,.-]/g, "");

  if (!sanitized) {
    return 0;
  }

  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");

  let normalized = sanitized;

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = sanitized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = sanitized.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    normalized = sanitized.replace(/\./g, "").replace(",", ".");
  } else if (lastDot >= 0) {
    const decimalDigits = sanitized.length - lastDot - 1;
    normalized = decimalDigits <= 2 ? sanitized : sanitized.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

export function formatCentsForInput(valueInCents: number | null | undefined) {
  const value = (valueInCents ?? 0) / 100;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeBRLCurrencyInput(value: string) {
  const sanitized = value.replace(/[^\d,]/g, "");
  const [rawInteger = "", ...rest] = sanitized.split(",");
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || (rawInteger ? "0" : "");
  const decimal = rest.join("").slice(0, 2);

  if (!sanitized.includes(",")) {
    return integer;
  }

  return `${integer},${decimal}`;
}

export function maskDateInputBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function maskTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseDateInputBR(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

export function formatDateInputBR(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(toSafeDate(value), "dd/MM/yyyy", { locale: ptBR });
}

export function splitDateTimeInput(value: Date | string | null | undefined) {
  if (!value) {
    return { date: "", time: "" };
  }

  const date = toSafeDate(value);

  return {
    date: format(date, "dd/MM/yyyy", { locale: ptBR }),
    time: format(date, "HH:mm", { locale: ptBR }),
  };
}

export function combineDateAndTimeInput(dateValue: string, timeValue: string) {
  const isoDate = parseDateInputBR(dateValue);
  const timeMatch = timeValue.match(/^(\d{2}):(\d{2})$/);

  if (!isoDate || !timeMatch) {
    return "";
  }

  const [, hours, minutes] = timeMatch;
  const hourNumber = Number(hours);
  const minuteNumber = Number(minutes);

  if (
    Number.isNaN(hourNumber) ||
    Number.isNaN(minuteNumber) ||
    hourNumber < 0 ||
    hourNumber > 23 ||
    minuteNumber < 0 ||
    minuteNumber > 59
  ) {
    return "";
  }

  return `${isoDate}T${hours}:${minutes}`;
}

export function addOneHourToTimeInput(timeValue: string) {
  const timeMatch = timeValue.match(/^(\d{2}):(\d{2})$/);

  if (!timeMatch) {
    return "";
  }

  const [, hours, minutes] = timeMatch;
  const totalMinutes = Number(hours) * 60 + Number(minutes) + 60;
  const nextHours = Math.floor((totalMinutes % (24 * 60)) / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}

export function describeDateTimeRangeBR(startValue: Date | string, endValue: Date | string) {
  const start = toSafeDate(startValue);
  const end = toSafeDate(endValue);

  return `${format(start, "dd/MM/yyyy", { locale: ptBR })} das ${format(start, "HH:mm", { locale: ptBR })} as ${format(end, "HH:mm", { locale: ptBR })}`;
}

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  return appointmentStatusLabelMap[status];
}

export function getAppointmentConfirmationLabel(status: AppointmentConfirmationStatus) {
  return appointmentConfirmationLabelMap[status];
}

export function getRecurrenceFrequencyLabel(value: RecurrenceFrequency) {
  return recurrenceFrequencyLabelMap[value];
}

export function getRecurrenceEndModeLabel(value: RecurrenceEndMode) {
  return recurrenceEndModeLabelMap[value];
}

export function getPatientStatusLabel(status: PatientStatus) {
  return patientStatusLabelMap[status];
}

export function getAppointmentStatusBadgeVariant(status: AppointmentStatus) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "cancelled") {
    return "destructive" as const;
  }

  if (status === "no_show") {
    return "secondary" as const;
  }

  return "default" as const;
}

export function getAppointmentConfirmationBadgeVariant(status: AppointmentConfirmationStatus) {
  if (status === "confirmed") {
    return "success" as const;
  }

  if (status === "cancelled") {
    return "destructive" as const;
  }

  return "warning" as const;
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return paymentStatusLabelMap[status];
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return paymentMethodLabelMap[method];
}

export function getRecordFileKindLabel(kind: RecordFileKind) {
  return recordFileKindLabelMap[kind];
}
