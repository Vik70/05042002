"use client";

import { useState } from "react";
import { toParagraphs } from "@/lib/memories/format";
import { sfx } from "@/lib/sfx";

export function SealedLetter({ letter, signoff, seal = "6" }: { letter: string; signoff: string; seal?: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          sfx.pop();
          setOpen(true);
        }}
        className="group relative mx-auto block aspect-[3/2] w-full max-w-lg rounded-[6px] bg-[#f3e2cc] shadow-[0_30px_60px_rgba(0,0,0,0.45)] transition hover:-translate-y-1"
        aria-label="Open the letter"
      >
        <span className="paper-texture absolute inset-0 rounded-[6px]" />
        <svg viewBox="0 0 300 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M0 0 L150 112 L300 0" fill="#ead3b6" stroke="#c9a77f" strokeWidth="1" />
          <path d="M0 200 L120 96 M300 200 L180 96" stroke="#c9a77f" strokeWidth="1" />
        </svg>
        <span className="absolute left-1/2 top-[56%] grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#c2454f,#7a1d2a)] shadow-[0_6px_14px_rgba(0,0,0,0.35),inset_0_-4px_8px_rgba(0,0,0,0.25)] transition group-hover:scale-105">
          <span className="font-display text-3xl font-semibold italic text-[#f6c6a0]/90">{seal}</span>
        </span>
        <span className="absolute bottom-4 left-0 right-0 text-center font-hand text-2xl text-[#6b2a33]/80">for you, tap to open</span>
      </button>
    );
  }

  return (
    <article className="relative mx-auto w-full max-w-2xl animate-fade-up rounded-[4px] bg-[#fbf3e6] px-7 py-10 text-[#3a1424] shadow-[0_30px_60px_rgba(0,0,0,0.45)] md:px-14 md:py-14">
      <span className="paper-texture pointer-events-none absolute inset-0 rounded-[4px]" />
      <div className="relative space-y-5 font-hand text-[1.65rem] leading-[1.35] md:text-3xl md:leading-[1.4]">
        {toParagraphs(letter).map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
        <p className="pt-4 text-right">
          {signoff}
          <span className="ml-2 text-[#c2454f]">♥</span>
        </p>
      </div>
    </article>
  );
}
