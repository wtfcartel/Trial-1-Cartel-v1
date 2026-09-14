import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/lib/actions/auth";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
          ShiftReady
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
                Dashboard
              </Link>
              {user.role === "FACILITY_ADMIN" && (
                <Link href="/shifts/new" className="text-zinc-600 hover:text-zinc-900">
                  Post a shift
                </Link>
              )}
              <span className="text-zinc-400">
                {user.name} · {user.role === "FACILITY_ADMIN" ? "Facility" : "Nurse"}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
