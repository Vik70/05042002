"use client";

import { useState } from "react";
import { NameTag, PrimaryButton, type StepContext } from "@/components/together/parts";
import { sfx } from "@/lib/sfx";

const RULES = [
  "Seven little rounds, one for every month.",
  "Answers stay hidden until you've both locked in.",
  "Each round you finish lights a candle.",
  "Put the phones down between rounds. The talking is the point.",
];

export function LobbyStep({ ctx, partnerJoined }: { ctx: StepContext; partnerJoined: boolean }) {
  const [copied, setCopied] = useState(false);
  const meReady = ctx.me.at >= 1;
  const partnerReady = ctx.partner.at >= 1;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Seven Sparks", text: "Come play with me ♥", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Dismissing the share sheet isn't an error worth showing.
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.45em] text-[#ffcf8a]/75">a game for two phones &amp; one table</p>
        <h1 className="mt-3 bg-[linear-gradient(180deg,#fff6e0,#ffcf8a_60%,#ff9fb5)] bg-clip-text font-display text-6xl font-semibold italic leading-none text-transparent sm:text-7xl">
          Seven Sparks
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-hand text-[1.7rem] leading-tight text-[#fff1e6]/80">
          Happy seven months. Tonight we light one candle for each of them.
        </p>
      </header>

      <ol className="space-y-3">
        {RULES.map((rule, index) => (
          <li key={rule} className="flex items-start gap-3 font-sans text-[15px] leading-snug text-[#fff1e6]/75">
            <span className="mt-0.5 font-display text-lg italic text-[#ffcf8a]">{index + 1}</span>
            {rule}
          </li>
        ))}
      </ol>

      <div className="rounded-[28px] border border-[#fff1e6]/10 bg-[#fff1e6]/[0.04] p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <NameTag seat={ctx.seat} name={ctx.myName} />
            <span className="font-sans text-xs text-[#fff1e6]/50">this phone</span>
          </span>
          <span className={`font-sans text-xs uppercase tracking-[0.2em] ${meReady ? "text-[#ffcf8a]" : "text-[#fff1e6]/40"}`}>
            {meReady ? "ready ✓" : "not yet"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <NameTag seat={ctx.partnerSeat} name={ctx.partnerName} />
            <span className="font-sans text-xs text-[#fff1e6]/50">{ctx.partnerOnline ? "at the table" : partnerJoined ? "phone asleep" : "not here yet"}</span>
          </span>
          <span className={`font-sans text-xs uppercase tracking-[0.2em] ${partnerReady ? "text-[#ff9fb5]" : "text-[#fff1e6]/40"}`}>
            {partnerReady ? "ready ✓" : "not yet"}
          </span>
        </div>

        {!ctx.partnerOnline ? (
          <div className="mt-5 border-t border-[#fff1e6]/10 pt-4 text-center">
            <p className="font-sans text-sm text-[#fff1e6]/60">
              Open this page on {ctx.partnerName}&apos;s phone and pick &ldquo;{ctx.partnerName}&rdquo;.
            </p>
            <button
              type="button"
              onClick={share}
              className="mt-3 rounded-full border border-[#ffcf8a]/40 px-5 py-2 font-sans text-sm text-[#ffcf8a] transition hover:bg-[#ffcf8a]/10"
            >
              {copied ? "Link copied ♥" : "Send them the link"}
            </button>
          </div>
        ) : null}
      </div>

      {meReady ? (
        <p className="rounded-full border border-[#fff1e6]/12 px-6 py-4 text-center font-display text-lg italic text-[#fff1e6]/70">
          {partnerReady ? "Here we go…" : `Waiting for ${ctx.partnerName} to sit down…`}
        </p>
      ) : (
        <PrimaryButton
          onClick={() => {
            sfx.chime();
            ctx.advance();
          }}
        >
          I&apos;m at the table
        </PrimaryButton>
      )}
    </div>
  );
}
