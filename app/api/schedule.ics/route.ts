import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { buildScheduleIcs } from "@/lib/ics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "NURSE") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const claims = await prisma.shiftClaim.findMany({
    where: { nurseId: user.id, status: "CONFIRMED" },
    include: { shift: { include: { facility: true } } },
  });

  const ics = buildScheduleIcs(
    claims.map((claim) => {
      const descriptionParts = [
        `Ward: ${claim.shift.ward}`,
        `Required qualification: ${claim.shift.requiredQualification}`,
      ];
      if (claim.shift.careNotes) descriptionParts.push(`Care notes: ${claim.shift.careNotes}`);
      return {
        uid: claim.shift.id,
        title: `${claim.shift.title} — ${claim.shift.facility.name}`,
        startsAt: claim.shift.startsAt,
        endsAt: claim.shift.endsAt,
        location: claim.shift.facility.address,
        description: descriptionParts.join("\n"),
      };
    })
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-schedule.ics"`,
    },
  });
}
