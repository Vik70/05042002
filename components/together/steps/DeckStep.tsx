"use client";

import { useMemo } from "react";
import { NameTag, NextButton, StepIntro, type StepContext } from "@/components/together/parts";
import { shuffledDeck } from "@/lib/together/logic";
import { sfx } from "@/lib/sfx";
import type { Step } from "@/lib/together/types";

export function DeckStep({ ctx, step, index }: { ctx: StepContext; step: Extract<Step, { kind: "deck" }>; index: number }) {
  const deck = useMemo(() => shuffledDeck(step.cards, ctx.round), [step.cards, ctx.round]);
  const drawn = Math.max(ctx.me.deck, ctx.partner.deck);
  const card = deck[drawn % deck.length];
  const askerIsMe = (drawn % 2 === 0) === (ctx.seat === "aanavee");
  const asker = askerIsMe ? { seat: ctx.seat, name: ctx.myName } : { seat: ctx.partnerSeat, name: ctx.partnerName };
  const answerer = askerIsMe ? ctx.partnerName : "you";
  const enough = drawn + 1 >= step.minimum;

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />

      <div className="flex items-center justify-center gap-2 font-sans text-sm text-[#fff1e6]/70">
        <NameTag seat={asker.seat} name={asker.name} />
        <span>asks, {answerer} answer{askerIsMe ? "s" : ""}</span>
      </div>

      <div className="[perspective:1000px]">
        <div
          key={drawn}
          className="relative mx-auto flex aspect-[4/5] w-full max-w-[320px] flex-col items-center justify-center rounded-[28px] border border-[#ffcf8a]/30 bg-[radial-gradient(circle_at_50%_0%,rgba(255,207,138,0.22),transparent_55%),linear-gradient(170deg,#4a1a34,#2a0f22)] px-7 text-center shadow-[0_30px_60px_rgba(0,0,0,0.45)] [animation:cardDeal_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both]"
        >
          <span className="absolute inset-3 rounded-[22px] border border-[#ffcf8a]/15" />
          <span className="font-sans text-[11px] uppercase tracking-[0.4em] text-[#ffcf8a]/70">card {drawn + 1}</span>
          <p className="mt-5 font-display text-[1.9rem] italic leading-[1.15] text-[#fff1e6]">{card}</p>
          <span className="mt-6 font-display text-2xl text-[#ff9fb5]">✦</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          sfx.pop();
          ctx.setDeck(drawn + 1);
        }}
        className="mx-auto rounded-full border border-[#ffcf8a]/50 px-8 py-3 font-display text-xl italic text-[#ffcf8a] transition active:scale-[0.97]"
      >
        Draw another card
      </button>

      {enough ? (
        <NextButton ctx={ctx} label="We've talked. Light it" />
      ) : (
        <p className="text-center font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/40">
          {step.minimum - drawn - 1} more before this one lights
        </p>
      )}
    </div>
  );
}
