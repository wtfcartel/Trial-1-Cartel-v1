import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { buildShiftInviteIcs } from "@/lib/ics";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: { facility: true, claims: { where: { status: "CONFIRMED" }, include: { nurse: true } } },
  });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const confirmedClaim = shift.claims[0];
  if (!confirmedClaim) {
    return NextResponse.json({ error: "This shift has no confirmed nurse yet" }, { status: 409 });
  }

  const user = await getCurrentUser();
  const isConfirmedNurse = user?.id === confirmedClaim.nurseId;
  const isOwningFacility = user?.role === "FACILITY_ADMIN" && user.facilityId === shift.facilityId;
  if (!isConfirmedNurse && !isOwningFacility) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const descriptionParts = [
    `Ward: ${shift.ward}`,
    `Required qualification: ${shift.requiredQualification}`,
  ];
  if (shift.careNotes) descriptionParts.push(`Care notes: ${shift.careNotes}`);
  if (shift.notes) descriptionParts.push(`Notes: ${shift.notes}`);

  const ics = buildShiftInviteIcs({
    uid: shift.id,
    title: `${shift.title} — ${shift.facility.name}`,
    startsAt: shift.startsAt,
    endsAt: shift.endsAt,
    location: shift.facility.address,
    description: descriptionParts.join("\n"),
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="shift-${shift.id}.ics"`,
    },
  });
}
