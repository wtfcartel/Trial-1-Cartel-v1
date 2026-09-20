import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Tags each request so the shared root layout knows which of the two
 * products in this repo it's serving — the ShiftReady nursing marketplace
 * or the LogisticsDx intelligence reader — without either one importing
 * from the other. This keeps LogisticsDx routes from ever invoking
 * ShiftReady's Nav (and its Prisma/session lookups), and vice versa.
 */
export function middleware(request: NextRequest) {
  const isLogistics = request.nextUrl.pathname.startsWith("/intelligence");
  const headers = new Headers(request.headers);
  headers.set("x-ldx-app", isLogistics ? "logistics" : "nursing");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
