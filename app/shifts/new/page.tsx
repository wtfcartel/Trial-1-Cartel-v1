"use client";

import { useActionState } from "react";
import { createShiftAction, type ActionState } from "@/lib/actions/shifts";

const initialState: ActionState = undefined;

export default function NewShiftPage() {
  const [state, formAction, pending] = useActionState(createShiftAction, initialState);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Post a shift</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
            Shift title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. Night shift RN"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="ward" className="block text-sm font-medium text-zinc-700">
            Ward / department
          </label>
          <input
            id="ward"
            name="ward"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startsAt" className="block text-sm font-medium text-zinc-700">
              Starts
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="endsAt" className="block text-sm font-medium text-zinc-700">
              Ends
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="requiredQualification"
            className="block text-sm font-medium text-zinc-700"
          >
            Required qualification
          </label>
          <input
            id="requiredQualification"
            name="requiredQualification"
            required
            placeholder="e.g. RN with ICU experience"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-zinc-700">
            Hourly rate (AUD)
          </label>
          <input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Notes (optional, visible to all nurses browsing)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="careNotes" className="block text-sm font-medium text-zinc-700">
            Care/handover notes (optional, shown only to the confirmed nurse)
          </label>
          <textarea
            id="careNotes"
            name="careNotes"
            rows={3}
            placeholder="e.g. 1:1 fall-risk supervision, mobility assistance — do not include patient names or identifying details"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            This is stored as plain text — do not enter patient-identifiable
            health information here.
          </p>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post shift"}
        </button>
      </form>
    </div>
  );
}
