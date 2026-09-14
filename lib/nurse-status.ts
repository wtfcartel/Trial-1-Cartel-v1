import { prisma } from "@/lib/prisma";

export type NurseAvailability = {
  isAvailable: boolean;
  isVerified: boolean;
  totalModules: number;
  completedModules: number;
  inductionComplete: boolean;
};

/** A nurse can claim shifts once their credentials are verified by an admin
 * and every induction module has been completed. */
export async function getNurseAvailability(nurseProfileId: string): Promise<NurseAvailability> {
  const [profile, totalModules, completedModules] = await Promise.all([
    prisma.nurseProfile.findUnique({
      where: { id: nurseProfileId },
      select: { verificationStatus: true },
    }),
    prisma.inductionModule.count(),
    prisma.inductionProgress.count({ where: { nurseProfileId } }),
  ]);

  const isVerified = profile?.verificationStatus === "VERIFIED";
  const inductionComplete = totalModules > 0 && completedModules >= totalModules;

  return {
    isAvailable: isVerified && inductionComplete,
    isVerified,
    totalModules,
    completedModules,
    inductionComplete,
  };
}
