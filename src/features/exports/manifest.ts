type TimelineItem = {
  appointmentId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  sessionPriceCents: number;
  quickNotes: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  amountReceivedCents: number | null;
  paidAt: Date | null;
  summary: string | null;
  files: Array<{
    id: string;
    paymentId?: string | null;
    kind?: string;
    originalName: string;
    mimeType: string;
    byteSize: number;
    uploadedAt: Date;
  }>;
};

export function buildExportManifest(
  patient: Record<string, unknown>,
  timeline: TimelineItem[],
) {
  return {
    exportedAt: new Date().toISOString(),
    patient,
    appointments: timeline.map((item) => ({
      appointmentId: item.appointmentId,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      status: item.status,
      sessionPriceCents: item.sessionPriceCents,
      quickNotes: item.quickNotes,
      payment: {
        status: item.paymentStatus,
        method: item.paymentMethod,
        amountReceivedCents: item.amountReceivedCents,
        paidAt: item.paidAt,
      },
      summary: item.summary,
      files: item.files.map((file) => ({
        id: file.id,
        paymentId: file.paymentId,
        kind: file.kind,
        originalName: file.originalName,
        mimeType: file.mimeType,
        byteSize: file.byteSize,
        uploadedAt: file.uploadedAt,
      })),
    })),
  };
}
