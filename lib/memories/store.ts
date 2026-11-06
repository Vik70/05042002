import { cache } from "react";
import { BUILT_IN_MEMORIES, BUILT_IN_SLUGS, DEFAULT_HOME, createKeepsakeBase } from "@/lib/memories/defaults";
import { TEMPLATES } from "@/lib/memories/templates";
import {
  PALETTE_IDS,
  TEMPLATE_IDS,
  type ExtraValue,
  type HomeSettings,
  type MemoryData,
  type MemoryRecord,
  type PaletteId,
  type TemplateId,
} from "@/lib/memories/types";

export type StorageStatus =
  | { state: "ready" }
  | { state: "unconfigured" }
  | { state: "error"; message: string };

export class StorageError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends Error {}

const HOME_KEY = "home";
const MEMORY_PREFIX = "memory:";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,59}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LIMITS = {
  title: 120,
  subtitle: 200,
  location: 160,
  story: 10_000,
  albumUrl: 600,
  song: 200,
  extraText: 6_000,
  listItem: 600,
  listLength: 12,
};

const getConfig = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const token = process.env.MEMORIES_TOKEN;
  return url && key && token ? { url, key, token } : null;
};

export const isStorageConfigured = (): boolean => getConfig() !== null;

const rpc = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T> => {
  const config = getConfig();
  if (!config) {
    throw new StorageError(503, "unconfigured", "Supabase environment variables are not set.");
  }

  const headers: Record<string, string> = {
    apikey: config.key,
    "Content-Type": "application/json",
  };
  if (config.key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${config.key}`;
  }

  const response = await fetch(`${config.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_token: config.token, ...args }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  const text = await response.text();
  if (!response.ok) {
    let code = String(response.status);
    let message = text;
    try {
      const parsed = JSON.parse(text) as { code?: string; message?: string };
      code = parsed.code ?? code;
      message = parsed.message ?? message;
    } catch {
      // Non-JSON error bodies are reported as-is.
    }
    throw new StorageError(response.status, code, message);
  }

  return (text ? JSON.parse(text) : null) as T;
};

let claimAttempted = false;

const isUnauthorized = (error: unknown): boolean =>
  error instanceof StorageError && (error.code === "28000" || error.status === 403);

const withClaim = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (isUnauthorized(error) && !claimAttempted) {
      claimAttempted = true;
      const claimed = await rpc<boolean>("aanavee_claim");
      if (claimed) {
        return run();
      }
    }
    throw error;
  }
};

const describeStorageError = (error: unknown): string => {
  if (error instanceof StorageError) {
    if (error.code === "PGRST202" || error.code === "42883") {
      return "The database hasn't been set up yet. Run supabase/schema.sql in the Supabase SQL editor.";
    }
    if (isUnauthorized(error)) {
      return "The database rejected this site's MEMORIES_TOKEN.";
    }
    return `Database error (${error.code}): ${error.message}`;
  }
  return error instanceof Error ? error.message : "Unknown database error.";
};

const listContent = async (): Promise<Map<string, unknown>> => {
  const rows = await withClaim(() =>
    rpc<{ key: string; data: unknown }[]>("aanavee_list"),
  );
  return new Map((rows ?? []).map((row) => [row.key, row.data]));
};

const putContent = (key: string, data: unknown) =>
  withClaim(() => rpc<string>("aanavee_put", { p_key: key, p_data: data }));

const deleteContent = (key: string) =>
  withClaim(() => rpc<null>("aanavee_delete", { p_key: key }));

export const listContentByPrefix = async (prefix: string): Promise<Map<string, unknown>> => {
  const content = await listContent();
  return new Map([...content].filter(([key]) => key.startsWith(prefix)));
};

export const putRawContent = async (key: string, data: unknown): Promise<void> => {
  await putContent(key, data);
};

const readString = (value: unknown, fallback: string, limit: number): string =>
  typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, limit) : fallback;

const readDate = (value: unknown, fallback: string): string => {
  if (value === "") {
    return "";
  }
  return typeof value === "string" && DATE_PATTERN.test(value) ? value : fallback;
};

const readUrl = (value: unknown, fallback: string): string => {
  const text = readString(value, fallback, LIMITS.albumUrl);
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
};

