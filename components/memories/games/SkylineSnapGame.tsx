"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { seeded } from "@/components/memories/shared";
import { photoUrl } from "@/lib/memories/format";
import type { AlbumPhoto } from "@/lib/memories/types";
import { sfx } from "@/lib/sfx";

const PANO_START = -700;
const PANO_END = 2300;
const PANO_WIDTH = PANO_END - PANO_START;
const HEIGHT = 300;
const FOCUS_RANGE = 48;
const MIN_OFFSET = 160;
const MAX_OFFSET = 1400;
// Smaller than twice FOCUS_RANGE so the arrows can always centre a landmark.
const PAN_STEP = 60;

const LANDMARKS = [
  { name: "BT Tower", x: 230 },
  { name: "The London Eye", x: 520 },
  { name: "St Paul's", x: 820 },
  { name: "The Gherkin", x: 1060 },
  { name: "The Shard", x: 1310 },
];

const mixHex = (from: string, to: string, amount: number) => {
  const a = from.match(/\w\w/g)!.map((part) => parseInt(part, 16));
  const b = to.match(/\w\w/g)!.map((part) => parseInt(part, 16));
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * amount)).join(",")})`;
};

export const skyColors = (progress: number) => ({
  top: mixHex("#ffc98a", "#2b2350", progress),
  middle: mixHex("#ff9f6e", "#8a4f86", progress),
  bottom: mixHex("#ffe2a8", "#f08a6b", progress),
  land: mixHex("#5a2f3d", "#1b1330", progress),
  hill: mixHex("#3f2a2c", "#120c20", progress),
});

function Skyline({ progress, viewBox, id }: { progress: number; viewBox?: string; id: string }) {
  const sky = skyColors(progress);
  const buildings = useMemo(() => {
    const random = seeded(4726);
    const list: { x: number; w: number; h: number; windows: [number, number][] }[] = [];
    let x = PANO_START;
    while (x < PANO_END) {
      const w = 26 + random() * 46;
      const h = 30 + random() * 70;
      const windows: [number, number][] = [];
      for (let row = 0; row < Math.floor(h / 14); row += 1) {
        for (let col = 0; col < Math.floor(w / 12); col += 1) {
          if (random() < 0.35) windows.push([x + 5 + col * 12, 262 - h + 8 + row * 14]);
        }
      }
      list.push({ x, w, h, windows });
      x += w + random() * 6;
    }
    return list;
  }, []);
  const sunY = 120 + progress * 170;

  return (
    <svg viewBox={viewBox ?? `${PANO_START} 0 ${PANO_WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="0.6" stopColor={sky.middle} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor="#fff6d8" />
          <stop offset="0.45" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff9f6e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={PANO_START} width={PANO_WIDTH} height={HEIGHT} fill={`url(#${id}-sky)`} />
      <circle cx="900" cy={sunY} r="120" fill={`url(#${id}-sun)`} />
      <circle cx="900" cy={sunY} r="34" fill="#fff3cf" opacity={1 - progress * 0.6} />

      <g fill={sky.land}>
        {buildings.map((building) => (
          <rect key={building.x} x={building.x} y={262 - building.h} width={building.w} height={building.h + 10} />
        ))}
        {/* BT Tower */}
        <rect x="222" y="70" width="16" height="200" />
        {[78, 92, 106, 120].map((y) => (
          <rect key={y} x="216" y={y} width="28" height="8" rx="3" />
        ))}
        <rect x="229" y="30" width="2" height="42" />
        {/* London Eye */}
        <circle cx="520" cy="170" r="66" fill="none" stroke={sky.land} strokeWidth="5" />
        {Array.from({ length: 16 }, (_, index) => {
          const angle = (index / 16) * Math.PI * 2;
          return (
            <g key={index}>
              <line x1="520" y1="170" x2={520 + Math.cos(angle) * 66} y2={170 + Math.sin(angle) * 66} stroke={sky.land} strokeWidth="1.2" />
              <circle cx={520 + Math.cos(angle) * 69} cy={170 + Math.sin(angle) * 69} r="4" />
            </g>
          );
        })}
        <path d="M 520 170 L 486 268 L 494 268 L 520 182 L 546 268 L 554 268 Z" />
        {/* St Paul's */}
        <rect x="770" y="214" width="100" height="56" />
        <rect x="792" y="180" width="56" height="36" />
        <path d="M 788 182 A 32 34 0 0 1 852 182 Z" />
        <rect x="815" y="128" width="10" height="20" />
        <path d="M 817 128 L 820 108 L 823 128 Z" />
        <rect x="760" y="196" width="12" height="40" />
        <rect x="868" y="196" width="12" height="40" />
        {/* The Gherkin */}
        <path d="M 1060 96 C 1094 120 1092 220 1078 268 L 1042 268 C 1028 220 1026 120 1060 96 Z" />
        {/* The Shard */}
        <path d="M 1276 268 L 1304 60 L 1308 40 L 1311 62 L 1316 52 L 1344 268 Z" />
      </g>

      <g fill="#ffe08a" opacity={Math.max(0, progress * 1.2 - 0.2)}>
        {buildings.flatMap((building) =>
          building.windows.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="3" height="4" />),
        )}
        <circle cx="520" cy="104" r="3" fill="#ff5d73" />
        <circle cx="1308" cy="44" r="2.5" fill="#ff5d73" />
      </g>

      <path
        d={`M ${PANO_START} 300 L ${PANO_START} 258 C -400 270 -150 244 0 262 C 300 240 520 270 800 256 S 1300 246 1600 266 S 2000 250 ${PANO_END} 260 L ${PANO_END} 300 Z`}
        fill={sky.hill}
      />
      {[-560, -320, -90, 60, 140, 380, 690, 980, 1210, 1460, 1720, 1980, 2200].map((x, index) => (
        <g key={x} fill={sky.hill}>
          <rect x={x - 2} y={238 + (index % 2) * 6} width="4" height="26" />
          <circle cx={x} cy={232 + (index % 2) * 6} r={14 + (index % 3) * 3} />
        </g>
      ))}
    </svg>
  );
}

