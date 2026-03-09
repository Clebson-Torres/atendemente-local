import "server-only";
import JSZip from "jszip";
import { downloadFile } from "@/features/files/service";
import { buildExportManifest } from "@/features/exports/manifest";
import { getPatientDetail } from "@/features/patients/queries";
import { writeAuditLog } from "@/lib/audit/log";

export async function exportPatientBundle(userId: string, patientId: string) {
  const { patient, timeline } = await getPatientDetail(userId, patientId);
  const zip = new JSZip();
  const manifest = buildExportManifest(patient, timeline);

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  const filesFolder = zip.folder("files");

  if (filesFolder) {
    for (const item of timeline) {
      for (const file of item.files) {
        const { data } = await downloadFile(userId, file.id);
        filesFolder.file(
          `${item.appointmentId}/${file.kind ?? "session_attachment"}/${file.originalName}`,
          await data.arrayBuffer(),
        );
      }
    }
  }

  await writeAuditLog({
    userId,
    action: "patient_export",
    entityType: "patient",
    entityId: patient.id,
    metadata: {
      appointmentCount: timeline.length,
      fileCount: timeline.reduce((total, item) => total + item.files.length, 0),
    },
  });

  return {
    patient,
    buffer: await zip.generateAsync({ type: "nodebuffer" }),
  };
}
