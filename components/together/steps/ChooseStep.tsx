"use client";

import { useState } from "react";
import { Chip, LockInButton, NextButton, PartnerProgress, StepIntro, WaitingCard, usePhase, type StepContext } from "@/components/together/parts";
import { SmoothRoad } from "@/components/together/SmoothRoad";
import { asRecord, asText } from "@/lib/together/logic";
import type { Step } from "@/lib/together/types";

type ChooseStepData = Extract<Step, { kind: "choose" }>;

const OTHER = "__other";

export function ChooseStep({ ctx, step, index }: { ctx: StepContext; step: ChooseStepData; index: number }) {
  const phase = usePhase(ctx, step.id);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});

  const valueFor = (key: string) => (picked[key] === OTHER ? (custom[key] ?? "").trim() : (picked[key] ?? ""));
  const ready = step.parts.every((part) => valueFor(part.key).length > 1);

  if (phase === "reveal") {
    const mine = asRecord(ctx.me.answers[step.id]);
    const theirs = asRecord(ctx.partner.answers[step.id]);
    return (
      <div className="flex flex-col gap-6">
        <StepIntro index={index} title={step.title} />
        <SmoothRoad duration={4200} className="mx-auto h-28 w-full max-w-sm" />
        <p className="-mt-2 text-center font-hand text-2xl text-[#ffcf8a]">{step.reveal}</p>
        {step.parts.map((part, partIndex) => {
          const left = asText(mine[part.key]);
          const right = asText(theirs[part.key]);
          const same = left.trim().toLowerCase() === right.trim().toLowerCase();
          return (
            <section key={part.key} className="animate-fade-up" style={{ animationDelay: `${partIndex * 200}ms` }}>
              <p className="mb-2 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-[#fff1e6]/50">{part.label}</p>
              {same ? (
                <p className="rounded-[20px] border border-[#ffcf8a]/50 bg-[#ffcf8a]/12 px-4 py-4 text-center font-display text-2xl italic text-[#fff1e6]">
                  {left} <span className="block font-sans text-[11px] not-italic uppercase tracking-[0.25em] text-[#ffcf8a]">✦ you both said it</span>
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <p className="rounded-[20px] border border-[#ffcf8a]/25 bg-[#ffcf8a]/[0.07] px-3 py-3 font-display text-lg italic leading-snug text-[#fff1e6]">
                    <span className="block font-sans text-[10px] not-italic uppercase tracking-[0.25em] text-[#ffcf8a]/80">{ctx.myName}</span>
                    {left}
                  </p>
                  <p className="rounded-[20px] border border-[#ff9fb5]/25 bg-[#ff9fb5]/[0.07] px-3 py-3 font-display text-lg italic leading-snug text-[#fff1e6]">
                    <span className="block font-sans text-[10px] not-italic uppercase tracking-[0.25em] text-[#ff9fb5]/80">{ctx.partnerName}</span>
                    {right}
                  </p>
                </div>
              )}
            </section>
          );
        })}
        <NextButton ctx={ctx} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />
      {phase === "waiting" ? (
        <WaitingCard ctx={ctx} id={step.id} />
      ) : (
        <>
          {step.parts.map((part) => (
            <section key={part.key}>
              <p className="mb-2.5 font-display text-xl italic text-[#fff1e6]">{part.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {part.options.map((option) => (
                  <Chip key={option} selected={picked[part.key] === option} onClick={() => setPicked((current) => ({ ...current, [part.key]: option }))}>
                    {option}
                  </Chip>
                ))}
                <Chip
                  selected={picked[part.key] === OTHER}
                  onClick={() => setPicked((current) => ({ ...current, [part.key]: OTHER }))}
                  className="col-span-2 text-center italic"
                >
                  something else…
                </Chip>
              </div>
              {picked[part.key] === OTHER ? (
                <input
                  autoFocus
                  value={custom[part.key] ?? ""}
                  onChange={(event) => setCustom((current) => ({ ...current, [part.key]: event.target.value.slice(0, 80) }))}
                  placeholder="In your own words"
                  className="mt-2 w-full rounded-[18px] border border-[#ffcf8a]/40 bg-[#fff1e6]/[0.06] px-4 py-3 font-sans text-[15px] text-[#fff1e6] placeholder:text-[#fff1e6]/35 focus:border-[#ffcf8a] focus:outline-none"
                />
              ) : null}
            </section>
          ))}
          <PartnerProgress ctx={ctx} id={step.id} />
          <LockInButton
            ready={ready}
            onLock={() => ctx.setAnswer(step.id, Object.fromEntries(step.parts.map((part) => [part.key, valueFor(part.key)])))}
          />
        </>
      )}
    </div>
  );
}
