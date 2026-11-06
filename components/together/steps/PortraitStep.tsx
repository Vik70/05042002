"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/together/Confetti";
import { LockInButton, PartnerProgress, StepIntro, WaitingCard, usePhase, type StepContext } from "@/components/together/parts";
import { MAX_PORTRAIT_CHARS } from "@/lib/together/logic";
import { sfx } from "@/lib/sfx";
import type { Portrait, Seat, Step } from "@/lib/together/types";

type PortraitStepData = Extract<Step, { kind: "portrait" }>;

const SIZES = [1100, 900, 720, 560];
const QUALITIES = [0.82, 0.72, 0.6];

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file didn't open as a photo. Try a different one?"));
    };
    image.src = url;
  });

// Photos go through the same small content store as the game, so they're shrunk on the phone first.
async function shrinkPhoto(file: File): Promise<string> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This phone couldn't prepare the photo.");
  for (const size of SIZES) {
    const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_PORTRAIT_CHARS) return data;
    }
  }
  throw new Error("That photo is too big to send. Try a screenshot of it instead?");
}

export function PortraitStep({ ctx, step }: { ctx: StepContext; step: PortraitStepData }) {
  const phase = usePhase(ctx, step.id);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  if (phase === "reveal") {
    return <PortraitReveal ctx={ctx} step={step} />;
  }

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    setBusy(true);
    try {
      setPreview(await shrinkPhoto(file));
      sfx.pop();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Couldn't read that photo.");
    } finally {
      setBusy(false);
    }
  };

  const hangItUp = async () => {
    if (!preview) return;
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/together/portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat: ctx.seat, round: ctx.round, image: preview }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Couldn't send it (${response.status}).`);
      }
      ctx.setAnswer(step.id, true);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Couldn't send it. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <StepIntro title={step.title} prompt={step.prompt} />
      {phase === "waiting" ? (
        <>
          {preview ? <Frame image={preview} label={`${ctx.myName}'s portrait of ${ctx.partnerName}`} tone={ctx.seat} /> : null}
          <WaitingCard ctx={ctx} id={step.id} note={`Hung up and covered. Waiting for ${ctx.partnerName}'s masterpiece.`} />
        </>
      ) : (
        <>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void choose(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {preview ? (
            <>
              <Frame image={preview} label={`your portrait of ${ctx.partnerName}`} tone={ctx.seat} />
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="mx-auto font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/50 underline underline-offset-4"
              >
                use a different photo
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-[#ffcf8a]/40 bg-[#fff1e6]/[0.03] px-6 text-center transition active:scale-[0.99] disabled:opacity-50"
            >
              <span className="font-display text-6xl text-[#ffcf8a]">🖼️</span>
              <span className="font-display text-2xl italic text-[#fff1e6]">{busy ? "Developing…" : `Add your portrait of ${ctx.partnerName}`}</span>
              <span className="font-sans text-sm text-[#fff1e6]/55">Take a photo of the painting, or pick one from your camera roll.</span>
            </button>
          )}
          {problem ? <p className="text-center font-sans text-sm text-[#ff9fb5]">{problem}</p> : null}
          <PartnerProgress ctx={ctx} id={step.id} />
          <LockInButton ready={Boolean(preview) && !busy} onLock={hangItUp} label={busy && preview ? "Hanging it up…" : "Hang it up"} />
        </>
      )}
    </div>
  );
}

function Frame({ image, label, tone, delay = 0 }: { image: string; label: string; tone: Seat; delay?: number }) {
  return (
    <figure className="animate-pop-in" style={{ animationDelay: `${delay}ms` }}>
      <div
        className={`rounded-[6px] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.45)] ${
          tone === "aanavee" ? "rotate-1 bg-[linear-gradient(135deg,#ffd6de,#f3a9b9)]" : "-rotate-1 bg-[linear-gradient(135deg,#ffe7bf,#e8bb78)]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from the phone, not optimisable assets */}
        <img src={image} alt={label} className="block max-h-[70svh] w-full rounded-[2px] bg-white object-contain" />
      </div>
      <figcaption className="mt-3 text-center font-hand text-2xl text-[#fff1e6]/85">{label}</figcaption>
    </figure>
  );
}

function PortraitReveal({ ctx, step }: { ctx: StepContext; step: PortraitStepData }) {
  const [portraits, setPortraits] = useState<Record<Seat, Portrait | null> | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const byVik = portraits?.vik?.image;
  const byAanavee = portraits?.aanavee?.image;
  const ready = Boolean(byVik && byAanavee);
  const { round } = ctx;

  useEffect(() => {
    if (ready) return;
    let stopped = false;
    let timer: number | undefined;
    const load = async () => {
      try {
        const response = await fetch("/api/together/portrait", { cache: "no-store" });
        const body = (await response.json()) as { portraits?: Record<Seat, Portrait | null> };
        const { vik, aanavee } = body.portraits ?? { vik: null, aanavee: null };
        if (!stopped && vik?.image && aanavee?.image && vik.round === round && aanavee.round === round) {
          setPortraits({ vik, aanavee });
          return;
        }
      } catch {
        // Keep trying; the other phone may still be uploading.
      }
      if (!stopped) timer = window.setTimeout(load, 1500);
    };
    void load();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [ready, round]);

  return (
    <div className="flex flex-col gap-8">
      {ready ? <Confetti /> : null}
      <StepIntro title={step.title} prompt={ready ? "Hold them up next to each other's faces. Compare. Be kind." : undefined} />
      {byVik && byAanavee ? (
        <div className="space-y-10 px-2">
          <Frame image={byAanavee} label={`Vik, as painted by ${ctx.seat === "aanavee" ? "you" : "Aanavee"}`} tone="aanavee" />
          <Frame image={byVik} label={`Aanavee, as painted by ${ctx.seat === "vik" ? "you" : "Vik"}`} tone="vik" delay={350} />
          <p className="text-center font-hand text-[1.9rem] leading-tight text-[#ffcf8a]">Seven months in, and this is how well we know each other’s faces ♥</p>
        </div>
      ) : (
        <p className="pt-10 text-center font-hand text-3xl text-[#fff1e6]/70">Unveiling…</p>
      )}

      <div className="flex flex-col items-center gap-4 pb-4">
        <Link
          href="/memories/seven-months"
          className="w-full rounded-full border border-[#ffcf8a]/50 px-6 py-4 text-center font-display text-xl italic text-[#ffcf8a] transition active:scale-[0.98]"
        >
          Our seven months page
        </Link>
        {confirmRestart ? (
          <p className="text-center font-sans text-sm text-[#fff1e6]/70">
            Start a fresh game on both phones?{" "}
            <button type="button" onClick={ctx.restart} className="text-[#ffcf8a] underline underline-offset-4">
              yes, again
            </button>{" "}
            ·{" "}
            <button type="button" onClick={() => setConfirmRestart(false)} className="underline underline-offset-4">
              keep this one
            </button>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRestart(true)}
            className="font-sans text-xs uppercase tracking-[0.3em] text-[#fff1e6]/45 underline underline-offset-4"
          >
            play again
          </button>
        )}
      </div>
    </div>
  );
}
