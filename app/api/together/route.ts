import { NextResponse } from "next/server";
import { storageErrorResponse } from "@/lib/memories/store";
import { isSeat } from "@/lib/together/logic";
import { loadSeats, saveSeat } from "@/lib/together/store";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_000;

export async function GET() {
  try {
    return NextResponse.json(await loadSeats(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Too much to say at once." }, { status: 413 });
  }

  let body: { seat?: unknown; doc?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isSeat(body.seat)) {
    return NextResponse.json({ error: "Unknown seat." }, { status: 400 });
  }

  try {
    const doc = await saveSeat(body.seat, body.doc);
    if (!doc) {
      return NextResponse.json({ error: "Invalid player state." }, { status: 400 });
    }
    return NextResponse.json({ now: Date.now(), seen: doc.seen });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
