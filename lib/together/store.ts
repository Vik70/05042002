import { isStorageConfigured, listContentByPrefix, putRawContent } from "@/lib/memories/store";
import { sanitizeDoc } from "@/lib/together/logic";
import { SEATS, type PlayerDoc, type Seat, type SeatsSnapshot } from "@/lib/together/types";

const PREFIX = "together:";

// Without Supabase (local development) both phones share this process's memory instead.
const localSeats = (globalThis as { __togetherSeats?: Map<string, unknown> }).__togetherSeats ?? new Map<string, unknown>();
(globalThis as { __togetherSeats?: Map<string, unknown> }).__togetherSeats = localSeats;

export const loadSeats = async (): Promise<SeatsSnapshot> => {
  const shared = isStorageConfigured();
  const content = shared ? await listContentByPrefix(PREFIX) : localSeats;
  const seats = Object.fromEntries(SEATS.map((seat) => [seat, sanitizeDoc(content.get(`${PREFIX}${seat}`))])) as Record<
    Seat,
    PlayerDoc | null
  >;
  return { seats, now: Date.now(), shared };
};

export const saveSeat = async (seat: Seat, raw: unknown): Promise<PlayerDoc | null> => {
  const doc = sanitizeDoc(raw);
  if (!doc) return null;
  const stamped = { ...doc, seen: Date.now() };
  if (isStorageConfigured()) {
    await putRawContent(`${PREFIX}${seat}`, stamped);
  } else {
    localSeats.set(`${PREFIX}${seat}`, stamped);
  }
  return stamped;
};
