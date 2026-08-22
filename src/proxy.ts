import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessCookie = request.cookies.get("accessToken")?.value;
  const refreshCookie = request.cookies.get("refreshToken")?.value;

  // 1. Unauthenticated users -> Redirect to /login
  // Skip redirecting if the user is already on public routes (/login, /register) to avoid infinite loops
  const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!accessCookie && !refreshCookie) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 2. Authenticated users -> Redirect non-admin routes to /admin
  if (
    !pathname.startsWith("/admin") &&
    !isPublicRoute
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};