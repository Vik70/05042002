import { NextResponse } from "next/server";
import { editorRequired, isEditor } from "@/lib/auth/editor";
import { removeMemory, saveMemory, storageErrorResponse } from "@/lib/memories/store";

type Context = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: Context) {
  if (!(await isEditor())) {
    return editorRequired();
  }

  try {
    const { slug } = await params;
    const memory = await saveMemory(slug, await request.json());
    return NextResponse.json({ memory });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isEditor())) {
    return editorRequired();
  }

  try {
    const { slug } = await params;
    const result = await removeMemory(slug);
    return NextResponse.json({ result });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
