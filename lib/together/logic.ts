import { FINALE_INDEX, PLAYER_NAMES, STEPS } from "@/lib/together/content";
import { SEATS, type AnswerValue, type PlayerDoc, type Reaction, type Seat } from "@/lib/together/types";

const MAX_TEXT = 600;
const MAX_ITEMS = 16;
const MAX_KEYS = 8;
const MAX_REACTIONS = 8;

export const isSeat = (value: unknown): value is Seat => SEATS.includes(value as Seat);

export const freshDoc = (round = 0): PlayerDoc => ({
  round,
  at: 0,
  deck: 0,
  holding: false,
  answers: {},
  reactions: [],
  seen: 0,
});

const sanitizeAnswer = (value: unknown, depth = 0): AnswerValue | undefined => {
  if (typeof value === "string") return value.replace(/\r\n/g, "\n").slice(0, MAX_TEXT);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (depth >= 3 || typeof value !== "object" || value === null) return undefined;

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ITEMS)
      .map((item) => sanitizeAnswer(item, depth + 1))
      .filter((item): item is AnswerValue => item !== undefined);
  }

  const result: Record<string, AnswerValue> = {};
  Object.entries(value)
    .slice(0, MAX_KEYS)
    .forEach(([key, item]) => {
      const clean = sanitizeAnswer(item, depth + 1);
      if (clean !== undefined && /^[a-z0-9-]{1,40}$/i.test(key)) result[key] = clean;
    });
  return result;
};

const readInt = (value: unknown, max: number): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0;

export const sanitizeDoc = (raw: unknown): PlayerDoc | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;
  const stepIds = new Set(STEPS.map((step) => step.id));

  const answers: Record<string, AnswerValue> = {};
  if (typeof input.answers === "object" && input.answers !== null) {
    Object.entries(input.answers as Record<string, unknown>).forEach(([key, value]) => {
      const clean = sanitizeAnswer(value);
      if (stepIds.has(key) && clean !== undefined) answers[key] = clean;
    });
  }

  const reactions: Reaction[] = Array.isArray(input.reactions)
    ? input.reactions
        .filter((item): item is Reaction => typeof item?.id === "number" && typeof item?.emoji === "string")
        .slice(-MAX_REACTIONS)
        .map((item) => ({ id: readInt(item.id, Number.MAX_SAFE_INTEGER), emoji: item.emoji.slice(0, 8) }))
    : [];

  return {
    round: readInt(input.round, 10_000),
    at: readInt(input.at, FINALE_INDEX),
    deck: readInt(input.deck, 1_000),
    holding: input.holding === true,
    answers,
    reactions,
    seen: readInt(input.seen, Number.MAX_SAFE_INTEGER),
  };
};

export const ONLINE_WINDOW_MS = 12_000;

export const isOnline = (doc: PlayerDoc | null, now: number): boolean =>
  doc !== null && doc.seen > 0 && now - doc.seen < ONLINE_WINDOW_MS;

/** A seat that hasn't caught up with the latest round counts as a fresh player. */
export const inRound = (doc: PlayerDoc | null, round: number): PlayerDoc =>
  doc && doc.round === round ? doc : { ...freshDoc(round), seen: doc?.seen ?? 0, reactions: doc?.reactions ?? [] };

export const asNumbers = (value: AnswerValue | undefined): number[] =>
  Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];

export const asStrings = (value: AnswerValue | undefined): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];

export const asText = (value: AnswerValue | undefined): string => (typeof value === "string" ? value : "");

export const asRecord = (value: AnswerValue | undefined): Record<string, AnswerValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};

export const sameWish = (left: string, right: string) => left.trim().toLowerCase() === right.trim().toLowerCase();

// Deterministic so both phones deal the same card order for a round.
export const shuffledDeck = (cards: string[], round: number): string[] => {
  let seed = (round + 7) * 7919;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const deck = [...cards];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
};

