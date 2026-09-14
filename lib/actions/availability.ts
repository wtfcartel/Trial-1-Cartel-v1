"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export type ActionState = { error?: string } | undefined;

const addAvailabilitySchema = z.object({
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  note: z.string().optional(),
});

export async function addAvailabilityAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser("NURSE");
  if (!user.nurseProfile) return { error: "Nurse profile not found" };

  const parsed = addAvailabilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Enter valid start and end times" };
  }
  if (endsAt <= startsAt) {
    return { error: "End time must be after the start time" };
  }

  await prisma.availabilityBlock.create({
    data: {
      nurseProfileId: user.nurseProfile.id,
      startsAt,
      endsAt,
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/schedule");
}

export async function removeAvailabilityAction(blockId: string) {
  const user = await requireUser("NURSE");
  if (!user.nurseProfile) throw new Error("Nurse profile not found");

  const block = await prisma.availabilityBlock.findUnique({ where: { id: blockId } });
  if (!block || block.nurseProfileId !== user.nurseProfile.id) {
    throw new Error("Not found");
  }

  await prisma.availabilityBlock.delete({ where: { id: blockId } });
  revalidatePath("/schedule");
}