const readExtras = (
  template: TemplateId,
  value: unknown,
  fallback: Record<string, ExtraValue>,
): Record<string, ExtraValue> => {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const extras: Record<string, ExtraValue> = {};

  TEMPLATES[template].extraFields.forEach((field) => {
    const incoming = raw[field.key];
    const previous = fallback[field.key];

    if (field.kind === "list") {
      const source = Array.isArray(incoming)
        ? incoming
        : typeof incoming === "string"
          ? incoming.split("\n")
          : Array.isArray(previous)
            ? previous
            : [];
      extras[field.key] = source
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, LIMITS.listItem))
        .filter(Boolean)
        .slice(0, LIMITS.listLength);
      return;
    }

    extras[field.key] = readString(
      incoming,
      typeof previous === "string" ? previous : "",
      LIMITS.extraText,
    );
  });

  return extras;
};

const sanitizeMemory = (raw: unknown, base: MemoryData, allowTemplateChange: boolean): MemoryData => {
  const input = typeof raw === "object" && raw !== null ? (raw as Partial<Record<keyof MemoryData, unknown>>) : {};
  const template =
    allowTemplateChange && TEMPLATE_IDS.includes(input.template as TemplateId)
      ? (input.template as TemplateId)
      : base.template;

  return {
    slug: base.slug,
    template,
    title: readString(input.title, base.title, LIMITS.title) || base.title,
    subtitle: readString(input.subtitle, base.subtitle, LIMITS.subtitle),
    startDate: readDate(input.startDate, base.startDate) || base.startDate,
    endDate: readDate(input.endDate, base.endDate),
    location: readString(input.location, base.location, LIMITS.location),
    story: readString(input.story, base.story, LIMITS.story),
    albumUrl: readUrl(input.albumUrl, base.albumUrl),
    song: readString(input.song, base.song, LIMITS.song),
    hidden: typeof input.hidden === "boolean" ? input.hidden : base.hidden,
    palette: PALETTE_IDS.includes(input.palette as PaletteId) ? (input.palette as PaletteId) : base.palette,
    extras: readExtras(template, input.extras, base.extras),
  };
};

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const diffAgainstDefault = (memory: MemoryData, base: MemoryData): Partial<MemoryData> => {
  const diff: Partial<Record<keyof MemoryData, unknown>> = {};

  (Object.keys(memory) as (keyof MemoryData)[]).forEach((key) => {
    if (key === "slug" || key === "template" || key === "extras") {
      return;
    }
    if (!sameValue(memory[key], base[key])) {
      diff[key] = memory[key];
    }
  });

  const extrasDiff: Record<string, ExtraValue> = {};
  Object.entries(memory.extras).forEach(([key, value]) => {
    if (!sameValue(value, base.extras[key])) {
      extrasDiff[key] = value;
    }
  });
  if (Object.keys(extrasDiff).length > 0) {
    diff.extras = extrasDiff;
  }

  return diff as Partial<MemoryData>;
};

const sortMemories = (memories: MemoryRecord[]): MemoryRecord[] =>
  [...memories].sort(
    (left, right) =>
      left.startDate.localeCompare(right.startDate) || left.title.localeCompare(right.title),
  );

const sanitizeHome = (raw: unknown): HomeSettings => {
  const input = typeof raw === "object" && raw !== null ? (raw as Partial<Record<keyof HomeSettings, unknown>>) : {};
  return {
    title: readString(input.title, DEFAULT_HOME.title, LIMITS.title) || DEFAULT_HOME.title,
    subtitle: readString(input.subtitle, DEFAULT_HOME.subtitle, LIMITS.subtitle),
    togetherSince: readDate(input.togetherSince, DEFAULT_HOME.togetherSince),
    footer: readString(input.footer, DEFAULT_HOME.footer, LIMITS.subtitle),
  };
};

const buildRecords = (content: Map<string, unknown>): MemoryRecord[] => {
  const records: MemoryRecord[] = BUILT_IN_MEMORIES.map((base) => {
    const stored = content.get(`${MEMORY_PREFIX}${base.slug}`);
    return {
      ...sanitizeMemory(stored ?? {}, base, false),
      builtIn: true,
      edited: stored !== undefined,
    };
  });

  content.forEach((data, key) => {
    if (!key.startsWith(MEMORY_PREFIX)) {
      return;
    }
    const slug = key.slice(MEMORY_PREFIX.length);
    if (BUILT_IN_SLUGS.has(slug) || !SLUG_PATTERN.test(slug)) {
      return;
    }
    records.push({
      ...sanitizeMemory(data, createKeepsakeBase(slug), true),
      builtIn: false,
      edited: true,
    });
  });

  return sortMemories(records);
};

