export const GAME_WIDTH = 1440;
export const GAME_HEIGHT = 810;
export const SCENE_FADE_MS = 380;
export const STORAGE_KEY = "foxfire-trials-save-v1";

export const COLORS = {
  shrineDark: 0x0a0a1a,
  moonlit: 0x1a1a3e,
  lanternGold: 0xf5c542,
  lanternRed: 0xc0392b,
  sakura: 0xf8b4c8,
  spiritBlue: 0x6ec6ff,
  paperCream: 0xf5efe0,
  textInk: 0x2c1810,
  spiritPurple: 0x7c5cbf,
  glowWhite: 0xfaf7ff,
} as const;

export const CSS_COLORS = {
  shrineDark: "#0a0a1a",
  moonlit: "#1a1a3e",
  lanternGold: "#f5c542",
  lanternRed: "#c0392b",
  sakura: "#f8b4c8",
  spiritBlue: "#6ec6ff",
  paperCream: "#f5efe0",
  textInk: "#2c1810",
  spiritPurple: "#7c5cbf",
} as const;

export const HUB_GATE_POSITIONS = {
  marksman: { xPct: 21, yPct: 57 },
  rally: { xPct: 50, yPct: 49 },
  apothecary: { xPct: 78, yPct: 57 },
  voice: { xPct: 50, yPct: 72 },
} as const;
