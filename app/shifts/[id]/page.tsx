import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTime, formatMoney } from "@/lib/format";
import { claimShiftAction, respondToClaimAction } from "@/lib/actions/shifts";

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

export default async function ShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      facility: true,
      claims: { include: { nurse: { include: { nurseProfile: true } } } },
    },
  });
  if (!shift) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.role === "FACILITY_ADMIN" && user.facilityId === shift.facilityId;
  const myClaim = user ? shift.claims.find((c) => c.nurseId === user.id) : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {shift.title} · {shift.ward}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{shift.facility.name}</p>
        </div>
        <Badge status={shift.status} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <div>
          <dt className="text-zinc-500">Starts</dt>
          <dd className="font-medium text-zinc-900">{formatDateTime(shift.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Ends</dt>
          <dd className="font-medium text-zinc-900">{formatDateTime(shift.endsAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rate</dt>
          <dd className="font-medium text-zinc-900">{formatMoney(shift.hourlyRateCents)}/hr</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Required qualification</dt>
          <dd className="font-medium text-zinc-900">{shift.requiredQualification}</dd>
        </div>
        {shift.notes && (
          <div className="col-span-2">
            <dt className="text-zinc-500">Notes</dt>
            <dd className="text-zinc-900">{shift.notes}</dd>
          </div>
        )}
      </dl>

      {/* Nurse view */}
      {user?.role === "NURSE" && (
        <div className="mt-6">
          {myClaim ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">
                You claimed this shift —{" "}
                <span className="font-medium text-zinc-900">status: {myClaim.status}</span>
              </p>
            </div>
          ) : shift.status === "OPEN" ? (
            <form action={claimShiftAction.bind(null, shift.id)}>
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Claim this shift
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-500">This shift is no longer open.</p>
          )}
        </div>
      )}

      {/* Unauthenticated view */}
      {!user && (
        <p className="mt-6 text-sm text-zinc-600">
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Log in
          </Link>{" "}
          as a nurse to claim this shift.
        </p>
      )}

      {/* Facility owner view */}
      {isOwner && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900">Claims</h2>
          {shift.claims.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No nurses have claimed this shift yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
              {shift.claims.map((claim) => (
                <li key={claim.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-zinc-900">{claim.nurse.name}</p>
                    <p className="text-sm text-zinc-500">
                      {claim.nurse.nurseProfile?.qualifications} ·{" "}
                      {claim.nurse.nurseProfile?.registrationNo}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {shift.status === "OPEN" && claim.status === "REQUESTED" ? (
                      <>
                        <form action={respondToClaimAction.bind(null, claim.id, "CONFIRMED")}>
                          <button
                            type="submit"
                            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                          >
                            Confirm
                          </button>
                        </form>
                        <form action={respondToClaimAction.bind(null, claim.id, "DECLINED")}>
                          <button
                            type="submit"
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Decline
                          </button>
                        </form>
                      </>
                    ) : (
                      <Badge status={claim.status} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
