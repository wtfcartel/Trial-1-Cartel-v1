import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { reviewNurseAction } from "@/lib/actions/admin";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [nurseProfiles, totalModules] = await Promise.all([
    prisma.nurseProfile.findMany({
      orderBy: { verificationStatus: "asc" },
      include: {
        user: true,
        certificates: true,
        induction: true,
      },
    }),
    prisma.inductionModule.count(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Credential review</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Review uploaded documents and confirm each nurse before they can
        claim shifts.
      </p>

      <ul className="mt-8 space-y-4">
        {nurseProfiles.map((profile) => (
          <li key={profile.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">{profile.user.name}</p>
                <p className="text-sm text-zinc-500">
                  {profile.user.email} · {profile.registrationNo} · {profile.qualifications}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Induction: {profile.induction.length}/{totalModules} modules complete
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[profile.verificationStatus]}`}
              >
                {profile.verificationStatus}
              </span>
            </div>

            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-700">Documents</p>
              {profile.certificates.length === 0 ? (
                <p className="text-sm text-zinc-500">None uploaded yet.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {profile.certificates.map((cert) => (
                    <li key={cert.id} className="text-sm">
                      <a
                        href={`/api/certificates/${cert.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-900 underline"
                      >
                        {cert.label}
                      </a>{" "}
                      <span className="text-zinc-500">({cert.fileName})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form className="mt-4 space-y-2">
              <input type="hidden" name="nurseProfileId" value={profile.id} />
              <textarea
                name="notes"
                rows={2}
                placeholder="Notes (visible to the nurse if rejected)"
                defaultValue={profile.verificationNotes ?? ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  formAction={reviewNurseAction.bind(null, "VERIFIED")}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Verify
                </button>
                <button
                  type="submit"
                  formAction={reviewNurseAction.bind(null, "REJECTED")}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Reject
                </button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
