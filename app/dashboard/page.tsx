import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getNurseAvailability } from "@/lib/nurse-status";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  FILLED: "bg-green-50 text-green-700",
  CANCELLED: "bg-zinc-100 text-zinc-500",
  COMPLETED: "bg-zinc-100 text-zinc-500",
  REQUESTED: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-green-50 text-green-700",
  DECLINED: "bg-zinc-100 text-zinc-500",
};

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {status}
    </span>
  );
}

async function FacilityDashboard({ facilityId }: { facilityId: string }) {
  const shifts = await prisma.shift.findMany({
    where: { facilityId },
    orderBy: { startsAt: "desc" },
    include: { claims: { include: { nurse: true } } },
  });

  const pendingReviewCount = shifts.reduce(
    (sum, shift) =>
      sum + shift.claims.filter((claim) => claim.status === "REQUESTED").length,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Your shifts</h1>
        <Link
          href="/shifts/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Post a shift
        </Link>
      </div>

      {pendingReviewCount > 0 && (
        <p className="mt-2 text-sm text-amber-700">
          {pendingReviewCount} nurse claim{pendingReviewCount === 1 ? "" : "s"} waiting
          on your review.
        </p>
      )}

      {shifts.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          You haven&apos;t posted any shifts yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {shifts.map((shift) => {
            const pending = shift.claims.filter((c) => c.status === "REQUESTED").length;
            return (
              <li key={shift.id} className="p-4">
                <Link
                  href={`/shifts/${shift.id}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {shift.title} · {shift.ward}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatDateTime(shift.startsAt)} — {formatMoney(shift.hourlyRateCents)}
                      /hr
                    </p>
                    {pending > 0 && shift.status === "OPEN" && (
                      <p className="mt-1 text-sm text-amber-700">
                        {pending} claim{pending === 1 ? "" : "s"} to review
                      </p>
                    )}
                  </div>
                  <Badge status={shift.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

async function NurseDashboard({
  nurseId,
  nurseProfileId,
}: {
  nurseId: string;
  nurseProfileId: string;
}) {
  const [openShifts, myClaims, availability] = await Promise.all([
    prisma.shift.findMany({
      where: {
        status: "OPEN",
        claims: { none: { nurseId } },
      },
      orderBy: { startsAt: "asc" },
      include: { facility: true },
    }),
    prisma.shiftClaim.findMany({
      where: { nurseId },
      orderBy: { createdAt: "desc" },
      include: { shift: { include: { facility: true } } },
    }),
    getNurseAvailability(nurseProfileId),
  ]);

  return (
    <div className="space-y-12">
      {!availability.isAvailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Your account isn&apos;t available for shifts yet.</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Credential verification:{" "}
              {availability.isVerified ? "verified" : "pending review"} —{" "}
              <Link href="/credentials" className="underline">
                manage credentials
              </Link>
            </li>
            <li>
              Induction training: {availability.completedModules}/{availability.totalModules}{" "}
              modules complete —{" "}
              <Link href="/induction" className="underline">
                complete induction
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Open shifts</h1>
        {openShifts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No open shifts right now — check back soon.</p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {openShifts.map((shift) => (
              <li key={shift.id} className="p-4">
                <Link
                  href={`/shifts/${shift.id}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {shift.title} · {shift.ward}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {shift.facility.name} — {formatDateTime(shift.startsAt)}
                    </p>
                    <p className="text-sm text-zinc-500">
                      Requires: {shift.requiredQualification}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-900">
                    {formatMoney(shift.hourlyRateCents)}/hr
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Your claims</h2>
        {myClaims.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">You haven&apos;t claimed any shifts yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {myClaims.map((claim) => (
              <li key={claim.id} className="p-4">
                <Link
                  href={`/shifts/${claim.shiftId}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {claim.shift.title} · {claim.shift.ward}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {claim.shift.facility.name} — {formatDateTime(claim.shift.startsAt)}
                    </p>
                  </div>
                  <Badge status={claim.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {user.role === "FACILITY_ADMIN" && user.facilityId ? (
        <FacilityDashboard facilityId={user.facilityId} />
      ) : user.nurseProfile ? (
        <NurseDashboard nurseId={user.id} nurseProfileId={user.nurseProfile.id} />
      ) : null}
    </div>
  );
}
