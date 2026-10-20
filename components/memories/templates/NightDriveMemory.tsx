"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConstellationGame } from "@/components/memories/games/ConstellationGame";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { BackHome, MemoryPager, Story, seeded, type MemoryTemplateProps } from "@/components/memories/shared";
import { asList, asText, formatMemoryDate, formatShortDate } from "@/lib/memories/format";
import { startWaves, type AmbientHandle } from "@/lib/sfx";

function Waves({ className }: { className?: string }) {
  const wave = "M0 40 C 150 10 300 70 450 40 S 750 10 900 40 S 1200 70 1350 40 S 1650 10 1800 40 V 120 H 0 Z";
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden ${className ?? ""}`}>
      {[
        { fill: "#0f2a4d", duration: 28, opacity: 0.9, offset: 0 },
        { fill: "#13365f", duration: 19, opacity: 0.85, offset: 18 },
        { fill: "#0a1d38", duration: 13, opacity: 1, offset: 40 },
      ].map((layer, index) => (
        <svg
          key={index}
          viewBox="0 0 1800 120"
          preserveAspectRatio="none"
          className="absolute h-24 w-[200%]"
          style={{ animation: `waveSlide ${layer.duration}s linear infinite`, opacity: layer.opacity, bottom: -layer.offset }}
        >
          <path d={wave} fill={layer.fill} />
          <path d={wave} fill="none" stroke="#9fd3ff" strokeOpacity="0.18" strokeWidth="2" />
        </svg>
      ))}
    </div>
  );
}

function Radio({ song }: { song: string }) {
  const [playing, setPlaying] = useState(false);
  const handle = useRef<AmbientHandle | null>(null);

  useEffect(() => () => handle.current?.stop(), []);

  const toggle = () => {
    if (handle.current) {
      handle.current.stop();
      handle.current = null;
      setPlaying(false);
      return;
    }
    handle.current = startWaves();
    setPlaying(Boolean(handle.current));
  };

  const label = song ? `NOW PLAYING · ${song} · ` : "NOW PLAYING · OUR PLAYLIST · WAVES ON THE SHORE · ";

  return (
    <div className="mx-auto w-full max-w-xl rounded-[26px] border border-white/10 bg-gradient-to-b from-[#1b1f2b] to-[#0d1017] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-[#0f3b3a] bg-[#071a1a] px-3 py-2 shadow-[inset_0_0_18px_rgba(0,0,0,0.8)]">
          <div className="flex w-max animate-[waveSlide_14s_linear_infinite] whitespace-nowrap font-lcd text-2xl text-[#7fffd9] [text-shadow:0_0_8px_rgba(127,255,217,0.7)]">
            <span className="pr-8">{label.repeat(2)}</span>
            <span className="pr-8">{label.repeat(2)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-b from-[#3a3f4d] to-[#1a1d25] font-lcd text-lg text-[#7fffd9] shadow-[0_4px_10px_rgba(0,0,0,0.6)] transition active:scale-95"
        >
          {playing ? "■" : "▶"}
        </button>
      </div>
      <p className="mt-3 text-center font-lcd text-sm uppercase tracking-[0.3em] text-white/40">
        {playing ? "the sea, turned up" : "press play for the sea"}
      </p>
    </div>
  );
}

export function NightDriveMemory({ memory, photos, previous, next }: MemoryTemplateProps) {
  const stars = useMemo(() => {
    const random = seeded(1105);
    return Array.from({ length: 140 }, () => ({
      left: random() * 100,
      top: random() * 70,
      size: random() < 0.85 ? 1 + random() * 1.2 : 2.4,
      duration: 2 + random() * 4,
      delay: random() * 4,
    }));
  }, []);

  const notes = asList(memory.extras.starNotes);
  const finale = asText(memory.extras.finale, "The sky remembers this one too.");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-[#e8eeff]">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(180deg,#02040d_0%,#071330_55%,#0d2448_100%)] px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {stars.map((star, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              boxShadow: star.size > 2 ? "0 0 6px #cfe6ff" : undefined,
            }}
          />
        ))}
        <span className="absolute right-[18%] top-[14%] h-px w-40 origin-right bg-gradient-to-l from-white to-transparent motion-reduce:hidden" style={{ animation: "shootingStar 7s ease-out 2s infinite" }} />
        <span className="absolute right-[8%] top-[9%] h-16 w-16 rounded-full bg-[#f4f1e6] shadow-[0_0_60px_20px_rgba(244,241,230,0.18)] md:h-24 md:w-24" />

        <BackHome className="relative z-10 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-sm text-white/70 backdrop-blur transition hover:bg-white/10" />

        <div className="relative z-10 mx-auto my-auto flex max-w-3xl flex-col items-center pb-40 text-center">
          <p className="font-lcd text-xl tracking-[0.3em] text-[#7fffd9] [text-shadow:0_0_10px_rgba(127,255,217,0.6)]">
            {formatShortDate(memory.startDate)} · late
          </p>
          <h1 className="mt-4 font-poem text-6xl font-medium italic leading-[0.95] md:text-8xl">{memory.title}</h1>
          {memory.subtitle ? <p className="mt-5 font-poem text-2xl text-[#b9c8ee] md:text-3xl">{memory.subtitle}</p> : null}
          <p className="mt-6 font-sans text-xs uppercase tracking-[0.35em] text-white/50">{memory.location}</p>
        </div>

        {/* Road headlights sweeping the dark */}
        <div className="pointer-events-none absolute bottom-24 left-1/2 h-40 w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,236,190,0.12),transparent_60%)]" />
        <Waves />
      </section>

      <section className="relative bg-[#0a1d38] px-5 py-20">
        <div className="mx-auto max-w-2xl space-y-6 text-center font-poem text-2xl leading-relaxed text-[#dbe4ff] md:text-3xl">
          <Story text={memory.story} />
        </div>
        <div className="mt-14">
          <Radio song={memory.song} />
        </div>
      </section>

      <section className="relative bg-gradient-to-b from-[#0a1d38] to-[#050816] px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-lcd text-lg uppercase tracking-[0.4em] text-[#9fd3ff]/70">the game</p>
          <h2 className="mb-10 mt-2 text-center font-poem text-4xl italic md:text-5xl">Join the stars</h2>
          <ConstellationGame notes={notes} finale={finale} />
        </div>
      </section>

      <section className="bg-[#050816] pb-16 pt-6">
        <h2 className="mb-8 text-center font-poem text-3xl italic text-[#dbe4ff]">The roll from that night</h2>
        <PhotoGallery
          photos={photos}
          albumUrl={memory.albumUrl}
          variant="film"
          linkClassName="rounded-full border border-[#9fd3ff]/40 px-5 py-2 font-lcd text-lg uppercase tracking-widest text-[#9fd3ff] transition hover:bg-[#9fd3ff]/10"
          emptyText="Still developing…"
          emptyClassName="font-lcd text-xl uppercase tracking-widest text-[#9fd3ff]/50"
        />
        <p className="mt-10 text-center font-sans text-xs uppercase tracking-[0.3em] text-white/35">{formatMemoryDate(memory.startDate, memory.endDate)}</p>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-10 max-w-4xl px-5"
          linkClassName="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-poem text-xl italic text-[#dbe4ff] transition hover:border-[#9fd3ff]/40"
        />
      </section>
    </div>
  );
}
