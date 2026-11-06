import { NextResponse } from "next/server";
import { storageErrorResponse } from "@/lib/memories/store";
import { MAX_PORTRAIT_CHARS, isSeat } from "@/lib/together/logic";
import { loadPortraits, savePortrait } from "@/lib/together/store";
import { SEATS } from "@/lib/together/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const portraits = await loadPortraits();
    const revealed = SEATS.every((seat) => portraits[seat]) && portraits.vik?.round === portraits.aanavee?.round;
    const body = Object.fromEntries(
      SEATS.map((seat) => [seat, portraits[seat] ? { round: portraits[seat].round, image: revealed ? portraits[seat].image : "" } : null]),
    );
    return NextResponse.json({ portraits: body }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_PORTRAIT_CHARS + 1_000) {
    return NextResponse.json({ error: "That photo is too big, even after shrinking it." }, { status: 413 });
  }

  let body: { seat?: unknown; round?: unknown; image?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isSeat(body.seat)) {
    return NextResponse.json({ error: "Unknown seat." }, { status: 400 });
  }

  try {
    const portrait = await savePortrait(body.seat, { round: body.round, image: body.image });
    if (!portrait) {
      return NextResponse.json({ error: "That doesn't look like a photo." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = storageErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
