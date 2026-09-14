import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Fill last-minute nursing shifts, fast.
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600">
          ShiftReady connects facilities with open shifts to qualified relief and
          casual nurses ready to claim them — post a shift, review who&apos;s
          available, confirm, done.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-white"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="font-medium text-zinc-900">For facilities</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Post an open shift with ward, required qualification, and rate.
            Review nurses who claim it and confirm the one you want.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="font-medium text-zinc-900">For nurses</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Browse open shifts that match your qualifications, claim the ones
            that fit your schedule, and get confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