export interface SiteContent {
  memories: MemoryRecord[];
  home: HomeSettings;
  storage: StorageStatus;
}

export const loadSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isStorageConfigured()) {
    return { memories: buildRecords(new Map()), home: DEFAULT_HOME, storage: { state: "unconfigured" } };
  }

  try {
    const content = await listContent();
    return {
      memories: buildRecords(content),
      home: sanitizeHome(content.get(HOME_KEY)),
      storage: { state: "ready" },
    };
  } catch (error) {
    console.error("Failed to load memories from Supabase", error);
    return {
      memories: buildRecords(new Map()),
      home: DEFAULT_HOME,
      storage: { state: "error", message: describeStorageError(error) },
    };
  }
});

export const loadMemory = async (slug: string) => {
  const site = await loadSiteContent();
  const index = site.memories.findIndex((memory) => memory.slug === slug);
  if (index < 0) {
    return null;
  }

  const visible = site.memories.filter((memory) => !memory.hidden || memory.slug === slug);
  const position = visible.findIndex((memory) => memory.slug === slug);
  return {
    memory: site.memories[index],
    previous: position > 0 ? visible[position - 1] : null,
    next: position < visible.length - 1 ? visible[position + 1] : null,
    collection: visible.filter((memory) => !memory.hidden),
    storage: site.storage,
  };
};

const requireStorage = () => {
  if (!isStorageConfigured()) {
    throw new StorageError(503, "unconfigured", "Editing needs the Supabase environment variables to be set.");
  }
};

export const saveMemory = async (slug: string, input: unknown): Promise<MemoryRecord> => {
  requireStorage();
  const content = await listContent();
  const builtIn = BUILT_IN_MEMORIES.find((memory) => memory.slug === slug);

  if (builtIn) {
    const sanitized = sanitizeMemory(input, builtIn, false);
    await putContent(`${MEMORY_PREFIX}${slug}`, diffAgainstDefault(sanitized, builtIn));
    return { ...sanitized, builtIn: true, edited: true };
  }

  const existing = content.get(`${MEMORY_PREFIX}${slug}`);
  if (existing === undefined) {
    throw new NotFoundError(`No memory called ${slug}.`);
  }

  const current = sanitizeMemory(existing, createKeepsakeBase(slug), true);
  const sanitized = sanitizeMemory(input, current, false);
  await putContent(`${MEMORY_PREFIX}${slug}`, sanitized);
  return { ...sanitized, builtIn: false, edited: true };
};

const slugify = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "memory";

export const createMemory = async (input: unknown): Promise<MemoryRecord> => {
  requireStorage();
  const content = await listContent();
  const title = readString((input as { title?: unknown })?.title, "", LIMITS.title) || "A new memory";
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (BUILT_IN_SLUGS.has(slug) || content.has(`${MEMORY_PREFIX}${slug}`)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const memory = sanitizeMemory(input, { ...createKeepsakeBase(slug), title }, false);
  await putContent(`${MEMORY_PREFIX}${slug}`, memory);
  return { ...memory, builtIn: false, edited: true };
};

export const removeMemory = async (slug: string): Promise<"reset" | "deleted"> => {
  requireStorage();
  if (!SLUG_PATTERN.test(slug)) {
    throw new NotFoundError(`No memory called ${slug}.`);
  }
  await deleteContent(`${MEMORY_PREFIX}${slug}`);
  return BUILT_IN_SLUGS.has(slug) ? "reset" : "deleted";
};

export const saveHome = async (input: unknown): Promise<HomeSettings> => {
  requireStorage();
  const home = sanitizeHome(input);
  await putContent(HOME_KEY, home);
  return home;
};

export const storageErrorResponse = (error: unknown) => {
  if (error instanceof NotFoundError) {
    return { status: 404, message: error.message };
  }
  if (error instanceof StorageError) {
    return { status: error.status === 503 ? 503 : 502, message: describeStorageError(error) };
  }
  return { status: 500, message: describeStorageError(error) };
};
