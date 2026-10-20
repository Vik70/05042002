import { NextResponse } from "next/server";
import { editorRequired, isEditor } from "@/lib/auth/editor";
import { saveHome, storageErrorResponse } from "@/lib/memories/store";

export async function PUT(request: Request) {
  if (!(await isEditor())) {
    return editorRequired();
  }

  try {
    const home = await saveHome(await request.json());
    return NextResponse.json({ home });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
