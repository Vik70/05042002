import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { EDITOR_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const isEditorConfigured = (): boolean => Boolean(process.env.EDITOR_PASSCODE);

export const isEditor = async (): Promise<boolean> => {
  const store = await cookies();
  return verifySessionToken(store.get(EDITOR_COOKIE)?.value, "editor");
};

export const editorRequired = () =>
  NextResponse.json({ error: "Unlock edit mode first." }, { status: 401 });
