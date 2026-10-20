import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  GATE_MAX_AGE_SECONDS,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    towelPlaced?: unknown;
    railHeated?: unknown;
  } | null;

  if (body?.towelPlaced !== true || body?.railHeated !== true) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    GATE_COOKIE,
    await createSessionToken("gate", GATE_MAX_AGE_SECONDS),
    sessionCookieOptions(GATE_MAX_AGE_SECONDS),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}
