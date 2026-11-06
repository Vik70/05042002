"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { sfx } from "@/lib/sfx";
import type { AnswerValue, PlayerDoc, Seat } from "@/lib/together/types";

export interface StepContext {
  seat: Seat;
  partnerSeat: Seat;
  myName: string;
  partnerName: string;
  me: PlayerDoc;
  partner: PlayerDoc;
  partnerOnline: boolean;
  round: number;
  current: number;
  setAnswer: (id: string, value: AnswerValue) => void;
  clearAnswer: (id: string) => void;
  advance: () => void;
  setHolding: (holding: boolean) => void;
  setDeck: (deck: number) => void;
  restart: () => void;
}

export type Phase = "input" | "waiting" | "reveal";

export function usePhase(ctx: StepContext, id: string): Phase {
  const phase: Phase = ctx.me.answers[id] === undefined ? "input" : ctx.partner.answers[id] === undefined ? "waiting" : "reveal";
  const previous = useRef(phase);
  useEffect(() => {
    if (phase === "reveal" && previous.current !== "reveal") {
      sfx.chime([523.25, 659.25, 783.99, 1046.5]);
      navigator.vibrate?.([20, 40, 20]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    previous.current = phase;
  }, [phase]);
  return phase;
}

export function StepIntro({ index, title, prompt }: { index?: number; title: string; prompt?: ReactNode }) {
  return (
    <header className="text-center">
      {index ? (
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.45em] text-[#ffcf8a]/75">
          spark {index} · month {index}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-[2.4rem] font-semibold italic leading-[1.02] text-[#fff1e6] sm:text-5xl">{title}</h2>
      {prompt ? <p className="mx-auto mt-3 max-w-md font-sans text-[15px] leading-relaxed text-[#fff1e6]/70">{prompt}</p> : null}
    </header>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full bg-[linear-gradient(180deg,#ffdca0,#ffb46b)] px-6 py-4 font-display text-xl font-semibold italic text-[#3a1424] shadow-[0_12px_30px_rgba(255,170,90,0.28),inset_0_1px_0_rgba(255,255,255,0.6)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  selected,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.click();
        onClick();
      }}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-[18px] border px-4 py-3 text-left font-sans text-[15px] leading-snug transition active:scale-[0.98] disabled:opacity-40 ${
        selected
          ? "border-[#ffcf8a] bg-[#ffcf8a]/18 text-[#fff1e6] shadow-[0_0_0_1px_rgba(255,207,138,0.6),0_0_24px_rgba(255,207,138,0.18)]"
          : "border-[#fff1e6]/15 bg-[#fff1e6]/[0.04] text-[#fff1e6]/85 hover:border-[#fff1e6]/35"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function LockInButton({ ready, onLock, label = "Lock it in" }: { ready: boolean; onLock: () => void; label?: string }) {
  return (
    <PrimaryButton
      disabled={!ready}
      onClick={() => {
        sfx.pop();
        navigator.vibrate?.(15);
        onLock();
      }}
    >
      {label}
    </PrimaryButton>
  );
}

export function PartnerProgress({ ctx, id }: { ctx: StepContext; id: string }) {
  const done = ctx.partner.answers[id] !== undefined;
  return (
    <p className="text-center font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/45">
      {done ? (
        <span className="text-[#ffcf8a]">{ctx.partnerName} has locked in ✓</span>
      ) : (
        <span>
          {ctx.partnerName} is thinking<span className="inline-block [animation:twinkle_1.2s_ease-in-out_infinite]">…</span>
        </span>
      )}
    </p>
  );
}

export function WaitingCard({ ctx, id, note }: { ctx: StepContext; id: string; note?: string }) {
  return (
    <div className="animate-fade-up rounded-[28px] border border-[#fff1e6]/10 bg-[#fff1e6]/[0.04] px-6 py-10 text-center">
      <span className="mx-auto block h-12 w-12 [animation:bob_1.8s_ease-in-out_infinite]">
        <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
          <path d="M24 40 C 6 29 7 13 16 12 C 20 11.5 22.5 14 24 16.5 C 25.5 14 28 11.5 32 12 C 41 13 42 29 24 40 Z" fill="#ff7f9b" />
        </svg>
      </span>
      <p className="mt-4 font-display text-2xl italic text-[#fff1e6]">Locked in.</p>
      <p className="mt-1 font-sans text-[15px] text-[#fff1e6]/65">
        {note ?? `Waiting for ${ctx.partnerName}. No peeking at their screen.`}
      </p>
      <button
        type="button"
        onClick={() => ctx.clearAnswer(id)}
        className="mt-6 font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/40 underline underline-offset-4 hover:text-[#ffcf8a]"
      >
        change my answer
      </button>
    </div>
  );
}

export function NextButton({ ctx, label = "Light the next spark" }: { ctx: StepContext; label?: string }) {
  if (ctx.me.at > ctx.current) {
    return (
      <p className="rounded-full border border-[#fff1e6]/12 px-6 py-4 text-center font-display text-lg italic text-[#fff1e6]/70">
        Waiting for {ctx.partnerName} to tap too…
      </p>
    );
  }
  return (
    <PrimaryButton
      onClick={() => {
        sfx.sparkle();
        ctx.advance();
      }}
    >
      {label}
    </PrimaryButton>
  );
}

export function NameTag({ seat, name }: { seat: Seat; name: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] ${
        seat === "aanavee" ? "bg-[#ff9fb5] text-[#3a1424]" : "bg-[#ffcf8a] text-[#3a1424]"
      }`}
    >
      {name}
    </span>
  );
}
