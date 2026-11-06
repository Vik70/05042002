"use client";

import { useState } from "react";
import { LockInButton, NextButton, PartnerProgress, StepIntro, WaitingCard, usePhase, type StepContext } from "@/components/together/parts";
import { asNumbers, syncLine } from "@/lib/together/logic";
import type { Step } from "@/lib/together/types";

type PickStepData = Extract<Step, { kind: "pick" }>;

export function PickStep({ ctx, step, index }: { ctx: StepContext; step: PickStepData; index: number }) {
  const phase = usePhase(ctx, step.id);
  const [draft, setDraft] = useState<(number | undefined)[]>(() => step.questions.map(() => undefined));
  const ready = draft.every((value) => value !== undefined);

  if (phase === "reveal") {
    return <PickReveal ctx={ctx} step={step} index={index} />;
  }

  return (
    <div className="flex flex-col gap-7">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />
      {phase === "waiting" ? (
        <WaitingCard ctx={ctx} id={step.id} />
      ) : (
        <>
          <div className="space-y-3">
            {step.questions.map((question, questionIndex) => (
              <div key={question.a} className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                {[question.a, question.b].map((option, optionIndex) => {
                  const selected = draft[questionIndex] === optionIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setDraft((current) => current.map((value, i) => (i === questionIndex ? optionIndex : value)))}
                      className={`rounded-[18px] border px-3 py-3.5 font-sans text-[14px] leading-tight transition active:scale-[0.97] ${
                        optionIndex === 1 ? "order-3 text-right" : "text-left"
                      } ${
                        selected
                          ? "border-[#ffcf8a] bg-[#ffcf8a]/18 text-[#fff1e6] shadow-[0_0_20px_rgba(255,207,138,0.2)]"
                          : "border-[#fff1e6]/12 bg-[#fff1e6]/[0.04] text-[#fff1e6]/75"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
                <span className="order-2 self-center font-hand text-xl text-[#fff1e6]/40">or</span>
              </div>
            ))}
          </div>
          <PartnerProgress ctx={ctx} id={step.id} />
          <LockInButton ready={ready} onLock={() => ctx.setAnswer(step.id, draft as number[])} />
        </>
      )}
    </div>
  );
}

function PickReveal({ ctx, step, index }: { ctx: StepContext; step: PickStepData; index: number }) {
  const mine = asNumbers(ctx.me.answers[step.id]);
  const theirs = asNumbers(ctx.partner.answers[step.id]);
  const matched = step.questions.filter((_, i) => mine[i] === theirs[i]).length;

  return (
    <div className="flex flex-col gap-7">
      <StepIntro index={index} title={step.title} />
      <div className="text-center">
        <p className="font-display text-6xl font-semibold italic text-[#ffcf8a]">
          {matched}
          <span className="text-3xl text-[#fff1e6]/50"> / {step.questions.length}</span>
        </p>
        <p className="mt-1 font-hand text-2xl text-[#fff1e6]/80">{syncLine({ matched, total: step.questions.length })}</p>
      </div>
      <ul className="space-y-2.5">
        {step.questions.map((question, i) => {
          const same = mine[i] === theirs[i];
          const options = [question.a, question.b];
          return (
            <li
              key={question.a}
              className={`animate-fade-up rounded-[20px] border px-4 py-3 ${same ? "border-[#ffcf8a]/50 bg-[#ffcf8a]/10" : "border-[#fff1e6]/10 bg-[#fff1e6]/[0.03]"}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {same ? (
                <p className="flex items-center justify-between gap-3 font-sans text-[15px] text-[#fff1e6]">
                  <span>{options[mine[i]]}</span>
                  <span className="shrink-0 font-sans text-[11px] uppercase tracking-[0.25em] text-[#ffcf8a]">✦ both</span>
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 font-sans text-[14px] leading-tight">
                  <p>
                    <span className="block text-[10px] uppercase tracking-[0.25em] text-[#ffcf8a]/80">{ctx.myName}</span>
                    <span className="text-[#fff1e6]/85">{options[mine[i]]}</span>
                  </p>
                  <p className="text-right">
                    <span className="block text-[10px] uppercase tracking-[0.25em] text-[#ff9fb5]/80">{ctx.partnerName}</span>
                    <span className="text-[#fff1e6]/85">{options[theirs[i]]}</span>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-center font-sans text-sm text-[#fff1e6]/55">Argue lovingly about the ones that don&apos;t match.</p>
      <NextButton ctx={ctx} />
    </div>
  );
}
