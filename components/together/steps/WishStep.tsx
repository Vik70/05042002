"use client";

import { useState } from "react";
import { Chip, LockInButton, NextButton, PartnerProgress, StepIntro, WaitingCard, usePhase, type StepContext } from "@/components/together/parts";
import { asStrings, sameWish } from "@/lib/together/logic";
import type { Step } from "@/lib/together/types";

type WishStepData = Extract<Step, { kind: "wish" }>;

export function WishStep({ ctx, step, index }: { ctx: StepContext; step: WishStepData; index: number }) {
  const phase = usePhase(ctx, step.id);
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  if (phase === "reveal") {
    return <WishReveal ctx={ctx} step={step} index={index} />;
  }

  const toggle = (option: string) =>
    setPicked((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : current.length < step.max ? [...current, option] : current,
    );
  const customWish = custom.trim();
  const wishes = customWish ? [...picked.slice(0, step.max - 1), customWish] : picked;

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />
      {phase === "waiting" ? (
        <WaitingCard ctx={ctx} id={step.id} />
      ) : (
        <>
          <p className="text-center font-sans text-xs uppercase tracking-[0.3em] text-[#ffcf8a]/80">
            {wishes.length} of {step.max} picked
          </p>
          <div className="grid grid-cols-2 gap-2">
            {step.options.map((option) => (
              <Chip
                key={option}
                selected={picked.includes(option)}
                disabled={!picked.includes(option) && wishes.length >= step.max}
                onClick={() => toggle(option)}
              >
                {option}
              </Chip>
            ))}
          </div>
          <input
            value={custom}
            onChange={(event) => setCustom(event.target.value.slice(0, 60))}
            placeholder="Or write your own…"
            disabled={!customWish && picked.length >= step.max}
            className="w-full rounded-[18px] border border-[#fff1e6]/15 bg-[#fff1e6]/[0.05] px-4 py-3 font-sans text-[15px] text-[#fff1e6] placeholder:text-[#fff1e6]/35 focus:border-[#ffcf8a] focus:outline-none disabled:opacity-40"
          />
          <PartnerProgress ctx={ctx} id={step.id} />
          <LockInButton ready={wishes.length > 0} onLock={() => ctx.setAnswer(step.id, wishes)} />
        </>
      )}
    </div>
  );
}

function WishReveal({ ctx, step, index }: { ctx: StepContext; step: WishStepData; index: number }) {
  const mine = asStrings(ctx.me.answers[step.id]);
  const theirs = asStrings(ctx.partner.answers[step.id]);
  const dates = mine.filter((item) => theirs.some((other) => sameWish(item, other)));
  const onlyMine = mine.filter((item) => !dates.some((date) => sameWish(date, item)));
  const onlyTheirs = theirs.filter((item) => !dates.some((date) => sameWish(date, item)));

  return (
    <div className="flex flex-col gap-6">
      <StepIntro index={index} title={step.title} />
      {dates.length ? (
        <div className="space-y-3">
          {dates.map((date, i) => (
            <div
              key={date}
              className="animate-pop-in rounded-[24px] border border-[#ffcf8a]/60 bg-[radial-gradient(circle_at_50%_0%,rgba(255,207,138,0.3),transparent_70%)] px-5 py-5 text-center"
              style={{ animationDelay: `${i * 220}ms` }}
            >
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.4em] text-[#ffcf8a]">it&apos;s a date</p>
              <p className="mt-1 font-display text-3xl italic text-[#fff1e6]">{date}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center font-hand text-2xl text-[#fff1e6]/80">No overlaps, so you get to do all of them. Obviously.</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: ctx.myName, list: onlyMine, tone: "text-[#ffcf8a]" },
          { name: ctx.partnerName, list: onlyTheirs, tone: "text-[#ff9fb5]" },
        ].map(({ name, list, tone }) =>
          list.length ? (
            <div key={name} className="rounded-[20px] border border-[#fff1e6]/10 bg-[#fff1e6]/[0.03] px-4 py-3">
              <p className={`font-sans text-[10px] font-semibold uppercase tracking-[0.25em] ${tone}`}>{name} also wants</p>
              <ul className="mt-2 space-y-1 font-display text-[17px] italic leading-snug text-[#fff1e6]/85">
                {list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <span key={name} />
          ),
        )}
      </div>
      <NextButton ctx={ctx} label="Light the last spark" />
    </div>
  );
}
