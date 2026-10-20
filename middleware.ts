import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PREFIXES = ["/gate", "/api/gate", "/favicon_io", "/favicon.ico", "/robots.txt"];

const isPublicPath = (pathname: string): boolean => {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Keep the raw path if it isn't valid percent-encoding.
  }
  return PUBLIC_PREFIXES.some((prefix) => decoded === prefix || decoded.startsWith(`${prefix}/`) || decoded.startsWith(`${prefix} `));
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (await verifySessionToken(request.cookies.get(GATE_COOKIE)?.value, "gate")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "The towel isn't on the rail yet." }, { status: 401 });
  }

  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = "/gate";
  gateUrl.search = pathname === "/" ? "" : `?next=${encodeURIComponent(`${pathname}${search}`)}`;
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