export interface DinnerSummary {
  started: boolean;
  finished: boolean;
  inSync: { matched: number; total: number };
  readEachOther: Record<Seat, { right: number; total: number }>;
  goodBits: Record<Seat, string>;
  smoother: Record<Seat, Record<string, string>>;
  dates: string[];
  wishes: Record<Seat, string[]>;
}

export const summarise = (docs: Record<Seat, PlayerDoc | null>): DinnerSummary => {
  const round = Math.max(docs.vik?.round ?? 0, docs.aanavee?.round ?? 0);
  const vik = inRound(docs.vik, round);
  const aanavee = inRound(docs.aanavee, round);
  const players: Record<Seat, PlayerDoc> = { vik, aanavee };

  const pick = STEPS.find((step) => step.kind === "pick");
  const guess = STEPS.find((step) => step.kind === "guess");
  const write = STEPS.find((step) => step.kind === "write");
  const choose = STEPS.find((step) => step.kind === "choose");
  const wish = STEPS.find((step) => step.kind === "wish");

  const inSync = { matched: 0, total: 0 };
  if (pick?.kind === "pick" && vik.answers[pick.id] && aanavee.answers[pick.id]) {
    const left = asNumbers(vik.answers[pick.id]);
    const right = asNumbers(aanavee.answers[pick.id]);
    inSync.total = pick.questions.length;
    inSync.matched = pick.questions.filter((_, index) => left[index] !== undefined && left[index] === right[index]).length;
  }

  const readEachOther = { vik: { right: 0, total: 0 }, aanavee: { right: 0, total: 0 } };
  if (guess?.kind === "guess" && vik.answers[guess.id] && aanavee.answers[guess.id]) {
    SEATS.forEach((seat) => {
      const partner = players[seat === "vik" ? "aanavee" : "vik"];
      const guesses = asNumbers(asRecord(players[seat].answers[guess.id]).guess);
      const truth = asNumbers(asRecord(partner.answers[guess.id]).self);
      readEachOther[seat] = {
        total: guess.questions.length,
        right: guess.questions.filter((_, index) => guesses[index] !== undefined && guesses[index] === truth[index]).length,
      };
    });
  }

  const both = (id: string | undefined) => Boolean(id && vik.answers[id] !== undefined && aanavee.answers[id] !== undefined);

  const goodBits = { vik: "", aanavee: "" };
  if (write && both(write.id)) {
    goodBits.vik = asText(vik.answers[write.id]);
    goodBits.aanavee = asText(aanavee.answers[write.id]);
  }

  const smoother: Record<Seat, Record<string, string>> = { vik: {}, aanavee: {} };
  if (choose?.kind === "choose" && both(choose.id)) {
    SEATS.forEach((seat) => {
      const record = asRecord(players[seat].answers[choose.id]);
      choose.parts.forEach((part) => {
        smoother[seat][part.key] = asText(record[part.key]);
      });
    });
  }

  const wishes = { vik: [] as string[], aanavee: [] as string[] };
  let dates: string[] = [];
  if (wish && both(wish.id)) {
    wishes.vik = asStrings(vik.answers[wish.id]);
    wishes.aanavee = asStrings(aanavee.answers[wish.id]);
    dates = wishes.vik.filter((item) => wishes.aanavee.some((other) => sameWish(item, other)));
  }

  return {
    started: vik.at > 0 && aanavee.at > 0,
    finished: vik.answers.finale === true || aanavee.answers.finale === true,
    inSync,
    readEachOther,
    goodBits,
    smoother,
    dates,
    wishes,
  };
};

export const syncLine = ({ matched, total }: { matched: number; total: number }): string => {
  if (!total) return "";
  if (matched >= total - 1) return "Practically the same person. Slightly worrying, honestly.";
  if (matched >= Math.ceil(total / 2)) return "In sync where it counts.";
  return "Opposites. Which explains the sparks.";
};

export const nameOf = (seat: Seat) => PLAYER_NAMES[seat];
