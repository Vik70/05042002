import {
  Caveat,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Instrument_Serif,
  Playfair_Display,
  VT323,
} from "next/font/google";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});
const poem = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  preload: false,
});
const lcd = VT323({ subsets: ["latin"], variable: "--font-vt323", weight: "400", display: "swap", preload: false });
const film = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});
const fiesta = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

export const fontVariables = [sans, hand, display, poem, lcd, film, fiesta]
  .map((font) => font.variable)
  .join(" ");
