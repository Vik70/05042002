import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isEditor, isEditorConfigured } from "@/lib/auth/editor";
import {
  EDITOR_COOKIE,
  EDITOR_MAX_AGE_SECONDS,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { isStorageConfigured } from "@/lib/memories/store";

const passcodeMatches = (attempt: string): boolean => {
  const expected = Buffer.from(process.env.EDITOR_PASSCODE ?? "");
  const actual = Buffer.from(attempt.trim());
  return expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual);
};

export async function GET() {
  return NextResponse.json({
    editor: await isEditor(),
    configured: isEditorConfigured(),
    storage: isStorageConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isEditorConfigured()) {
    return NextResponse.json(
      { error: "Set EDITOR_PASSCODE in the site's environment variables to enable editing." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { passcode?: unknown } | null;
  if (typeof body?.passcode !== "string" || !passcodeMatches(body.passcode)) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "That's not the passcode." }, { status: 401 });
  }

  const response = NextResponse.json({ editor: true });
  response.cookies.set(
    EDITOR_COOKIE,
    await createSessionToken("editor", EDITOR_MAX_AGE_SECONDS),
    sessionCookieOptions(EDITOR_MAX_AGE_SECONDS),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ editor: false });
  response.cookies.set(EDITOR_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}
