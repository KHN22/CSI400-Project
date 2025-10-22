import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Central auth gate:
 * - allows Next internals, static, api and public pages
 * - redirects others to /login?from=<originalPath> if no auth cookie found
 *
 * Change "token" to the cookie name your auth sets.
 */
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // allow internals & assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // public pages that do not require auth
  const publicPages = ["/login", "/register", "/signup", "/auth/callback"];
  if (publicPages.includes(pathname)) {
    return NextResponse.next();
  }

  // check cookie (replace "token" with your cookie name)
  const token = req.cookies.get("token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};