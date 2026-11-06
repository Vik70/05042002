import type { FieldSpec, PaletteId, TemplateId } from "@/lib/memories/types";

export interface Palette {
  label: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  rose: {
    label: "Rose",
    background: "linear-gradient(160deg, #fde6e4 0%, #f6c9cf 55%, #eaa9b8 100%)",
    surface: "#fff6f4",
    ink: "#4a1f2b",
    accent: "#c2456b",
  },
  ocean: {
    label: "Ocean",
    background: "linear-gradient(160deg, #dff3f6 0%, #a9d8e3 55%, #6fb0c8 100%)",
    surface: "#f3fbfc",
    ink: "#0f3442",
    accent: "#1c7894",
  },
  meadow: {
    label: "Meadow",
    background: "linear-gradient(160deg, #eef5df 0%, #cfe3b4 55%, #a6c98a 100%)",
    surface: "#fbfdf4",
    ink: "#253a1c",
    accent: "#5a8a3a",
  },
  dusk: {
    label: "Dusk",
    background: "linear-gradient(160deg, #2b2350 0%, #4b3474 55%, #8a4f86 100%)",
    surface: "#1d1838",
    ink: "#f6ecff",
    accent: "#f3b5d8",
  },
  citrus: {
    label: "Citrus",
    background: "linear-gradient(160deg, #fff4d6 0%, #ffd9a0 55%, #ffb27a 100%)",
    surface: "#fffaf0",
    ink: "#4a2a0c",
    accent: "#e0761f",
  },
  plum: {
    label: "Plum",
    background: "linear-gradient(160deg, #3a1630 0%, #5c2346 55%, #8e3b5c 100%)",
    surface: "#2a1023",
    ink: "#fbe9ee",
    accent: "#f0b45a",
  },
};

export interface TemplateMeta {
  label: string;
  gameName: string;
  card: {
    background: string;
    ink: string;
    accent: string;
  };
  extraFields: FieldSpec[];
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  "four-gifts": {
    label: "Moonlit shrine",
    gameName: "The Four Gifts",
    card: {
      background:
        "radial-gradient(circle at 70% 20%, rgba(245,197,66,0.35), transparent 40%), linear-gradient(180deg, #121233 0%, #1a1a3e 60%, #2a1840 100%)",
      ink: "#f5efe0",
      accent: "#f5c542",
    },
    extraFields: [],
  },
  "night-drive": {
    label: "Night drive to the sea",
    gameName: "Join the stars",
    card: {
      background:
        "radial-gradient(circle at 30% 18%, rgba(160,190,255,0.25), transparent 35%), linear-gradient(180deg, #050816 0%, #0b1a3a 65%, #12345a 100%)",
      ink: "#e8eeff",
      accent: "#9fd3ff",
    },
    extraFields: [
      {
        key: "starNotes",
        label: "Constellation notes",
        kind: "list",
        help: "One line per constellation. Each line appears when a constellation is finished (3 lines).",
      },
      { key: "finale", label: "Final line", kind: "text" },
    ],
  },
  "treasure-hunt": {
    label: "Garden party treasure hunt",
    gameName: "Hot or cold",
    card: {
      background:
        "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 14px, transparent 14px 28px), linear-gradient(180deg, #fff7df 0%, #e5f0cf 60%, #bcd99b 100%)",
      ink: "#2f3d1f",
      accent: "#e2574c",
    },
    extraFields: [
      {
        key: "clues",
        label: "Treasure hunt clues",
        kind: "list",
        help: "One clue per line, up to 6. Each one is buried somewhere in the garden.",
      },
      { key: "finale", label: "Message in the final chest", kind: "textarea" },
    ],
  },
  "golden-hour": {
    label: "Golden hour on the hill",
    gameName: "Snap the skyline",
    card: {
      background:
        "radial-gradient(circle at 50% 78%, rgba(255,236,170,0.9), transparent 30%), linear-gradient(180deg, #ffb37a 0%, #ff8a6b 45%, #c45a7c 100%)",
      ink: "#3b1610",
      accent: "#fff1c9",
    },
    extraFields: [{ key: "finale", label: "Message after the last photo", kind: "text" }],
  },
  spain: {
    label: "Málaga & Madrid",
    gameName: "Mend the azulejo",
    card: {
      background:
        "radial-gradient(circle at 80% 15%, rgba(255,214,120,0.55), transparent 32%), linear-gradient(180deg, #f7efe1 0%, #f1d2b0 55%, #d9774f 100%)",
      ink: "#3a1d10",
      accent: "#1f4e9c",
    },
    extraFields: [
      { key: "malagaStory", label: "Chapter one: Málaga", kind: "textarea" },
      { key: "madridStory", label: "Chapter two: Madrid", kind: "textarea" },
      { key: "postcard", label: "Postcard message (revealed by the tile puzzle)", kind: "textarea" },
    ],
  },
  "six-months": {
    label: "Six months",
    gameName: "Memory match",
    card: {
      background:
        "radial-gradient(circle at 50% 30%, rgba(255,190,120,0.35), transparent 38%), linear-gradient(180deg, #2a0f1c 0%, #4a1a2c 60%, #6b2a33 100%)",
      ink: "#fbeee4",
      accent: "#e8b86b",
    },
    extraFields: [
      { key: "letter", label: "The letter", kind: "textarea" },
      { key: "signoff", label: "Sign-off", kind: "text" },
      { key: "finale", label: "Message when every pair is matched", kind: "text" },
    ],
  },
  "seven-months": {
    label: "Seven months",
    gameName: "Seven Sparks, live",
    card: {
      background:
        "radial-gradient(circle at 70% 18%, rgba(255,180,107,0.4), transparent 38%), linear-gradient(180deg, #2a0f22 0%, #4a1a34 60%, #7a2a4a 100%)",
      ink: "#fff1e6",
      accent: "#ffcf8a",
    },
    extraFields: [
      { key: "letter", label: "The letter", kind: "textarea" },
      { key: "signoff", label: "Sign-off", kind: "text" },
    ],
  },
  keepsake: {
    label: "Keepsake",
    gameName: "Scratch to reveal",
    card: {
      background: PALETTES.rose.background,
      ink: PALETTES.rose.ink,
      accent: PALETTES.rose.accent,
    },
    extraFields: [
      {
        key: "secret",
        label: "Hidden message",
        kind: "textarea",
        help: "Hidden under a scratch card on the page.",
      },
    ],
  },
};

