import Link from "next/link";
import { LockDoorButton } from "@/components/home/LockDoorButton";
import { memoryHref } from "@/components/memories/shared";
import { daysSince, formatMemoryDate, formatShortDate } from "@/lib/memories/format";
import { TEMPLATES, cardStyleFor } from "@/lib/memories/templates";
import type { HomeSettings, MemoryRecord, TemplateId } from "@/lib/memories/types";

function CardMotif({ template, accent }: { template: TemplateId; accent: string }) {
  const stroke = { fill: "none", stroke: accent, strokeWidth: 2, strokeLinecap: "round" as const };
  switch (template) {
    case "four-gifts":
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <path d="M78 20 a34 34 0 1 0 22 58 a27 27 0 1 1 -22 -58 z" fill={accent} opacity="0.9" />
          {[
            [30, 30],
            [20, 70],
            [48, 96],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill={accent} />
          ))}
        </svg>
      );
    case "night-drive":
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          {[
            [24, 22],
            [56, 14],
            [92, 30],
            [40, 50],
            [78, 56],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r={index % 2 ? 1.6 : 2.4} fill={accent} />
          ))}
          <path d="M24 22 L56 14 L92 30 L78 56 L40 50 Z" {...stroke} strokeWidth="0.8" opacity="0.6" />
          <path d="M0 92 q15 -10 30 0 t30 0 t30 0 t30 0" {...stroke} />
          <path d="M0 106 q15 -10 30 0 t30 0 t30 0 t30 0" {...stroke} opacity="0.5" />
        </svg>
      );
    case "treasure-hunt":
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <path d="M0 14 Q60 44 120 14" fill="none" stroke="#5b4326" strokeWidth="1.2" />
          {[8, 30, 52, 74, 96].map((x, index) => {
            const t = (x + 8) / 120;
            const y = 14 + 4 * t * (1 - t) * 30;
            return <path key={x} d={`M${x} ${y} l16 0 l-8 18 z`} fill={["#e2574c", "#f4b942", "#5a8a3a", "#f19cbb", "#6fb0c8"][index]} />;
          })}
          <g transform="translate(60 84)">
            <path d="M-20 -6 q20 -16 40 0 v22 h-40 z" fill="#b9783f" stroke="#6b3f1d" strokeWidth="2" />
            <path d="M-20 -1 h40" stroke="#6b3f1d" strokeWidth="2" />
            <rect x="-4" y="-3" width="8" height="8" fill="#f4b942" />
          </g>
        </svg>
      );
    case "golden-hour":
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <circle cx="60" cy="74" r="26" fill={accent} opacity="0.95" />
          <path d="M-4 120 C 20 80 50 76 64 80 C 80 84 100 96 124 120 Z" fill="#3b1610" opacity="0.85" />
          <path d="M14 98 v-10 M22 96 v-14 M96 104 v-12 M104 108 v-10" stroke="#3b1610" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "spain":
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          {[0, 1].map((row) =>
            [0, 1].map((col) => (
              <g key={`${row}-${col}`} transform={`translate(${30 + col * 34} ${44 + row * 34})`}>
                <rect width="32" height="32" fill="#fbf7ee" stroke={accent} strokeWidth="1.5" />
                <circle cx={col ? 0 : 32} cy={row ? 0 : 32} r="14" fill="none" stroke={accent} strokeWidth="2" />
                <circle cx={col ? 0 : 32} cy={row ? 0 : 32} r="6" fill="#f2b632" />
              </g>
            )),
          )}
          <path d="M14 26 l28 -10 l-5 5 l-3 14 l-5 -7 l-7 3 l2 -5 z" fill={accent} />
        </svg>
      );
    case "six-months":
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <text x="60" y="100" textAnchor="middle" fontSize="110" fill={accent} opacity="0.9" style={{ fontFamily: "var(--font-fraunces), serif", fontStyle: "italic", fontWeight: 600 }}>
            6
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <path d="M60 18 l8 26 l26 8 l-26 8 l-8 26 l-8 -26 l-26 -8 l26 -8 z" fill={accent} opacity="0.85" />
          <path d="M96 78 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z" fill={accent} opacity="0.6" />
        </svg>
      );
  }
}

