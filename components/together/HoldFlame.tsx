"use client";

import { useEffect, useRef, useState } from "react";
import { NameTag, type StepContext } from "@/components/together/parts";
import { sfx } from "@/lib/sfx";

const FILL_MS = 1600;
const DRAIN_MS = 900;
const RING = 2 * Math.PI * 104;

export function HoldFlame({ ctx, id, label }: { ctx: StepContext; id: string; label: string }) {
  const lit = ctx.me.answers[id] === true || ctx.partner.answers[id] === true;
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const partnerHolding = ctx.partnerOnline && ctx.partner.holding;
  const together = holding && partnerHolding;

  const release = () => {
    setHolding(false);
    if (ctxRef.current.me.holding) ctxRef.current.setHolding(false);
  };

  useEffect(() => {
    if (lit) {
      progressRef.current = 1;
      setProgress(1);
      return;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      const next = together
        ? Math.min(1, progressRef.current + delta / FILL_MS)
        : Math.max(0, progressRef.current - delta / DRAIN_MS);
      if (next !== progressRef.current) {
        progressRef.current = next;
        setProgress(next);
      }
      if (next >= 1) {
        sfx.chime([392, 523.25, 659.25, 783.99, 1046.5]);
        navigator.vibrate?.([30, 50, 80]);
        setHolding(false);
        ctxRef.current.setAnswer(id, true);
        ctxRef.current.setHolding(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [together, lit, id]);

  useEffect(() => () => {
    if (ctxRef.current.me.holding) ctxRef.current.setHolding(false);
  }, []);

  const message = lit
    ? null
    : together
      ? "Both holding… don't let go"
      : holding
        ? `Holding. Waiting for ${ctx.partnerName}'s thumb…`
        : partnerHolding
          ? `${ctx.partnerName} is holding. Put your thumb on it!`
          : label;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-label={lit ? "Lit" : "Hold the flame"}
        disabled={lit}
        onPointerDown={(event) => {
          if (lit) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setHolding(true);
          ctx.setHolding(true);
          sfx.pop();
          navigator.vibrate?.(12);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onContextMenu={(event) => event.preventDefault()}
        className="relative grid h-[232px] w-[232px] touch-none select-none place-items-center rounded-full [-webkit-touch-callout:none]"
      >
        <span
          className={`absolute inset-6 rounded-full transition duration-500 ${
            lit
              ? "bg-[radial-gradient(circle,rgba(255,207,138,0.45),rgba(255,127,155,0.12)_55%,transparent_70%)]"
              : together
                ? "bg-[radial-gradient(circle,rgba(255,207,138,0.3),transparent_68%)]"
                : "bg-[radial-gradient(circle,rgba(255,241,230,0.08),transparent_68%)]"
          }`}
        />
        <svg viewBox="0 0 232 232" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="116" cy="116" r="104" fill="none" stroke="rgba(255,241,230,0.1)" strokeWidth="6" />
          <circle
            cx="116"
            cy="116"
            r="104"
            fill="none"
            stroke="url(#hold-ring)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - progress)}
          />
          <defs>
            <linearGradient id="hold-ring" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff9fb5" />
              <stop offset="100%" stopColor="#ffcf8a" />
            </linearGradient>
          </defs>
        </svg>
        <span className={`relative flex flex-col items-center transition-transform duration-300 ${holding ? "scale-95" : ""}`}>
          <span
            className={`block origin-bottom rounded-[50%_50%_45%_45%/65%_65%_35%_35%] transition-all duration-700 ${
              lit
                ? "h-20 w-12 bg-[radial-gradient(circle_at_50%_72%,#fffbe8,#ffd27a_42%,#ff8f4a_80%)] shadow-[0_0_60px_24px_rgba(255,190,110,0.45)] [animation:flicker_2.4s_ease-in-out_infinite]"
                : together
                  ? "h-14 w-9 bg-[radial-gradient(circle_at_50%_72%,#fff6dc,#ffd27a_45%,#ff9a5a_85%)] opacity-90 shadow-[0_0_30px_10px_rgba(255,190,110,0.3)] [animation:flicker_1.2s_ease-in-out_infinite]"
                  : "h-9 w-6 bg-[radial-gradient(circle_at_50%_72%,#fff1e6,#ffcf8a_50%,transparent_85%)] opacity-35"
            }`}
          />
          <span className="block h-2 w-0.5 bg-[#fff1e6]/40" />
          <span className="block h-16 w-7 rounded-t-[4px] bg-[linear-gradient(90deg,#e9d8c4,#fff6ea_45%,#d6c0a6)]" />
        </span>
      </button>

      <div className="mt-5 flex items-center gap-4 font-sans text-xs text-[#fff1e6]/60">
        <span className={`flex items-center gap-2 transition ${holding || lit ? "opacity-100" : "opacity-40"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${holding || lit ? "bg-[#ffcf8a] shadow-[0_0_10px_#ffcf8a]" : "bg-[#fff1e6]/30"}`} />
          <NameTag seat={ctx.seat} name={ctx.myName} />
        </span>
        <span className="text-[#fff1e6]/30">+</span>
        <span className={`flex items-center gap-2 transition ${partnerHolding || lit ? "opacity-100" : "opacity-40"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${partnerHolding || lit ? "bg-[#ff9fb5] shadow-[0_0_10px_#ff9fb5]" : "bg-[#fff1e6]/30"}`} />
          <NameTag seat={ctx.partnerSeat} name={ctx.partnerName} />
        </span>
      </div>

      {message ? <p className="mt-5 min-h-[3rem] max-w-xs text-center font-display text-xl italic text-[#fff1e6]/85">{message}</p> : null}
    </div>
  );
}
