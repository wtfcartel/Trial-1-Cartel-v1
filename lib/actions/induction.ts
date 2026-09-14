"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function completeModuleAction(moduleId: string) {
  const user = await requireUser("NURSE");
  if (!user.nurseProfile) throw new Error("Nurse profile not found");

  const inductionModule = await prisma.inductionModule.findUnique({ where: { id: moduleId } });
  if (!inductionModule) throw new Error("Induction module not found");

  await prisma.inductionProgress.upsert({
    where: { nurseProfileId_moduleId: { nurseProfileId: user.nurseProfile.id, moduleId } },
    update: {},
    create: { nurseProfileId: user.nurseProfile.id, moduleId },
  });

  revalidatePath("/induction");
  revalidatePath("/dashboard");
}
