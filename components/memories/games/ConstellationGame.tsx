"use client";

import { useMemo, useRef, useState } from "react";
import { seeded } from "@/components/memories/shared";
import { sfx } from "@/lib/sfx";

interface Constellation {
  name: string;
  stars: [number, number][];
  edges: [number, number][];
}

const loop = (count: number): [number, number][] =>
  Array.from({ length: count }, (_, index) => [index, (index + 1) % count] as [number, number]);
const chain = (count: number): [number, number][] =>
  Array.from({ length: count - 1 }, (_, index) => [index, index + 1] as [number, number]);

const CONSTELLATIONS: Constellation[] = [
  {
    name: "The Little Car",
    stars: [[8, 50], [8, 43], [15, 41], [20, 34], [31, 34], [36, 41], [44, 43], [44, 50]],
    edges: loop(8),
  },
  {
    name: "The Wave",
    stars: [[36, 30], [43, 24], [50, 19], [57, 18], [63, 21], [62, 27], [57, 28], [55, 23]],
    edges: chain(8),
  },
  {
    name: "Us",
    stars: [[80, 62], [70, 52], [67, 44], [71, 38], [77, 39], [80, 44], [83, 39], [89, 38], [93, 44], [90, 52]],
    edges: loop(10),
  },
];

const HIT_RADIUS = 5.5;
const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function ConstellationGame({ notes, finale }: { notes: string[]; finale: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState(0);
  const [drawn, setDrawn] = useState<Set<string>[]>(() => CONSTELLATIONS.map(() => new Set()));
  const [current, setCurrent] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const backgroundStars = useMemo(() => {
    const random = seeded(511);
    return Array.from({ length: 90 }, () => ({
      x: random() * 100,
      y: random() * 70,
      r: 0.12 + random() * 0.32,
      delay: random() * 5,
    }));
  }, []);

  const finished = active >= CONSTELLATIONS.length;

  const toLocal = (event: React.PointerEvent) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) {
      return null;
    }
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  };

  const starAt = (point: { x: number; y: number }) => {
    if (finished) return null;
    const stars = CONSTELLATIONS[active].stars;
    let best: number | null = null;
    let bestDistance = HIT_RADIUS;
    stars.forEach(([x, y], index) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  const connect = (from: number, to: number) => {
    const constellation = CONSTELLATIONS[active];
    const key = edgeKey(from, to);
    const isEdge = constellation.edges.some(([a, b]) => edgeKey(a, b) === key);
    if (!isEdge || drawn[active].has(key)) {
      return false;
    }
    const nextDrawn = drawn.map((set, index) => (index === active ? new Set(set).add(key) : set));
    setDrawn(nextDrawn);
    sfx.sparkle();
    if (nextDrawn[active].size === constellation.edges.length) {
      sfx.chime();
      setCurrent(null);
      setDragging(false);
      setActive((value) => value + 1);
    }
    return true;
  };

  const handleDown = (event: React.PointerEvent) => {
    const point = toLocal(event);
    if (!point) return;
    const star = starAt(point);
    if (star === null) {
      setCurrent(null);
      return;
    }
    (event.target as Element).setPointerCapture?.(event.pointerId);
    if (current !== null && current !== star && connect(current, star)) {
      setCurrent(star);
    } else {
      setCurrent(star);
    }
    setDragging(true);
    setPointer(point);
  };

  const handleMove = (event: React.PointerEvent) => {
    if (!dragging || current === null) return;
    const point = toLocal(event);
    if (!point) return;
    setPointer(point);
    const star = starAt(point);
    if (star !== null && star !== current && connect(current, star)) {
      setCurrent(star);
    }
  };

  const handleUp = () => {
    setDragging(false);
    setPointer(null);
  };

  const reset = () => {
    setActive(0);
    setDrawn(CONSTELLATIONS.map(() => new Set()));
    setCurrent(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_at_top,#14244a_0%,#070b1c_70%)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <svg
          ref={svgRef}
          viewBox="0 0 100 70"
          className="block w-full touch-none select-none"
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          role="img"
          aria-label="A night sky. Join the bright stars to draw each constellation."
        >
          {backgroundStars.map((star, index) => (
            <circle
              key={index}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="#dfe8ff"
              style={{ animation: `twinkle ${3 + (index % 4)}s ease-in-out ${star.delay}s infinite` }}
            />
          ))}

          {CONSTELLATIONS.map((constellation, index) => {
            const isActive = index === active;
            const isDone = index < active;
            const [labelX, labelY] = constellation.stars.reduce(
              ([sx, sy], [x, y]) => [sx + x / constellation.stars.length, sy + y / constellation.stars.length],
              [0, 0],
            );
            return (
              <g key={constellation.name} opacity={isActive || isDone ? 1 : 0.25}>
                {constellation.edges.map(([a, b]) => {
                  const key = edgeKey(a, b);
                  const [x1, y1] = constellation.stars[a];
                  const [x2, y2] = constellation.stars[b];
                  return drawn[index].has(key) ? (
                    <line
                      key={key}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isDone ? "#ffe9a8" : "#9fd3ff"}
                      strokeWidth={isDone ? 0.45 : 0.35}
                      strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 0.8px #9fd3ff)" }}
                    />
                  ) : null;
                })}
                {constellation.stars.map(([x, y], starIndex) => (
                  <g key={starIndex}>
                    {isActive ? (
                      <circle cx={x} cy={y} r={2.2} fill="#9fd3ff" opacity={0.12} style={{ animation: `twinkle 2.4s ease-in-out ${starIndex * 0.2}s infinite` }} />
                    ) : null}
                    <circle
                      cx={x}
                      cy={y}
                      r={current === starIndex && isActive ? 1.15 : 0.8}
                      fill={isDone ? "#ffe9a8" : "#ffffff"}
                      style={{ filter: "drop-shadow(0 0 1px #cfe6ff)" }}
                    />
                  </g>
                ))}
                {isDone ? (
                  <text x={labelX} y={labelY + 12} textAnchor="middle" fontSize="2.6" fill="#ffe9a8" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic" }}>
                    {constellation.name}
                  </text>
                ) : null}
              </g>
            );
          })}

          {dragging && current !== null && pointer && !finished ? (
            <line
              x1={CONSTELLATIONS[active].stars[current][0]}
              y1={CONSTELLATIONS[active].stars[current][1]}
              x2={pointer.x}
              y2={pointer.y}
              stroke="#9fd3ff"
              strokeOpacity="0.5"
              strokeWidth="0.3"
              strokeDasharray="1 1"
            />
          ) : null}
        </svg>

        {finished ? (
          <span className="pointer-events-none absolute right-[10%] top-[12%] block h-px w-32 origin-right bg-gradient-to-l from-white to-transparent motion-reduce:hidden" style={{ animation: "shootingStar 3.5s ease-out infinite" }} />
        ) : null}
      </div>

      <div className="min-h-[5rem] w-full max-w-xl text-center">
        {finished ? (
          <p className="animate-fade-up font-poem text-2xl italic text-[#ffe9a8] md:text-3xl">{finale}</p>
        ) : (
          <p className="font-lcd text-lg uppercase tracking-widest text-[#9fd3ff]/80">
            {active + 1} / {CONSTELLATIONS.length} · join the bright stars{active === 0 ? ". Drag, or tap one star then the next." : ""}
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {CONSTELLATIONS.slice(0, active).map((constellation, index) => (
            <li key={constellation.name} className="animate-fade-up font-poem text-lg italic text-[#e8eeff]/85 md:text-xl">
              <span className="mr-2 not-italic text-[#ffe9a8]">✦</span>
              {notes[index] ?? constellation.name}
            </li>
          ))}
        </ul>
        {finished ? (
          <button type="button" onClick={reset} className="mt-6 font-lcd text-base uppercase tracking-widest text-[#9fd3ff]/70 hover:text-[#9fd3ff]">
            draw them again
          </button>
        ) : null}
      </div>
    </div>
  );
}
