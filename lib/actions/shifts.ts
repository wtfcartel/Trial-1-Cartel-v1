"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { getNurseAvailability } from "@/lib/nurse-status";

export type ActionState = { error?: string } | undefined;

const createShiftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  ward: z.string().min(1, "Ward is required"),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  requiredQualification: z.string().min(1, "Required qualification is required"),
  hourlyRate: z.coerce.number().positive("Hourly rate must be greater than 0"),
  notes: z.string().optional(),
  careNotes: z.string().optional(),
});

export async function createShiftAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "FACILITY_ADMIN" || !user.facilityId) {
    return { error: "Only facility accounts can post shifts" };
  }

  const parsed = createShiftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Enter valid start and end times" };
  }
  if (endsAt <= startsAt) {
    return { error: "Shift end time must be after the start time" };
  }

  const shift = await prisma.shift.create({
    data: {
      facilityId: user.facilityId,
      title: data.title,
      ward: data.ward,
      startsAt,
      endsAt,
      requiredQualification: data.requiredQualification,
      hourlyRateCents: Math.round(data.hourlyRate * 100),
      notes: data.notes || null,
      careNotes: data.careNotes || null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/shifts/${shift.id}`);
}

export async function claimShiftAction(shiftId: string) {
  const user = await requireUser("NURSE");
  if (!user.nurseProfile) {
    throw new Error("Nurse profile not found");
  }

  const availability = await getNurseAvailability(user.nurseProfile.id);
  if (!availability.isAvailable) {
    throw new Error(
      "Complete credential verification and induction training before claiming shifts"
    );
  }

  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.status !== "OPEN") {
    throw new Error("This shift is no longer available");
  }

  await prisma.shiftClaim.upsert({
    where: { shiftId_nurseId: { shiftId, nurseId: user.id } },
    update: {},
    create: { shiftId, nurseId: user.id },
  });

  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath("/dashboard");
}

export async function respondToClaimAction(
  claimId: string,
  decision: "CONFIRMED" | "DECLINED"
) {
  const user = await requireUser();
  if (user.role !== "FACILITY_ADMIN") {
    throw new Error("Only facility accounts can respond to claims");
  }

  const claim = await prisma.shiftClaim.findUnique({
    where: { id: claimId },
    include: { shift: true },
  });
  if (!claim || claim.shift.facilityId !== user.facilityId) {
    throw new Error("Not found");
  }
  if (claim.shift.status !== "OPEN") {
    throw new Error("This shift has already been resolved");
  }

  await prisma.$transaction(async (tx) => {
    await tx.shiftClaim.update({ where: { id: claimId }, data: { status: decision } });
    if (decision === "CONFIRMED") {
      await tx.shift.update({ where: { id: claim.shiftId }, data: { status: "FILLED" } });
      await tx.shiftClaim.updateMany({
        where: { shiftId: claim.shiftId, id: { not: claimId }, status: "REQUESTED" },
        data: { status: "DECLINED" },
      });
    }
  });

  revalidatePath(`/shifts/${claim.shiftId}`);
  revalidatePath("/dashboard");
}
