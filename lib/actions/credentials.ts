"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { saveCertificateFile, UploadError } from "@/lib/uploads";

export type ActionState = { error?: string } | undefined;

const uploadSchema = z.object({
  label: z.string().min(1, "Give the certificate a label, e.g. 'AHPRA registration'"),
});

export async function uploadCertificateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser("NURSE");
  if (!user.nurseProfile) return { error: "Nurse profile not found" };

  const parsed = uploadSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }

  let storedPath: string;
  try {
    storedPath = await saveCertificateFile(user.nurseProfile.id, file);
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  await prisma.certificate.create({
    data: {
      nurseProfileId: user.nurseProfile.id,
      label: parsed.data.label,
      fileName: file.name,
      storedPath,
      mimeType: file.type,
    },
  });

  // A new certificate re-opens review — an admin needs to look at it again.
  await prisma.nurseProfile.update({
    where: { id: user.nurseProfile.id },
    data: { verificationStatus: "PENDING", verifiedAt: null },
  });

  revalidatePath("/credentials");
  revalidatePath("/dashboard");
}
