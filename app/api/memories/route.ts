import { NextResponse } from "next/server";
import { editorRequired, isEditor } from "@/lib/auth/editor";
import { createMemory, storageErrorResponse } from "@/lib/memories/store";

export async function POST(request: Request) {
  if (!(await isEditor())) {
    return editorRequired();
  }

  try {
    const memory = await createMemory(await request.json());
    return NextResponse.json({ memory });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
