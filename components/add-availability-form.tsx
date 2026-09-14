"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions/availability";

const initialState: ActionState = undefined;

export function AddAvailabilityForm({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex sm:items-end sm:gap-3 sm:space-y-0"
    >
      <div className="flex-1">
        <label htmlFor="startsAt" className="block text-sm font-medium text-zinc-700">
          Available from
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="endsAt" className="block text-sm font-medium text-zinc-700">
          Until
        </label>
        <input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="note" className="block text-sm font-medium text-zinc-700">
          Note (optional)
        </label>
        <input
          id="note"
          name="note"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error && <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>}
    </form>
  );
}
