import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionTokenFromRequest, verifySessionToken } from "@/modules/auth/session-token";

const PUBLIC_PATHS = ["/masuk", "/daftar", "/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = getSessionTokenFromRequest(request);
  const session = rawToken ? await verifySessionToken(rawToken) : null;

  if (isApiPath(pathname)) return NextResponse.next();

  const publicPath = isPublicPath(pathname);
  let response: NextResponse;

  if (!session && !publicPath) {
    const loginUrl = new URL("/masuk", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    response = NextResponse.redirect(loginUrl);
  } else if (session && (pathname === "/masuk" || pathname === "/daftar")) {
    const destination = session.role === "admin" ? "/admin" : "/profil";
    response = NextResponse.redirect(new URL(destination, request.url));
  } else if (session?.role === "pasien" && pathname.startsWith("/admin")) {
    response = NextResponse.redirect(new URL("/profil", request.url));
  } else {
    response = NextResponse.next();
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset files (e.g. .png, .jpg, .svg)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
