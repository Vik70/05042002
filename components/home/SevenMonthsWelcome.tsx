"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { seeded } from "@/components/memories/shared";
import { Candle, CandleRow } from "@/components/together/Candles";
import { SmoothRoad } from "@/components/together/SmoothRoad";
import type { MonthWindow } from "@/lib/memories/months";
import { sfx } from "@/lib/sfx";

export const WELCOME_COOKIE = "seven_months_welcomed";

type Scene = "open" | "seven" | "road" | "candles" | "smile";

const ORDER: Scene[] = ["open", "seven", "road", "candles", "smile"];
const DURATIONS: Partial<Record<Scene, number>> = { seven: 5600, road: 10_500, candles: 8_600 };
const CANDLE_NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77];
const CANDLE_GAP_MS = 750;

const nextScene = (current: Scene): Scene => ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(current) + 1)];

function Stars() {
  const random = seeded(711);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 46 }, (_, index) => {
        const size = 1 + random() * 2;
        return (
          <span
            key={index}
            className="absolute rounded-full bg-[#fff1e6] [animation:twinkle_4s_ease-in-out_infinite]"
            style={{
              left: `${random() * 100}%`,
              top: `${random() * 100}%`,
              width: size,
              height: size,
              animationDelay: `${-random() * 4}s`,
              ["--twinkle-low" as string]: 0.15,
            }}
          />
        );
      })}
    </div>
  );
}

