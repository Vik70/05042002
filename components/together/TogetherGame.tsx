"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CandleRow } from "@/components/together/Candles";
import type { StepContext } from "@/components/together/parts";
import { ChooseStep } from "@/components/together/steps/ChooseStep";
import { DeckStep } from "@/components/together/steps/DeckStep";
import { FinaleStep } from "@/components/together/steps/FinaleStep";
import { GuessStep } from "@/components/together/steps/GuessStep";
import { HoldStep } from "@/components/together/steps/HoldStep";
import { LobbyStep } from "@/components/together/steps/LobbyStep";
import { PickStep } from "@/components/together/steps/PickStep";
import { PortraitStep } from "@/components/together/steps/PortraitStep";
import { WishStep } from "@/components/together/steps/WishStep";
import { WriteStep } from "@/components/together/steps/WriteStep";
import { useTogether } from "@/components/together/useTogether";
import { PLAYER_NAMES, REACTIONS, SPARK_COUNT, STEPS, otherSeat } from "@/lib/together/content";
import { freshDoc, inRound, isOnline, isSeat, sanitizeDoc } from "@/lib/together/logic";
import { sfx } from "@/lib/sfx";
import { SEATS, type Seat } from "@/lib/together/types";

const SEAT_KEY = "together:seat";

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#4a1a34_0%,#2a0f22_45%,#140810_100%)]" />
      <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#ffb46b]/20 blur-3xl" />
      {[
        { left: "8%", top: "22%", size: 90, delay: 0 },
        { left: "78%", top: "14%", size: 70, delay: 1.5 },
        { left: "64%", top: "58%", size: 120, delay: 3 },
        { left: "14%", top: "72%", size: 80, delay: 2.2 },
        { left: "88%", top: "84%", size: 60, delay: 0.8 },
      ].map((light, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-[#ffcf8a]/12 blur-2xl [animation:twinkle_6s_ease-in-out_infinite]"
          style={{ left: light.left, top: light.top, width: light.size, height: light.size, animationDelay: `${light.delay}s`, ["--twinkle-low" as string]: 0.3 }}
        />
      ))}
    </div>
  );
}

export function TogetherGame() {
  const [mounted, setMounted] = useState(false);
  const [seat, setSeat] = useState<Seat | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SEAT_KEY);
    setSeat(isSeat(stored) ? stored : null);
    setMounted(true);
  }, []);

  const choose = (next: Seat | null) => {
    if (next) window.localStorage.setItem(SEAT_KEY, next);
    else window.localStorage.removeItem(SEAT_KEY);
    setSeat(next);
  };

  return (
    <main className="relative min-h-[100svh] text-[#fff1e6]">
      <Backdrop />
      {!mounted ? null : seat ? <Table key={seat} seat={seat} onSwitch={() => choose(null)} /> : <SeatPicker onPick={choose} />}
    </main>
  );
}

