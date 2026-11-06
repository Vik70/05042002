"use client";

import { useState } from "react";
import { Chip, LockInButton, NextButton, PartnerProgress, StepIntro, WaitingCard, usePhase, type StepContext } from "@/components/together/parts";
import { asNumbers, asRecord } from "@/lib/together/logic";
import type { Step } from "@/lib/together/types";

type GuessStepData = Extract<Step, { kind: "guess" }>;

export function GuessStep({ ctx, step, index }: { ctx: StepContext; step: GuessStepData; index: number }) {
  const phase = usePhase(ctx, step.id);
  const blank = () => step.questions.map(() => -1);
  const [self, setSelf] = useState<number[]>(blank);
  const [guess, setGuess] = useState<number[]>(blank);
  const [page, setPage] = useState(0);

  if (phase === "reveal") {
    return <GuessReveal ctx={ctx} step={step} index={index} />;
  }

  const question = step.questions[page];
  const pageDone = self[page] >= 0 && guess[page] >= 0;
  const last = page === step.questions.length - 1;
  const ready = self.every((value) => value >= 0) && guess.every((value) => value >= 0);
  const pick = (setter: typeof setSelf, option: number) => setter((current) => current.map((value, i) => (i === page ? option : value)));

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />
      {phase === "waiting" ? (
        <WaitingCard ctx={ctx} id={step.id} />
      ) : (
        <>
          <div className="flex justify-center gap-2">
            {step.questions.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Question ${i + 1}`}
                onClick={() => setPage(i)}
                className={`h-2 rounded-full transition-all ${i === page ? "w-8 bg-[#ffcf8a]" : self[i] >= 0 && guess[i] >= 0 ? "w-2 bg-[#ffcf8a]/60" : "w-2 bg-[#fff1e6]/20"}`}
              />
            ))}
          </div>

          <div key={page} className="animate-fade-up space-y-5">
            <p className="text-center font-display text-[1.65rem] italic leading-tight text-[#fff1e6]">{question.prompt}</p>
            <div>
              <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffcf8a]/80">For me, it&apos;s…</p>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option, i) => (
                  <Chip key={option} selected={self[page] === i} onClick={() => pick(setSelf, i)}>
                    {option}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ff9fb5]/80">I bet {ctx.partnerName} said…</p>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option, i) => (
                  <Chip key={option} selected={guess[page] === i} onClick={() => pick(setGuess, i)}>
                    {option}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <PartnerProgress ctx={ctx} id={step.id} />
          {last ? (
            <LockInButton ready={ready} onLock={() => ctx.setAnswer(step.id, { self, guess })} />
          ) : (
            <button
              type="button"
              disabled={!pageDone}
              onClick={() => setPage(page + 1)}
              className="w-full rounded-full border border-[#ffcf8a]/50 px-6 py-4 font-display text-xl italic text-[#ffcf8a] transition active:scale-[0.98] disabled:opacity-30"
            >
              Next question
            </button>
          )}
        </>
      )}
    </div>
  );
}

function GuessReveal({ ctx, step, index }: { ctx: StepContext; step: GuessStepData; index: number }) {
  const mine = asRecord(ctx.me.answers[step.id]);
  const theirs = asRecord(ctx.partner.answers[step.id]);
  const mySelf = asNumbers(mine.self);
  const myGuess = asNumbers(mine.guess);
  const theirSelf = asNumbers(theirs.self);
  const theirGuess = asNumbers(theirs.guess);
  const iRead = step.questions.filter((_, i) => myGuess[i] === theirSelf[i]).length;
  const theyRead = step.questions.filter((_, i) => theirGuess[i] === mySelf[i]).length;

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} />
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-[22px] border border-[#ffcf8a]/30 bg-[#ffcf8a]/10 px-3 py-4">
          <p className="font-display text-4xl font-semibold italic text-[#ffcf8a]">
            {iRead}/{step.questions.length}
          </p>
          <p className="mt-1 font-sans text-xs text-[#fff1e6]/65">you read {ctx.partnerName}</p>
        </div>
        <div className="rounded-[22px] border border-[#ff9fb5]/30 bg-[#ff9fb5]/10 px-3 py-4">
          <p className="font-display text-4xl font-semibold italic text-[#ff9fb5]">
            {theyRead}/{step.questions.length}
          </p>
          <p className="mt-1 font-sans text-xs text-[#fff1e6]/65">{ctx.partnerName} read you</p>
        </div>
      </div>

      <ul className="space-y-3">
        {step.questions.map((question, i) => (
          <li key={question.prompt} className="animate-fade-up rounded-[22px] border border-[#fff1e6]/10 bg-[#fff1e6]/[0.03] px-4 py-3.5" style={{ animationDelay: `${i * 140}ms` }}>
            <p className="font-display text-lg italic text-[#fff1e6]">{question.prompt}</p>
            <p className="mt-2 font-sans text-[14px] text-[#fff1e6]/80">
              <span className="text-[#ff9fb5]">{ctx.partnerName}:</span> {question.options[theirSelf[i]]}{" "}
              <span className={myGuess[i] === theirSelf[i] ? "text-[#ffcf8a]" : "text-[#fff1e6]/40"}>
                {myGuess[i] === theirSelf[i] ? "· you knew ✓" : `· you guessed "${question.options[myGuess[i]]}"`}
              </span>
            </p>
            <p className="mt-1 font-sans text-[14px] text-[#fff1e6]/80">
              <span className="text-[#ffcf8a]">You:</span> {question.options[mySelf[i]]}{" "}
              <span className={theirGuess[i] === mySelf[i] ? "text-[#ff9fb5]" : "text-[#fff1e6]/40"}>
                {theirGuess[i] === mySelf[i] ? `· ${ctx.partnerName} knew ✓` : `· ${ctx.partnerName} guessed "${question.options[theirGuess[i]]}"`}
              </span>
            </p>
          </li>
        ))}
      </ul>
      <p className="text-center font-hand text-2xl text-[#fff1e6]/75">Every wrong guess is just something new to learn about each other.</p>
      <NextButton ctx={ctx} />
    </div>
  );
}