const Line = ({ children, delay, className = "" }: { children: ReactNode; delay: number; className?: string }) => (
  <p className={`animate-fade-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </p>
);

export function SevenMonthsWelcome({ months, days, range }: { months: MonthWindow[]; days: number | null; range: string }) {
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [scene, setScene] = useState<Scene>("open");
  const [lit, setLit] = useState(0);
  const [roadStarted, setRoadStarted] = useState(false);

  const advance = () => setScene(nextScene);

  useEffect(() => {
    const duration = DURATIONS[scene];
    if (!duration) return;
    const timer = window.setTimeout(() => setScene(nextScene), duration);
    return () => window.clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    if (scene === "road") {
      setRoadStarted(false);
      const timer = window.setTimeout(() => setRoadStarted(true), 1800);
      return () => window.clearTimeout(timer);
    }
    if (scene === "candles") {
      setLit(0);
      const timers = CANDLE_NOTES.map((note, index) =>
        window.setTimeout(() => {
          setLit(index + 1);
          sfx.chime([note]);
          navigator.vibrate?.(8);
        }, 500 + index * CANDLE_GAP_MS),
      );
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }
    if (scene === "smile") setLit(7);
  }, [scene]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const remember = () => {
    document.cookie = `${WELCOME_COOKIE}=1; path=/; samesite=lax`;
  };

  const enterMuseum = () => {
    remember();
    sfx.pop();
    setLeaving(true);
    window.setTimeout(() => setOpen(false), 800);
  };

  if (!open) return null;

  const month = lit > 0 ? months[lit - 1] : null;
  const caption = month
    ? month.memories.length
      ? month.memories.map((memory) => (memory.slug === "seven-months" ? "Tonight" : memory.title)).join(" & ")
      : "The in-between days"
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Happy seven months"
      onClick={() => {
        if (scene === "open") {
          sfx.chime([392, 523.25, 659.25, 783.99]);
          advance();
        } else if (scene !== "smile") {
          advance();
        }
      }}
      className={`fixed inset-0 z-[60] flex select-none flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_10%,#4a1a34_0%,#2a0f22_45%,#12070e_100%)] text-[#fff1e6] transition-opacity duration-700 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <Stars />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,180,107,0.18),transparent_65%)]" />

      {scene !== "open" && scene !== "smile" ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setScene("smile");
          }}
          className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-10 font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/40 hover:text-[#fff1e6]/80"
        >
          skip
        </button>
      ) : null}

      <div key={scene} className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-7 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] text-center">
        {scene === "open" ? (
          <>
            <div className="animate-fade-up">
              <Candle lit size="lg" />
            </div>
            <Line delay={600} className="mt-10 font-hand text-4xl text-[#ffcf8a]">
              For Aanavee,
            </Line>
            <Line delay={1300} className="mt-2 font-display text-2xl italic text-[#fff1e6]/85">
              there&apos;s something I want to show you.
            </Line>
            <Line delay={2400} className="mt-14 font-sans text-xs uppercase tracking-[0.45em] text-[#fff1e6]/50">
              <span className="inline-block [animation:twinkle_2s_ease-in-out_infinite]">tap anywhere</span>
            </Line>
          </>
        ) : null}

        {scene === "seven" ? (
          <>
            <Line delay={0} className="font-sans text-xs uppercase tracking-[0.5em] text-[#ffcf8a]/80">
              {range}
            </Line>
            <p className="mt-2 bg-[linear-gradient(180deg,#fff6e0,#ffcf8a_55%,#ff9fb5)] bg-clip-text font-display text-[12rem] font-semibold italic leading-none text-transparent drop-shadow-[0_10px_50px_rgba(255,190,110,0.35)] [animation:sevenIn_1.6s_cubic-bezier(0.2,0.8,0.2,1)_both] sm:text-[15rem]">
              7
            </p>
            <Line delay={1100} className="-mt-3 font-display text-5xl italic">
              Seven months.
            </Line>
            {days !== null ? (
              <Line delay={2200} className="mt-5 font-sans text-sm uppercase tracking-[0.35em] text-[#fff1e6]/60">
                {days.toLocaleString("en-GB")} days of us
              </Line>
            ) : null}
          </>
        ) : null}

        {scene === "road" ? (
          <>
            <Line delay={0} className="font-display text-4xl italic leading-tight">
              We did it backwards.
            </Line>
            <Line delay={1000} className="mt-3 font-sans text-[15px] text-[#fff1e6]/65">
              Most people start smooth and hit the bumps later. We got the bumps out of the way first.
            </Line>
            <SmoothRoad start={roadStarted} duration={6200} className="mt-10 h-40 w-full" />
            <Line delay={6400} className="mt-8 font-hand text-[2rem] leading-tight text-[#ffcf8a]">
              And every month since, the road&apos;s got a little smoother.
            </Line>
          </>
        ) : null}

        {scene === "candles" || scene === "smile" ? (
          <CandleRow
            lit={lit}
            size="lg"
            className={scene === "smile" ? "animate-fade-up scale-75" : ""}
            labels={months.map((entry, index) => (
              <span key={entry.number} className={`font-display text-lg italic transition ${index < lit ? "text-[#ffcf8a]" : "text-[#fff1e6]/25"}`}>
                {entry.number}
              </span>
            ))}
          />
        ) : null}

        {scene === "candles" ? (
          <>
            <div className="mt-10 min-h-[6rem]">
              {month ? (
                <div key={month.number} className="animate-fade-up">
                  <p className="font-sans text-[11px] uppercase tracking-[0.45em] text-[#ffcf8a]/75">
                    month {month.number} · {month.label}
                  </p>
                  <p className="mt-2 font-display text-3xl italic leading-tight">{caption}</p>
                </div>
              ) : (
                <p className="font-display text-2xl italic text-[#fff1e6]/70">One candle for every month…</p>
              )}
            </div>
            {lit >= 7 ? (
              <Line delay={600} className="mt-4 font-hand text-3xl text-[#ff9fb5]">
                Every one of them lit. Even the quiet ones.
              </Line>
            ) : null}
          </>
        ) : null}

        {scene === "smile" ? (
          <>
            <Line delay={200} className="mt-8 font-display text-5xl italic leading-[1.05]">
              Keep smiling.
            </Line>
            <Line delay={900} className="mt-3 font-display text-2xl italic text-[#fff1e6]/80">
              Stay soft with each other.
            </Line>
            <Line delay={1600} className="mt-4 font-hand text-3xl text-[#ffcf8a]">
              Tonight is just for us. Happy seven months ♥
            </Line>

            <div className="mt-10 flex w-full max-w-sm animate-fade-up flex-col gap-3" style={{ animationDelay: "2300ms" }}>
              <Link
                href="/together"
                onClick={(event) => {
                  event.stopPropagation();
                  remember();
                }}
                className="rounded-full bg-[linear-gradient(180deg,#ffdca0,#ffb46b)] px-6 py-4 font-display text-xl font-semibold italic text-[#3a1424] shadow-[0_12px_30px_rgba(255,170,90,0.3)] transition active:scale-[0.98]"
              >
                Play Seven Sparks together
                <span className="block font-sans text-[11px] font-normal not-italic uppercase tracking-[0.25em] text-[#3a1424]/60">
                  two phones · one dinner table
                </span>
              </Link>
              <Link
                href="/memories/seven-months"
                onClick={(event) => {
                  event.stopPropagation();
                  remember();
                }}
                className="rounded-full border border-[#ffcf8a]/50 px-6 py-3.5 font-display text-lg italic text-[#ffcf8a] transition active:scale-[0.98]"
              >
                Open your seven months page
              </Link>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  enterMuseum();
                }}
                className="mt-2 font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/45 underline underline-offset-4 hover:text-[#fff1e6]/80"
              >
                into our little museum
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
