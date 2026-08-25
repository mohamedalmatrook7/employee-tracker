import { NextResponse } from "next/server";

// Single-user mode: no login, so no session/route-protection middleware.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Don't run on anything — kept as a no-op so the app has no auth gating.
  matcher: [],
};
