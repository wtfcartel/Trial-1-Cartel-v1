"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function reviewNurseAction(decision: "VERIFIED" | "REJECTED", formData: FormData) {
  await requireUser("ADMIN");

  const nurseProfileId = formData.get("nurseProfileId");
  const notes = formData.get("notes");
  if (typeof nurseProfileId !== "string" || !nurseProfileId) {
    throw new Error("Missing nurse profile");
  }

  await prisma.nurseProfile.update({
    where: { id: nurseProfileId },
    data: {
      verificationStatus: decision,
      verificationNotes: typeof notes === "string" && notes ? notes : null,
      verifiedAt: decision === "VERIFIED" ? new Date() : null,
    },
  });

  revalidatePath("/admin");
}
