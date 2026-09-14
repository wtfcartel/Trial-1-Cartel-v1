import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { CertificateUploadForm } from "@/components/certificate-upload-form";

const statusCopy: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending review", className: "bg-amber-50 text-amber-700" },
  VERIFIED: { label: "Verified", className: "bg-green-50 text-green-700" },
  REJECTED: { label: "Rejected — see notes below", className: "bg-red-50 text-red-700" },
};

export default async function CredentialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "NURSE" || !user.nurseProfile) redirect("/dashboard");

  const certificates = await prisma.certificate.findMany({
    where: { nurseProfileId: user.nurseProfile.id },
    orderBy: { uploadedAt: "desc" },
  });

  const status = statusCopy[user.nurseProfile.verificationStatus];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Credentials</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upload your registration and any certificates you want reviewed. An
        admin verifies these before your account can claim shifts.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
        {user.nurseProfile.verificationStatus === "REJECTED" && user.nurseProfile.verificationNotes && (
          <span className="text-sm text-zinc-600">{user.nurseProfile.verificationNotes}</span>
        )}
      </div>

      <div className="mt-8">
        <CertificateUploadForm />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Uploaded documents</h2>
        {certificates.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {certificates.map((cert) => (
              <li key={cert.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-zinc-900">{cert.label}</p>
                  <p className="text-sm text-zinc-500">
                    {cert.fileName} · uploaded {cert.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`/api/certificates/${cert.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-zinc-900 underline"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