function SeatPicker({ onPick }: { onPick: (seat: Seat) => void }) {
  const [online, setOnline] = useState<Record<Seat, boolean>>({ vik: false, aanavee: false });

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      try {
        const response = await fetch("/api/together", { cache: "no-store" });
        const body = (await response.json()) as { seats?: Record<Seat, unknown>; now?: number };
        if (!stopped && body.seats) {
          const now = body.now ?? Date.now();
          setOnline({ vik: isOnline(sanitizeDoc(body.seats.vik), now), aanavee: isOnline(sanitizeDoc(body.seats.aanavee), now) });
        }
      } catch {
        // The picker still works without presence.
      }
    };
    void check();
    const timer = window.setInterval(check, 3000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <Link href="/" className="absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] font-hand text-2xl text-[#fff1e6]/60">
        ← Us, so far
      </Link>
      <div className="text-center">
        <CandleRow lit={0} size="sm" showNext />
        <h1 className="mt-8 font-display text-5xl font-semibold italic leading-none">Who&apos;s holding this phone?</h1>
        <p className="mt-4 font-sans text-[15px] text-[#fff1e6]/65">Each of you opens this page on your own phone and picks yourself.</p>
      </div>
      <div className="mt-10 grid gap-4">
        {SEATS.map((seat) => (
          <button
            key={seat}
            type="button"
            onClick={() => {
              sfx.pop();
              onPick(seat);
            }}
            className={`group flex items-center justify-between rounded-[26px] border px-6 py-6 text-left transition active:scale-[0.98] ${
              seat === "aanavee" ? "border-[#ff9fb5]/40 bg-[#ff9fb5]/10" : "border-[#ffcf8a]/40 bg-[#ffcf8a]/10"
            }`}
          >
            <span>
              <span className="block font-display text-4xl font-semibold italic">{PLAYER_NAMES[seat]}</span>
              <span className="mt-1 block font-sans text-xs uppercase tracking-[0.25em] text-[#fff1e6]/50">
                {online[seat] ? "already at the table on another phone" : "tap if this is you"}
              </span>
            </span>
            <span className={`font-display text-3xl ${seat === "aanavee" ? "text-[#ff9fb5]" : "text-[#ffcf8a]"}`}>{online[seat] ? "●" : "→"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Floating {
  key: number;
  emoji: string;
  mine: boolean;
  x: number;
}

function Table({ seat, onSwitch }: { seat: Seat; onSwitch: () => void }) {
  const { me, partner: partnerRaw, partnerOnline, loaded, shared, error, update } = useTogether(seat);
  const partnerSeat = otherSeat(seat);
  const round = Math.max(me.round, partnerRaw?.round ?? 0);
  const partner = inRound(partnerRaw, round);
  const current = partnerRaw ? Math.min(me.at, partner.at) : 0;
  const step = STEPS[current];
  const [menuOpen, setMenuOpen] = useState(false);
  const [floating, setFloating] = useState<Floating[]>([]);
  const lastReaction = useRef<number | null>(null);

  const float = useCallback((emoji: string, mine: boolean) => {
    const key = Date.now() + Math.random();
    setFloating((list) => [...list.slice(-14), { key, emoji, mine, x: mine ? 62 + Math.random() * 26 : 8 + Math.random() * 50 }]);
    window.setTimeout(() => setFloating((list) => list.filter((item) => item.key !== key)), 2800);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const reactions = partnerRaw?.reactions ?? [];
    const newest = reactions.reduce((max, item) => Math.max(max, item.id), 0);
    if (lastReaction.current === null) {
      lastReaction.current = newest;
      return;
    }
    const fresh = reactions.filter((item) => item.id > (lastReaction.current ?? 0));
    if (fresh.length) {
      lastReaction.current = newest;
      fresh.forEach((item, index) => window.setTimeout(() => float(item.emoji, false), index * 180));
      sfx.sparkle();
      navigator.vibrate?.(25);
    }
  }, [partnerRaw?.reactions, loaded, float]);

  const ctx: StepContext = useMemo(
    () => ({
      seat,
      partnerSeat,
      myName: PLAYER_NAMES[seat],
      partnerName: PLAYER_NAMES[partnerSeat],
      me,
      partner,
      partnerOnline,
      round,
      current,
      setAnswer: (id, value) => update((doc) => ({ ...doc, answers: { ...doc.answers, [id]: value } })),
      clearAnswer: (id) =>
        update((doc) => {
          const answers = { ...doc.answers };
          delete answers[id];
          return { ...doc, answers };
        }),
      advance: () => update((doc) => ({ ...doc, at: Math.max(doc.at, current + 1) })),
      setHolding: (holding) => update((doc) => (doc.holding === holding ? doc : { ...doc, holding })),
      setDeck: (deck) => update((doc) => ({ ...doc, deck: Math.max(doc.deck, deck) })),
      restart: () => update((doc) => ({ ...freshDoc(round + 1), reactions: doc.reactions })),
    }),
    [seat, partnerSeat, me, partner, partnerOnline, round, current, update],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [current, round]);

  const sendReaction = (emoji: string) => {
    float(emoji, true);
    sfx.pop();
    update((doc) => ({ ...doc, reactions: [...doc.reactions, { id: Date.now(), emoji }].slice(-8) }));
  };

  const lit = Math.min(SPARK_COUNT, Math.max(0, current - 1));
  const sparkIndex = current;

  const renderStep = () => {
    switch (step.kind) {
      case "lobby":
        return <LobbyStep ctx={ctx} partnerJoined={partnerRaw !== null} />;
      case "hold":
        return <HoldStep ctx={ctx} step={step} index={sparkIndex} />;
      case "pick":
        return <PickStep ctx={ctx} step={step} index={sparkIndex} />;
      case "guess":
        return <GuessStep ctx={ctx} step={step} index={sparkIndex} />;
      case "write":
        return <WriteStep ctx={ctx} step={step} index={sparkIndex} />;
      case "choose":
        return <ChooseStep ctx={ctx} step={step} index={sparkIndex} />;
      case "deck":
        return <DeckStep ctx={ctx} step={step} index={sparkIndex} />;
      case "wish":
        return <WishStep ctx={ctx} step={step} index={sparkIndex} />;
      case "finale":
        return <FinaleStep ctx={ctx} step={step} />;
      case "portrait":
        return <PortraitStep ctx={ctx} step={step} />;
    }
  };

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="sticky top-0 z-30 -mx-5 bg-[linear-gradient(180deg,#2a0f22_60%,transparent)] px-5 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-sans text-xs text-[#fff1e6]/70">
            <span
              className={`h-2 w-2 rounded-full ${partnerOnline ? "bg-[#7be0a5] shadow-[0_0_8px_#7be0a5] [animation:twinkle_2s_ease-in-out_infinite]" : "bg-[#fff1e6]/25"}`}
              style={{ ["--twinkle-low" as string]: 0.5 }}
            />
            {partnerOnline ? `${PLAYER_NAMES[partnerSeat]} is here` : `${PLAYER_NAMES[partnerSeat]} isn't here yet`}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Menu"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#fff1e6]/15 font-sans text-lg leading-none text-[#fff1e6]/70"
            >
              ⋯
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-[18px] border border-[#fff1e6]/12 bg-[#2a0f22]/95 font-sans text-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur">
                <p className="border-b border-[#fff1e6]/10 px-4 py-3 text-xs text-[#fff1e6]/50">Playing as {PLAYER_NAMES[seat]}</p>
                <button type="button" onClick={onSwitch} className="block w-full px-4 py-3 text-left hover:bg-[#fff1e6]/5">
                  Switch who&apos;s holding this phone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Start a fresh game on both phones?")) ctx.restart();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left hover:bg-[#fff1e6]/5"
                >
                  Start over
                </button>
                <Link href="/" className="block px-4 py-3 hover:bg-[#fff1e6]/5">
                  Back to us, so far
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        {step.kind !== "lobby" ? <CandleRow lit={lit} size="sm" showNext={step.kind !== "finale" && step.kind !== "portrait"} className="mt-3" /> : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-[16px] border border-[#ff9fb5]/30 bg-[#ff9fb5]/10 px-4 py-2.5 text-center font-sans text-xs text-[#fff1e6]/80">
          Reconnecting… ({error})
        </p>
      ) : null}
      {loaded && !shared && process.env.NODE_ENV === "production" ? (
        <p className="mb-4 text-center font-sans text-[11px] text-[#fff1e6]/40">Running without the database, so sync may be patchy.</p>
      ) : null}

      <div key={`${round}-${current}`} className="animate-fade-up flex-1">
        {loaded ? renderStep() : <p className="pt-24 text-center font-hand text-3xl text-[#fff1e6]/60">Setting the table…</p>}
      </div>

      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
        {floating.map((item) => (
          <span
            key={item.key}
            className="absolute bottom-24 block [animation:floatUp_2.8s_cubic-bezier(0.2,0.7,0.3,1)_forwards]"
            style={{ left: `${item.x}%`, fontSize: item.mine ? 30 : 54 }}
          >
            {item.emoji}
            {!item.mine ? (
              <span className="block text-center font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff9fb5]">{PLAYER_NAMES[partnerSeat]}</span>
            ) : null}
          </span>
        ))}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1 rounded-full border border-[#fff1e6]/12 bg-[#2a0f22]/85 px-2 py-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur">
          <span className="px-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#fff1e6]/40">send</span>
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendReaction(emoji)}
              aria-label={`Send ${emoji}`}
              className="grid h-11 w-11 place-items-center rounded-full text-2xl transition active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
