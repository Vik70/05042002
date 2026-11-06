import { isStorageConfigured, listContentByPrefix, putRawContent } from "@/lib/memories/store";
import { sanitizeDoc, sanitizePortrait } from "@/lib/together/logic";
import { SEATS, type PlayerDoc, type Portrait, type Seat, type SeatsSnapshot } from "@/lib/together/types";

const PREFIX = "together:";
const PORTRAIT_PREFIX = "portrait:";

// Without Supabase (local development) both phones share this process's memory instead.
const localSeats = (globalThis as { __togetherSeats?: Map<string, unknown> }).__togetherSeats ?? new Map<string, unknown>();
(globalThis as { __togetherSeats?: Map<string, unknown> }).__togetherSeats = localSeats;

const readPrefix = async (prefix: string): Promise<Map<string, unknown>> =>
  isStorageConfigured() ? listContentByPrefix(prefix) : localSeats;

const write = async (key: string, data: unknown) => {
  if (isStorageConfigured()) {
    await putRawContent(key, data);
  } else {
    localSeats.set(key, data);
  }
};

export const loadSeats = async (): Promise<SeatsSnapshot> => {
  const content = await readPrefix(PREFIX);
  const seats = Object.fromEntries(SEATS.map((seat) => [seat, sanitizeDoc(content.get(`${PREFIX}${seat}`))])) as Record<
    Seat,
    PlayerDoc | null
  >;
  return { seats, now: Date.now(), shared: isStorageConfigured() };
};

export const saveSeat = async (seat: Seat, raw: unknown): Promise<PlayerDoc | null> => {
  const doc = sanitizeDoc(raw);
  if (!doc) return null;
  const stamped = { ...doc, seen: Date.now() };
  await write(`${PREFIX}${seat}`, stamped);
  return stamped;
};

export const loadPortraits = async (): Promise<Record<Seat, Portrait | null>> => {
  const content = await readPrefix(PORTRAIT_PREFIX);
  return Object.fromEntries(SEATS.map((seat) => [seat, sanitizePortrait(content.get(`${PORTRAIT_PREFIX}${seat}`))])) as Record<
    Seat,
    Portrait | null
  >;
};

export const savePortrait = async (seat: Seat, raw: unknown): Promise<Portrait | null> => {
  const portrait = sanitizePortrait(raw);
  if (!portrait) return null;
  await write(`${PORTRAIT_PREFIX}${seat}`, portrait);
  return portrait;
};
