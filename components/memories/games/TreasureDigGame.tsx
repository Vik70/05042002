"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

interface Spot {
  x: number;
  y: number;
}

interface Dig extends Spot {
  id: number;
  word: string;
  color: string;
  found: boolean;
}

const FIND_RADIUS = 6.5;
const KEEP_OUT: { x: number; y: number; r: number }[] = [
  { x: 74, y: 52, r: 13 },
  { x: 22, y: 20, r: 9 },
];
const CONFETTI = ["#e2574c", "#f4b942", "#5a8a3a", "#f19cbb", "#6fb0c8"];

const feedback = (distance: number) => {
  if (distance < 12) return { word: "hot!", color: "#e2574c" };
  if (distance < 20) return { word: "warm", color: "#f08a3c" };
  if (distance < 32) return { word: "cool", color: "#6fb0c8" };
  return { word: "freezing", color: "#4a7fb5" };
};

const placeTreasures = (count: number): Spot[] => {
  const spots: Spot[] = [];
  let attempts = 0;
  while (spots.length < count && attempts < 2000) {
    attempts += 1;
    const spot = { x: 8 + Math.random() * 84, y: 10 + Math.random() * 56 };
    const blocked = KEEP_OUT.some((zone) => Math.hypot(spot.x - zone.x, spot.y - zone.y) < zone.r);
    const crowded = spots.some((other) => Math.hypot(spot.x - other.x, spot.y - other.y) < 16);
    if (!blocked && !crowded) {
      spots.push(spot);
    }
  }
  return spots;
};

function GardenMap() {
  return (
    <>
      <defs>
        <pattern id="lawn" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#a9cf7f" />
          <path d="M1 5 l1 -2 M4 2 l1 -2" stroke="#93bd69" strokeWidth="0.5" />
        </pattern>
        <pattern id="gingham" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#fff" />
          <rect width="2" height="4" fill="#e2574c" opacity="0.45" />
          <rect width="4" height="2" fill="#e2574c" opacity="0.45" />
        </pattern>
      </defs>
      <rect width="100" height="75" fill="url(#lawn)" />
      <path d="M -2 66 C 20 58 30 70 50 62 S 80 56 102 62 L 102 77 L -2 77 Z" fill="#d9c49a" opacity="0.9" />
      <path d="M 50 62 C 46 50 52 40 48 28 S 50 8 54 -2" fill="none" stroke="#e8d7b0" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 5.5" />
      {/* Pond */}
      <ellipse cx="74" cy="52" rx="12" ry="7" fill="#7fbcd6" />
      <ellipse cx="72" cy="50" rx="6" ry="2" fill="#bfe1ee" opacity="0.7" />
      <circle cx="79" cy="54" r="1.6" fill="#7fae5c" />
      {/* Tree */}
      <circle cx="22" cy="20" r="11" fill="#6f9f58" />
      <circle cx="17" cy="16" r="6" fill="#86b46a" />
      <circle cx="27" cy="23" r="5" fill="#5c8a48" />
      {/* Flower beds */}
      {[
        [8, 50],
        [12, 56],
        [86, 14],
        [92, 20],
        [62, 12],
        [36, 58],
      ].map(([x, y], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r="3.2" fill="#7aa356" />
          <circle cx={x - 1} cy={y - 1} r="1" fill={CONFETTI[index % CONFETTI.length]} />
          <circle cx={x + 1.2} cy={y + 0.6} r="0.9" fill="#fff6c9" />
        </g>
      ))}
      {/* Picnic blanket and party table */}
      <rect x="34" y="34" width="14" height="10" rx="1" fill="url(#gingham)" transform="rotate(-8 41 39)" />
      <rect x="62" y="24" width="18" height="6" rx="1" fill="#fff8e7" stroke="#d9c49a" strokeWidth="0.5" />
      <circle cx="66" cy="26" r="1.2" fill="#f19cbb" />
      <circle cx="71" cy="26.5" r="1.6" fill="#f4b942" />
      <circle cx="76" cy="26" r="1.1" fill="#e2574c" />
      <path d="M 58 20 Q 71 26 84 20" fill="none" stroke="#3d2a24" strokeWidth="0.3" />
      {[60, 64, 68, 72, 76, 80].map((x, index) => (
        <path key={x} d={`M ${x} ${21 + Math.sin(index) * 0.6} l 1.4 3 l 1.4 -3 z`} fill={CONFETTI[index % CONFETTI.length]} />
      ))}
      {/* Shed */}
      <rect x="86" y="58" width="12" height="12" fill="#c98f5e" />
      <path d="M 84.5 58.5 L 92 52 L 99.5 58.5 Z" fill="#9b5f3a" />
      <rect x="90" y="63" width="4" height="7" fill="#7a4a2c" />
      {/* Compass */}
      <g transform="translate(8 8)" opacity="0.7">
        <circle r="4.2" fill="#fff8e7" stroke="#3d2a24" strokeWidth="0.3" />
        <path d="M 0 -3.4 L 1 0 L 0 3.4 L -1 0 Z" fill="#e2574c" />
        <text y="-4.8" fontSize="2.2" textAnchor="middle" fill="#3d2a24">N</text>
      </g>
    </>
  );
}

