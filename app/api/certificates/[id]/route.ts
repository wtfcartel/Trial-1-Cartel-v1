import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { readCertificateFile } from "@/lib/uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { nurseProfile: true },
  });
  if (!certificate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getCurrentUser();
  const isOwner = user?.nurseProfile?.id === certificate.nurseProfileId;
  const isAdmin = user?.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const bytes = await readCertificateFile(certificate.storedPath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": certificate.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(certificate.fileName)}"`,
    },
  });
}
