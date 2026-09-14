"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = undefined;

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [role, setRole] = useState<"FACILITY_ADMIN" | "NURSE">("NURSE");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Create an account</h1>

      <div className="mt-6 flex rounded-md border border-zinc-300 p-1 text-sm">
        <button
          type="button"
          onClick={() => setRole("NURSE")}
          className={`flex-1 rounded px-3 py-1.5 ${
            role === "NURSE" ? "bg-zinc-900 text-white" : "text-zinc-600"
          }`}
        >
          I&apos;m a nurse
        </button>
        <button
          type="button"
          onClick={() => setRole("FACILITY_ADMIN")}
          className={`flex-1 rounded px-3 py-1.5 ${
            role === "FACILITY_ADMIN" ? "bg-zinc-900 text-white" : "text-zinc-600"
          }`}
        >
          I&apos;m a facility
        </button>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            {role === "FACILITY_ADMIN" ? "Your name" : "Full name"}
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        {role === "FACILITY_ADMIN" ? (
          <>
            <div>
              <label
                htmlFor="facilityName"
                className="block text-sm font-medium text-zinc-700"
              >
                Facility name
              </label>
              <input
                id="facilityName"
                name="facilityName"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="facilityAddress"
                className="block text-sm font-medium text-zinc-700"
              >
                Facility address
              </label>
              <input
                id="facilityAddress"
                name="facilityAddress"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor="registrationNo"
                className="block text-sm font-medium text-zinc-700"
              >
                Registration number
              </label>
              <input
                id="registrationNo"
                name="registrationNo"
                required
                placeholder="e.g. AHPRA registration number"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="qualifications"
                className="block text-sm font-medium text-zinc-700"
              >
                Qualifications
              </label>
              <input
                id="qualifications"
                name="qualifications"
                required
                placeholder="e.g. RN, ICU, Paediatrics"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