export function TreasureDigGame({ clues, finale }: { clues: string[]; finale: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const total = Math.max(1, Math.min(6, clues.length || 5));
  const [treasures, setTreasures] = useState<Spot[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [digs, setDigs] = useState<Dig[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    setTreasures(placeTreasures(total));
    setFound([]);
    setDigs([]);
  }, [total]);

  const complete = treasures.length > 0 && found.length >= treasures.length;

  const dig = (event: React.PointerEvent<SVGSVGElement>) => {
    if (complete) return;
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());

    let nearest = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    treasures.forEach((spot, index) => {
      if (found.includes(index)) return;
      const distance = Math.hypot(point.x - spot.x, point.y - spot.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    if (nearest < 0) return;

    const id = nextId.current++;
    if (nearestDistance < FIND_RADIUS) {
      const nextFound = [...found, nearest];
      setFound(nextFound);
      setDigs((current) => [...current, { id, x: treasures[nearest].x, y: treasures[nearest].y, word: "found it!", color: "#3d2a24", found: true }]);
      if (nextFound.length >= treasures.length) {
        sfx.chime([523.25, 659.25, 783.99, 1046.5, 1318.5]);
      } else {
        sfx.chime([783.99, 1046.5]);
      }
      return;
    }

    const hint = feedback(nearestDistance);
    sfx.thud();
    setDigs((current) => [
      ...current.filter((entry) => entry.found),
      ...current.filter((entry) => !entry.found).slice(-24),
      { id, x: point.x, y: point.y, ...hint, found: false },
    ]);
  };

  const replay = () => {
    setTreasures(placeTreasures(total));
    setFound([]);
    setDigs([]);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-full rotate-[-0.6deg] rounded-[18px] bg-[#f3e6c4] p-3 shadow-[0_18px_40px_rgba(70,50,20,0.25)] md:p-4">
        <div className="pointer-events-none absolute inset-0 rounded-[18px] paper-texture" />
        <svg
          ref={svgRef}
          viewBox="0 0 100 75"
          className="relative block w-full cursor-crosshair touch-manipulation select-none overflow-hidden rounded-[10px]"
          onPointerDown={dig}
          role="img"
          aria-label="A map of the garden. Tap to dig for treasure."
        >
          <GardenMap />
          {digs.map((entry) =>
            entry.found ? (
              <g key={entry.id} className="animate-pop-in" style={{ transformOrigin: `${entry.x}px ${entry.y}px` }}>
                <ellipse cx={entry.x} cy={entry.y + 2.4} rx="4.6" ry="1.6" fill="#7a5532" opacity="0.6" />
                <rect x={entry.x - 3.4} y={entry.y - 2.2} width="6.8" height="4.6" rx="0.8" fill="#b9783f" stroke="#6b3f1d" strokeWidth="0.4" />
                <path d={`M ${entry.x - 3.4} ${entry.y - 1.4} q 3.4 -3.4 6.8 0`} fill="#d18f4f" stroke="#6b3f1d" strokeWidth="0.4" />
                <rect x={entry.x - 0.6} y={entry.y - 1} width="1.2" height="1.6" fill="#f4b942" />
              </g>
            ) : (
              <g key={entry.id}>
                <ellipse cx={entry.x} cy={entry.y} rx="1.8" ry="1" fill="#6b4a2b" opacity="0.75" />
                <circle
                  cx={entry.x}
                  cy={entry.y}
                  r="7"
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="0.4"
                  style={{ animation: "digRing 0.9s ease-out both", transformBox: "fill-box", transformOrigin: "center" }}
                />
                <text
                  x={entry.x}
                  y={entry.y - 2.6}
                  textAnchor="middle"
                  fontSize="3.4"
                  fill={entry.color}
                  stroke="#fff8e7"
                  strokeWidth="0.6"
                  paintOrder="stroke"
                  style={{ fontFamily: "var(--font-caveat), cursive", animation: "digWord 2.4s ease-out both" }}
                >
                  {entry.word}
                </text>
              </g>
            ),
          )}
        </svg>
        <div className="mt-3 flex items-center justify-between px-1 font-hand text-xl text-[#5b4326]">
          <span>
            treasures found: {found.length} / {treasures.length || total}
          </span>
          {digs.length ? (
            <span style={{ color: digs[digs.length - 1].color }}>{digs[digs.length - 1].word}</span>
          ) : (
            <span>tap to dig</span>
          )}
        </div>
      </div>

      <ol className="grid w-full gap-4 sm:grid-cols-2">
        {found.map((_, index) => (
          <li
            key={index}
            className="animate-pop-in relative rounded-[6px] bg-[#fffaf0] px-5 pb-5 pt-7 shadow-[0_8px_20px_rgba(70,50,20,0.15)]"
            style={{ rotate: `${index % 2 === 0 ? -1.2 : 1}deg` }}
          >
            <span className="absolute -top-3 left-5 rounded-full bg-[#e2574c] px-3 py-0.5 font-hand text-lg text-white shadow">clue {index + 1}</span>
            <p className="font-hand text-2xl leading-snug text-[#3d2a24]">{clues[index] ?? "A treasure, all on its own."}</p>
          </li>
        ))}
      </ol>

      {complete ? (
        <>
          <div className="relative w-full max-w-xl animate-pop-in rounded-[24px] border-4 border-dashed border-[#e2574c]/40 bg-[#fffaf0] px-6 py-8 text-center shadow-xl">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-[#e2574c]">the final chest</p>
            <p className="mt-3 font-hand text-3xl leading-snug text-[#3d2a24]">{finale}</p>
            <button type="button" onClick={replay} className="mt-5 font-hand text-xl text-[#5a8a3a] underline-offset-4 hover:underline">
              bury them again
            </button>
          </div>
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden" aria-hidden="true">
            {Array.from({ length: 40 }, (_, index) => (
              <span
                key={index}
                className="absolute top-0 block h-3 w-2 rounded-sm"
                style={{
                  left: `${(index * 37) % 100}%`,
                  background: CONFETTI[index % CONFETTI.length],
                  animation: `confettiFall ${2.6 + (index % 5) * 0.4}s ease-in ${(index % 8) * 0.12}s both`,
                  ["--drift" as string]: `${((index * 53) % 120) - 60}px`,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-center font-hand text-2xl text-[#5b4326]">Tap the map to dig. The garden will tell you if you&apos;re getting warmer.</p>
      )}
    </div>
  );
}
