import type { AlbumPhoto } from "@/lib/memories/types";

export const photoUrl = (photo: AlbumPhoto, size: number): string => `${photo.src}=w${size}-h${size}`;

const parseIsoDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options });

export const formatMemoryDate = (startDate: string, endDate = ""): string => {
  const start = parseIsoDate(startDate);
  if (!start) {
    return "";
  }

  const end = parseIsoDate(endDate);
  if (!end || end.getTime() <= start.getTime()) {
    return formatter({ day: "numeric", month: "long", year: "numeric" }).format(start);
  }

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${start.getUTCDate()}–${formatter({ day: "numeric", month: "long", year: "numeric" }).format(end)}`;
  }

  const startLabel = formatter(
    sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" },
  ).format(start);
  return `${startLabel} – ${formatter({ day: "numeric", month: "short", year: "numeric" }).format(end)}`;
};

export const formatShortDate = (value: string): string => {
  const date = parseIsoDate(value);
  if (!date) {
    return "";
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${String(date.getUTCFullYear()).slice(2)}`;
};

export const formatFilmStamp = (value: string): string => {
  const date = parseIsoDate(value);
  if (!date) {
    return "";
  }

  return `’${String(date.getUTCFullYear()).slice(2)} ${date.getUTCMonth() + 1} ${date.getUTCDate()}`;
};

export const daysSince = (value: string, now = new Date()): number | null => {
  const date = parseIsoDate(value);
  if (!date) {
    return null;
  }

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((today - date.getTime()) / 86_400_000));
};

export const toParagraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export const asText = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

export const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
