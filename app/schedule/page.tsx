import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTime } from "@/lib/format";
import { addAvailabilityAction, removeAvailabilityAction } from "@/lib/actions/availability";
import { AddAvailabilityForm } from "@/components/add-availability-form";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "NURSE" || !user.nurseProfile) redirect("/dashboard");

  const [upcomingShifts, availability] = await Promise.all([
    prisma.shiftClaim.findMany({
      where: { nurseId: user.id, status: "CONFIRMED", shift: { startsAt: { gte: new Date() } } },
      orderBy: { shift: { startsAt: "asc" } },
      include: { shift: { include: { facility: true } } },
    }),
    prisma.availabilityBlock.findMany({
      where: { nurseProfileId: user.nurseProfile.id, endsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Your schedule</h1>
        <a
          href="/api/schedule.ics"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-white"
        >
          Export calendar (.ics)
        </a>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Upcoming confirmed shifts</h2>
        {upcomingShifts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No confirmed shifts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {upcomingShifts.map((claim) => (
              <li key={claim.id} className="p-4">
                <Link href={`/shifts/${claim.shiftId}`} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {claim.shift.title} · {claim.shift.ward}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {claim.shift.facility.name} — {formatDateTime(claim.shift.startsAt)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-zinc-900 underline">Add to calendar</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">Your availability</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Let facilities know when you&apos;re free. This is informational for
          now — it doesn&apos;t filter the open shifts feed yet.
        </p>

        <div className="mt-4">
          <AddAvailabilityForm action={addAvailabilityAction} />
        </div>

        {availability.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No availability added yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {availability.map((block) => (
              <li key={block.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {formatDateTime(block.startsAt)} — {formatDateTime(block.endsAt)}
                  </p>
                  {block.note && <p className="text-sm text-zinc-500">{block.note}</p>}
                </div>
                <form action={removeAvailabilityAction.bind(null, block.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
