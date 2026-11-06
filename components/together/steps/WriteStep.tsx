"use client";

import { useState } from "react";
import { LockInButton, NextButton, PartnerProgress, StepIntro, WaitingCard, usePhase, type StepContext } from "@/components/together/parts";
import { asText } from "@/lib/together/logic";
import type { Step } from "@/lib/together/types";

const MAX = 280;

export function NoteCard({ from, text, tone, delay = 0 }: { from: string; text: string; tone: "gold" | "rose"; delay?: number }) {
  return (
    <figure
      className={`animate-pop-in relative rounded-[6px] px-5 pb-5 pt-6 text-[#3a1424] shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
        tone === "gold" ? "-rotate-1 bg-[#fff3dc]" : "rotate-1 bg-[#ffe6ea]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rotate-2 ${tone === "gold" ? "bg-[#ffcf8a]/70" : "bg-[#ff9fb5]/70"}`} />
      <blockquote className="whitespace-pre-line font-hand text-[1.6rem] leading-[1.25]">{text}</blockquote>
      <figcaption className="mt-3 text-right font-sans text-[11px] font-semibold uppercase tracking-[0.3em] opacity-60">from {from}</figcaption>
    </figure>
  );
}

export function WriteStep({ ctx, step, index }: { ctx: StepContext; step: Extract<Step, { kind: "write" }>; index: number }) {
  const phase = usePhase(ctx, step.id);
  const [text, setText] = useState("");

  if (phase === "reveal") {
    return (
      <div className="flex flex-col gap-7">
        <StepIntro index={index} title={step.title} prompt={step.reveal} />
        <div className="space-y-6 px-1">
          <NoteCard from={ctx.partnerName} text={asText(ctx.partner.answers[step.id])} tone={ctx.partnerSeat === "aanavee" ? "rose" : "gold"} />
          <NoteCard from={ctx.myName} text={asText(ctx.me.answers[step.id])} tone={ctx.seat === "aanavee" ? "rose" : "gold"} delay={250} />
        </div>
        <NextButton ctx={ctx} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />
      {phase === "waiting" ? (
        <WaitingCard ctx={ctx} id={step.id} note={`Folded and sealed. Waiting for ${ctx.partnerName} to finish writing.`} />
      ) : (
        <>
          <div className="relative rounded-[6px] bg-[#fff3dc] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, MAX))}
              placeholder={step.placeholder}
              rows={5}
              className="block w-full resize-none rounded-[4px] bg-transparent px-4 py-3 font-hand text-[1.6rem] leading-[1.25] text-[#3a1424] placeholder:text-[#3a1424]/35 focus:outline-none"
            />
            <span className="absolute bottom-2 right-3 font-sans text-[11px] text-[#3a1424]/40">
              {text.length}/{MAX}
            </span>
          </div>
          <PartnerProgress ctx={ctx} id={step.id} />
          <LockInButton ready={text.trim().length > 2} label="Fold it up" onLock={() => ctx.setAnswer(step.id, text.trim())} />
        </>
      )}
    </div>
  );
}
