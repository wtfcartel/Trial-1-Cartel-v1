"use client";

import { useActionState } from "react";
import { uploadCertificateAction, type ActionState } from "@/lib/actions/credentials";

const initialState: ActionState = undefined;

export function CertificateUploadForm() {
  const [state, formAction, pending] = useActionState(uploadCertificateAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-zinc-700">
          What is this document?
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="e.g. AHPRA registration, First Aid certificate"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-zinc-700">
          File (PDF, PNG, or JPEG, up to 5MB)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          required
          className="mt-1 w-full text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload certificate"}
      </button>
    </form>
  );
}
