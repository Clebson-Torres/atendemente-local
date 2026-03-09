import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { patients } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  detectExistingPatientDuplicates,
  detectImportedPatientDuplicates,
  parsePatientsSpreadsheet,
} from "@/features/patients/import";
import { getCurrentUser } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  await enforceRateLimit({
    scope: "patients:import:preview",
    identifier: user.id,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Arquivo invalido." }, { status: 400 });
  }

  const preview = await parsePatientsSpreadsheet(file);
  const duplicates = detectImportedPatientDuplicates(preview.rows);
  const existingPatients = await getDb()
    .select({
      id: patients.id,
      fullName: patients.fullName,
      phone: patients.phone,
    })
    .from(patients)
    .where(and(eq(patients.userId, user.id), isNull(patients.deletedAt)));
  const existingDuplicates = detectExistingPatientDuplicates(preview.rows, existingPatients);

  return NextResponse.json({
    rows: preview.rows,
    errors: preview.errors,
    duplicates,
    existingDuplicates,
    summary: {
      totalRows: preview.rows.length + preview.errors.length,
      validRows: preview.rows.length,
      invalidRows: preview.errors.length,
      duplicateRows: duplicates.length + existingDuplicates.length,
    },
  });
}
