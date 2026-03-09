import { NextResponse } from "next/server";
import { downloadFile } from "@/features/files/service";
import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";

export const runtime = "nodejs";

type DownloadRouteProps = {
  params: Promise<{ fileId: string }>;
};

export async function GET(_: Request, { params }: DownloadRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  try {
    const { fileId } = await params;
    const { file, data } = await downloadFile(user.id, fileId);

    return new NextResponse(data.stream(), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof AppError ? error.message : "Falha ao baixar arquivo.";
    const status = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json({ message }, { status });
  }
}