export function SkylineSnapGame({ photos, finale, stamp }: { photos: AlbumPhoto[]; finale: string; stamp: string }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 360, height: 260 });
  const [offset, setOffset] = useState(MIN_OFFSET);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [flash, setFlash] = useState(0);
  const [note, setNote] = useState("");
  const drag = useRef<{ x: number; offset: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const progress = snaps.length / LANDMARKS.length;

  const unit = frameSize.height / HEIGHT;
  const clampOffset = (value: number) => Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, value));
  const focused = LANDMARKS.findIndex((landmark) => Math.abs(landmark.x - offset) < FOCUS_RANGE);
  const complete = snaps.length === LANDMARKS.length;

  const snap = () => {
    sfx.shutter();
    setFlash((value) => value + 1);
    if (focused < 0) {
      setNote("A lovely photo of some roofs. Find a landmark!");
      return;
    }
    if (snaps.includes(focused)) {
      setNote(`Already got ${LANDMARKS[focused].name}.`);
      return;
    }
    setNote("");
    setSnaps((current) => [...current, focused]);
  };

  const pan = (delta: number) => setOffset((current) => clampOffset(current + delta));

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={frameRef}
        className="relative h-[260px] w-full cursor-grab touch-none select-none overflow-hidden rounded-[20px] shadow-[0_24px_60px_rgba(60,20,30,0.35)] active:cursor-grabbing md:h-[340px]"
        onPointerDown={(event) => {
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {}
          drag.current = { x: event.clientX, offset };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setOffset(clampOffset(drag.current.offset - (event.clientX - drag.current.x) / unit));
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div
          className={`absolute top-0 h-full ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
          style={{ width: PANO_WIDTH * unit, transform: `translateX(${frameSize.width / 2 - (offset - PANO_START) * unit}px)` }}
        >
          <Skyline progress={progress} id="pano" />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`relative h-[70%] w-[46%] transition-colors duration-300 ${focused >= 0 ? "text-[#fff1c9]" : "text-white/60"}`}>
            {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-l-2 border-b-2", "right-0 bottom-0 border-r-2 border-b-2"].map((corner) => (
              <span key={corner} className={`absolute h-6 w-6 border-current ${corner}`} />
            ))}
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current" />
            {focused >= 0 ? (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1 font-film text-lg italic text-[#fff1c9] backdrop-blur">
                {LANDMARKS[focused].name}
                {snaps.includes(focused) ? " ✓" : ""}
              </span>
            ) : null}
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-3 right-4 font-lcd text-xl text-[#ff9d3b] [text-shadow:0_0_6px_rgba(255,140,40,0.8)]">{stamp}</span>
        <span key={flash} className="pointer-events-none absolute inset-0 bg-white opacity-0" style={{ animation: flash ? "flash 0.35s ease-out" : undefined }} />
      </div>

      <div className="flex items-center gap-5">
        <button type="button" onClick={() => pan(-PAN_STEP)} aria-label="Look left" className="grid h-12 w-12 place-items-center rounded-full border border-[#3b1610]/20 bg-white/50 text-xl text-[#3b1610] backdrop-blur hover:bg-white/80">
          ←
        </button>
        <button
          type="button"
          onClick={snap}
          disabled={complete}
          aria-label="Take a photo"
          className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#e8553b] shadow-[0_8px_24px_rgba(232,85,59,0.45)] transition active:scale-90 disabled:opacity-50"
        >
          <span className="h-12 w-12 rounded-full border-2 border-white/70" />
        </button>
        <button type="button" onClick={() => pan(PAN_STEP)} aria-label="Look right" className="grid h-12 w-12 place-items-center rounded-full border border-[#3b1610]/20 bg-white/50 text-xl text-[#3b1610] backdrop-blur hover:bg-white/80">
          →
        </button>
      </div>
      <p className="min-h-[1.75rem] text-center font-film text-xl italic text-[#3b1610]/80">
        {complete ? "" : note || `Drag the view and snap all five landmarks · ${snaps.length}/5`}
      </p>

      <div className="flex w-full flex-wrap justify-center gap-4">
        {snaps.map((landmarkIndex, index) => {
          const landmark = LANDMARKS[landmarkIndex];
          const photo = photos.length ? photos[index % photos.length] : null;
          return (
            <figure
              key={landmark.name}
              className="w-[42%] max-w-[180px] bg-[#fdfbf6] p-2.5 pb-3 shadow-[0_10px_24px_rgba(80,30,10,0.25)]"
              style={{ transform: `rotate(${index % 2 === 0 ? -3 : 2.5}deg)` }}
            >
              <div className="aspect-square overflow-hidden bg-[#2b2350]" style={{ animation: "develop 3.5s ease-out both" }}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl(photo, 500)} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <Skyline progress={(index + 1) / LANDMARKS.length} viewBox={`${landmark.x - 120} 40 240 240`} id={`snap-${index}`} />
                )}
              </div>
              <figcaption className="mt-2 text-center font-hand text-xl leading-none text-[#3b1610]">{landmark.name}</figcaption>
            </figure>
          );
        })}
      </div>

      {complete ? <p className="animate-fade-up text-center font-film text-3xl italic text-[#3b1610] md:text-4xl">{finale}</p> : null}
    </div>
  );
}
