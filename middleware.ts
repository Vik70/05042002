import { NextResponse, type NextRequest } from "next/server";

const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME ?? "Zack Knight";
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD ?? "piplup";

const unauthorizedResponse = () =>
  new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Aanavee Shrine", charset="UTF-8"',
    },
  });

const decodeCredentials = (authorizationHeader: string): { username: string; password: string } | null => {
  const [scheme, encoded] = authorizationHeader.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader) {
    return unauthorizedResponse();
  }

  const credentials = decodeCredentials(authorizationHeader);
  if (!credentials) {
    return unauthorizedResponse();
  }

  if (
    credentials.username !== BASIC_AUTH_USERNAME ||
    credentials.password !== BASIC_AUTH_PASSWORD
  ) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
