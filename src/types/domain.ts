export const appointmentStatuses = ["scheduled", "completed", "cancelled", "no_show"] as const;
export const appointmentConfirmationStatuses = ["unconfirmed", "confirmed", "cancelled"] as const;
export const recurrenceFrequencies = ["weekly", "biweekly"] as const;
export const recurrenceEndModes = ["until_date", "occurrences"] as const;
export const paymentStatuses = ["pending", "paid", "cancelled"] as const;
export const paymentMethods = ["pix", "cash", "card", "bank_transfer", "other"] as const;
export const recordFileKinds = ["session_attachment", "payment_receipt"] as const;
export const patientStatuses = ["active", "inactive"] as const;
export const auditActions = [
  "login",
  "logout",
  "file_upload",
  "file_download",
  "patient_export",
  "delete",
  "update",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];
export type AppointmentConfirmationStatus = (typeof appointmentConfirmationStatuses)[number];
export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];
export type RecurrenceEndMode = (typeof recurrenceEndModes)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type RecordFileKind = (typeof recordFileKinds)[number];
export type PatientStatus = (typeof patientStatuses)[number];
export type AuditAction = (typeof auditActions)[number];

export const appointmentStatusLabelMap: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  completed: "Concluido",
  cancelled: "Cancelado",
  no_show: "Nao compareceu",
};

export const appointmentConfirmationLabelMap: Record<AppointmentConfirmationStatus, string> = {
  unconfirmed: "Nao confirmado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

export const recurrenceFrequencyLabelMap: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
};

export const recurrenceEndModeLabelMap: Record<RecurrenceEndMode, string> = {
  until_date: "Ate uma data",
  occurrences: "Quantidade de sessoes",
};

export const paymentStatusLabelMap: Record<PaymentStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
};

export const paymentMethodLabelMap: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartao",
  bank_transfer: "Transferencia",
  other: "Outro",
};

export const recordFileKindLabelMap: Record<RecordFileKind, string> = {
  session_attachment: "Anexo do atendimento",
  payment_receipt: "Recibo de pagamento",
};

export const patientStatusLabelMap: Record<PatientStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export type ActionResponse<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};