export const COMMON_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title", kind: "text" },
  { key: "subtitle", label: "Subtitle", kind: "text" },
  { key: "startDate", label: "Date", kind: "date" },
  {
    key: "endDate",
    label: "End date",
    kind: "date",
    help: "Only for trips that span several days. Leave empty otherwise.",
  },
  { key: "location", label: "Where", kind: "text" },
  {
    key: "story",
    label: "The story",
    kind: "textarea",
    help: "Leave a blank line between paragraphs.",
  },
  {
    key: "albumUrl",
    label: "Google Photos album link",
    kind: "url",
    placeholder: "https://photos.app.goo.gl/...",
    help: "In Google Photos open the album, tap Share, then Create link, and paste it here. The photos appear on the page automatically.",
  },
  { key: "song", label: "Our song for this one", kind: "text", placeholder: "Song - Artist" },
];

export const PALETTE_FIELD: FieldSpec = {
  key: "palette",
  label: "Colours",
  kind: "select",
  options: Object.entries(PALETTES).map(([value, palette]) => ({ value, label: palette.label })),
};

export const HIDDEN_FIELD: FieldSpec = {
  key: "hidden",
  label: "Hide this memory from the collection",
  kind: "toggle",
};

export const fieldsForTemplate = (template: TemplateId): FieldSpec[] => [
  ...COMMON_FIELDS,
  ...(template === "keepsake" ? [PALETTE_FIELD] : []),
  ...TEMPLATES[template].extraFields,
  HIDDEN_FIELD,
];

export const cardStyleFor = (template: TemplateId, palette: PaletteId) =>
  template === "keepsake"
    ? {
        background: PALETTES[palette].background,
        ink: PALETTES[palette].ink,
        accent: PALETTES[palette].accent,
      }
    : TEMPLATES[template].card;