const readableOn = (hex: string) => {
  const [r, g, b] = (hex.replace("#", "").match(/\w\w/g) ?? ["00", "00", "00"]).map((part) => parseInt(part, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? "#1a1020" : "#ffffff";
};

function MemoryCard({ memory, index }: { memory: MemoryRecord; index: number }) {
  const card = cardStyleFor(memory.template, memory.palette);
  const meta = TEMPLATES[memory.template];
  const tilt = [-1.2, 0.9, -0.6, 1.3, -1, 0.7][index % 6];

  return (
    <Link
      href={memoryHref(memory.slug)}
      className="group relative block rotate-(--tilt) overflow-hidden rounded-[28px] p-6 shadow-[0_18px_40px_rgba(74,52,40,0.18)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_26px_60px_rgba(74,52,40,0.28)] md:p-8"
      style={{ background: card.background, color: card.ink, ["--tilt" as string]: `${tilt}deg` }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 opacity-90 transition duration-500 group-hover:scale-110 md:h-40 md:w-40">
        <CardMotif template={memory.template} accent={card.accent} />
      </div>
      <p className="relative font-sans text-xs font-semibold uppercase tracking-[0.3em] opacity-70">{formatShortDate(memory.startDate)}</p>
      <h2 className="relative mt-16 max-w-[85%] font-display text-3xl font-semibold leading-[1.05] tracking-tight md:mt-20 md:text-4xl">{memory.title}</h2>
      {memory.subtitle ? <p className="relative mt-2 max-w-[90%] font-hand text-2xl leading-tight opacity-85">{memory.subtitle}</p> : null}
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
        <span className="opacity-70">{formatMemoryDate(memory.startDate, memory.endDate)}</span>
        <span className="rounded-full px-3 py-1 font-semibold" style={{ background: card.accent, color: readableOn(card.accent) }}>
          play · {meta.gameName}
        </span>
      </div>
    </Link>
  );
}

export function HomeCollection({ home, memories }: { home: HomeSettings; memories: MemoryRecord[] }) {
  const visible = memories.filter((memory) => !memory.hidden);
  const days = daysSince(home.togetherSince);

  return (
    <main className="paper-texture relative min-h-screen overflow-hidden bg-[#f6efe4] text-[#4a3428]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#f3c6c0] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-[30rem] h-[34rem] w-[34rem] rounded-full bg-[#c9dcc0] opacity-40 blur-3xl" />

      <header className="relative mx-auto max-w-5xl px-6 pb-14 pt-[max(3.5rem,env(safe-area-inset-top))] text-center md:pb-20 md:pt-24">
        <p className="font-sans text-xs uppercase tracking-[0.5em] text-[#b0675a]">Aanavee &amp; me</p>
        <h1 className="mt-5 font-display text-6xl font-semibold leading-[0.95] tracking-tight md:text-8xl">{home.title}</h1>
        {home.subtitle ? <p className="mx-auto mt-5 max-w-xl font-hand text-3xl leading-tight text-[#4a3428]/80">{home.subtitle}</p> : null}
        {days !== null ? (
          <div className="mx-auto mt-10 inline-flex items-baseline gap-3 rounded-full border border-[#4a3428]/15 bg-white/50 px-6 py-3 backdrop-blur">
            <span className="font-display text-3xl font-semibold tabular-nums text-[#b0675a]">{days.toLocaleString("en-GB")}</span>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#4a3428]/70">days of us</span>
          </div>
        ) : null}
      </header>

      <section className="relative mx-auto max-w-5xl px-5 pb-24">
        <div className="pointer-events-none absolute bottom-24 left-1/2 top-0 hidden w-px -translate-x-1/2 border-l-2 border-dotted border-[#4a3428]/20 md:block" />
        <ol className="relative grid gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-4">
          {visible.map((memory, index) => (
            <li key={memory.slug} className={`relative ${index % 2 === 1 ? "md:mt-40" : ""}`}>
              <MemoryCard memory={memory} index={index} />
            </li>
          ))}
          <li className={`relative ${visible.length % 2 === 1 ? "md:mt-40" : ""}`}>
            <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#4a3428]/25 px-6 py-10 text-center">
              <p className="font-hand text-4xl text-[#4a3428]/70">to be continued…</p>
              <p className="mt-2 font-sans text-xs uppercase tracking-[0.3em] text-[#4a3428]/45">{home.footer}</p>
            </div>
          </li>
        </ol>
      </section>

      <footer className="relative pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center">
        <LockDoorButton />
      </footer>
    </main>
  );
}
