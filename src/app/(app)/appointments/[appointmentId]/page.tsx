import Link from "next/link";
import { Download } from "lucide-react";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { FileUploadForm } from "@/components/forms/file-upload-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { SessionRecordForm } from "@/components/forms/session-record-form";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentDetail } from "@/features/appointments/queries";
import { listPatients } from "@/features/patients/queries";
import { requireUser } from "@/lib/auth/session";
import {
  getAppointmentConfirmationLabel,
  getAppointmentConfirmationBadgeVariant,
  describeAppointmentTime,
  formatCurrencyBRL,
  getAppointmentStatusBadgeVariant,
  getAppointmentStatusLabel,
  getPaymentStatusLabel,
  toDateInputValue,
  toDateTimeLocalValue,
} from "@/lib/utils";

type AppointmentDetailPageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const user = await requireUser();
  const { appointmentId } = await params;
  const [appointment, patients] = await Promise.all([
    getAppointmentDetail(user.id, appointmentId),
    listPatients(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe do atendimento"
        title={appointment.patientName}
        description={`Sessao marcada para ${describeAppointmentTime(appointment.startsAt)}.`}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle>Contexto rapido</CardTitle>
                  <CardDescription>Paciente, horario, status e observacoes administrativas.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getAppointmentStatusBadgeVariant(appointment.status)}>
                    {getAppointmentStatusLabel(appointment.status)}
                  </Badge>
                  <Badge variant={getAppointmentConfirmationBadgeVariant(appointment.confirmationStatus)}>
                    {getAppointmentConfirmationLabel(appointment.confirmationStatus)}
                  </Badge>
                  <Badge variant={appointment.paymentStatus === "paid" ? "success" : appointment.paymentStatus === "pending" ? "warning" : "secondary"}>
                    {appointment.paymentStatus ? getPaymentStatusLabel(appointment.paymentStatus) : "Sem pagamento"}
                  </Badge>
                  {appointment.recurringSeries ? <Badge variant="outline">Serie recorrente</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-muted/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Paciente</p>
                  <Link className="mt-2 block font-semibold text-primary" href={`/patients/${appointment.patientId}`}>
                    {appointment.patientName}
                  </Link>
                </div>
                <div className="rounded-3xl bg-muted/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Valor da sessao</p>
                  <p className="mt-2 font-semibold">{formatCurrencyBRL(appointment.sessionPriceCents)}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Observacoes administrativas</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {appointment.quickNotes || "Sem observacoes administrativas para este atendimento."}
                </p>
              </div>
              {appointment.recurringSeries ? (
                <div className="rounded-3xl bg-muted/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recorrencia</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{appointment.recurringSeries.summary}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro de atendimento</CardTitle>
              <CardDescription>Resumo leve com criptografia adicional antes da persistencia.</CardDescription>
            </CardHeader>
            <CardContent>
              <SessionRecordForm
                defaultValues={{
                  appointmentId: appointment.id,
                  patientId: appointment.patientId,
                  content: appointment.recordContent || "",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anexos privados</CardTitle>
              <CardDescription>Upload protegido com bucket privado e download validado pelo backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FileUploadForm appointmentId={appointment.id} patientId={appointment.patientId} />
              <div className="space-y-3">
                {appointment.files.length ? (
                  appointment.files.map((file) => (
                    <a
                      key={file.id}
                      className="flex items-center justify-between rounded-3xl bg-muted/35 p-4 transition hover:bg-muted/55"
                      href={`/api/files/${file.id}/download`}
                    >
                      <div>
                        <p className="font-semibold">{file.originalName}</p>
                        <p className="text-sm text-muted-foreground">{file.mimeType}</p>
                      </div>
                      <Download className="h-4 w-4 text-primary" />
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum arquivo anexado a este atendimento.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar atendimento</CardTitle>
              <CardDescription>Remarque, atualize status e revise as observacoes administrativas.</CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentForm
                appointmentId={appointment.id}
                defaultValues={{
                  patientId: appointment.patientId,
                  startsAt: toDateTimeLocalValue(appointment.startsAt),
                  endsAt: toDateTimeLocalValue(appointment.endsAt),
                  sessionPriceCents: appointment.sessionPriceCents,
                  quickNotes: appointment.quickNotes ?? "",
                  cancelReason: appointment.cancelReason ?? "",
                  confirmationStatus: appointment.confirmationStatus,
                  status: appointment.status,
                }}
                patientOptions={patients.map((patient) => ({
                  id: patient.id,
                  fullName: patient.fullName,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controle manual de pagamento</CardTitle>
              <CardDescription>Um pagamento por atendimento para manter o MVP simples e estavel.</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentForm
                defaultValues={{
                  appointmentId: appointment.id,
                  status: appointment.paymentStatus ?? "pending",
                  method: appointment.paymentMethod ?? "other",
                  paidAt: toDateInputValue(appointment.paidAt),
                  amountReceivedCents: appointment.amountReceivedCents ?? appointment.sessionPriceCents,
                  notes: appointment.paymentNotes ?? "",
                }}
              />

              <div className="mt-6 space-y-4 rounded-3xl bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Recibo de pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Anexe o comprovante sempre que o pagamento ja tiver sido registrado neste atendimento.
                  </p>
                </div>

                {appointment.paymentId ? (
                  <>
                    <FileUploadForm
                      appointmentId={appointment.id}
                      buttonLabel="Enviar recibo"
                      kind="payment_receipt"
                      patientId={appointment.patientId}
                      paymentId={appointment.paymentId}
                      title="Arquivo do recibo"
                    />

                    <div className="space-y-3">
                      {appointment.paymentReceipts.length ? (
                        appointment.paymentReceipts.map((file) => (
                          <a
                            key={file.id}
                            className="flex items-center justify-between rounded-3xl bg-white p-4 transition hover:bg-muted/55"
                            href={`/api/files/${file.id}/download`}
                          >
                            <div>
                              <p className="font-semibold">{file.originalName}</p>
                              <p className="text-sm text-muted-foreground">{file.mimeType}</p>
                            </div>
                            <Download className="h-4 w-4 text-primary" />
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum recibo anexado ate o momento.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Salve o pagamento primeiro para liberar o upload do recibo.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
