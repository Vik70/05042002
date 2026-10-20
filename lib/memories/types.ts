export const TEMPLATE_IDS = [
  "four-gifts",
  "night-drive",
  "treasure-hunt",
  "golden-hour",
  "spain",
  "six-months",
  "keepsake",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const PALETTE_IDS = ["rose", "ocean", "meadow", "dusk", "citrus", "plum"] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

export type ExtraValue = string | string[];

export interface MemoryData {
  slug: string;
  template: TemplateId;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  location: string;
  story: string;
  albumUrl: string;
  song: string;
  hidden: boolean;
  palette: PaletteId;
  extras: Record<string, ExtraValue>;
}

export interface MemoryRecord extends MemoryData {
  builtIn: boolean;
  edited: boolean;
}

export interface HomeSettings {
  title: string;
  subtitle: string;
  togetherSince: string;
  footer: string;
}

export type FieldKind = "text" | "textarea" | "date" | "url" | "list" | "select" | "toggle";

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface AlbumPhoto {
  src: string;
  width: number;
  height: number;
}
