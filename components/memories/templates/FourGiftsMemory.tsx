"use client";

import { Howl } from "howler";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackgroundWallpaper } from "@/components/BackgroundWallpaper";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { BackHome, MemoryPager, Story, type MemoryTemplateProps } from "@/components/memories/shared";
import { formatMemoryDate, formatShortDate } from "@/lib/memories/format";
import { STORAGE_KEY } from "@/lib/constants";

const BEGIN_GAME_SFX_PATH = encodeURI("/audio/sfx/OS_IC2_SFX_Begin_Game.wav");
const PLAY_ROUTE = "/memories/four-gifts/play" as Route;

let beginGameSfx: Howl | null = null;

const playBeginGameSfx = () => {
  if (!beginGameSfx) {
    beginGameSfx = new Howl({ src: [BEGIN_GAME_SFX_PATH], volume: 0.16 });
  }
  beginGameSfx.stop();
  beginGameSfx.play();
};

export function FourGiftsMemory({ memory, photos, previous, next }: MemoryTemplateProps) {
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    setHasProgress(Boolean(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  const enter = () => {
    playBeginGameSfx();
    router.push(PLAY_ROUTE);
  };

  const startFresh = () => {
    if (!window.confirm("Start fresh? This erases the saved shrine progress in this browser and begins again from the opening.")) {
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setHasProgress(false);
    enter();
  };

  return (
    <div className="relative min-h-screen font-serif text-paper-cream">
      <BackgroundWallpaper />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-10 px-4 pb-24 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-6">
        <BackHome className="self-start rounded-full border border-white/12 bg-black/30 px-4 py-2 text-sm text-paper-cream/80 backdrop-blur transition hover:bg-black/50" />

        <section className="moonlit-frame-soft rounded-[36px] border border-white/10 px-5 py-10 text-center md:px-14 md:py-14">
          <div className="relative mx-auto mb-6 h-20 w-20 overflow-hidden rounded-full border border-lantern-gold/30 bg-lantern-gold/10 shadow-[0_0_40px_rgba(245,197,66,0.18)] md:h-24 md:w-24">
            <Image src="/images/av.png" alt="Aanavee portrait" fill priority sizes="96px" className="object-cover" />
          </div>
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-sakura/80">
            {formatShortDate(memory.startDate)} · {memory.location}
          </p>
          <h1 className="glow-text text-4xl font-semibold tracking-wide text-paper-cream md:text-7xl">{memory.title}</h1>
          {memory.subtitle ? <p className="mt-3 text-lg italic text-paper-cream/80 md:text-2xl">{memory.subtitle}</p> : null}

          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-base leading-8 text-paper-cream/80 md:text-lg">
            <Story text={memory.story} />
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={enter}
              className="w-full rounded-full border border-lantern-gold/60 bg-lantern-gold px-8 py-3 text-lg font-semibold text-text-ink transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(245,197,66,0.28)] sm:w-auto"
            >
              {hasProgress ? "Continue in the shrine" : "Enter the shrine"}
            </button>
            {hasProgress ? (
              <button
                type="button"
                onClick={startFresh}
                className="w-full rounded-full border border-white/18 bg-black/18 px-8 py-3 text-lg font-semibold text-paper-cream transition hover:scale-[1.02] hover:bg-white/8 sm:w-auto"
              >
                Start fresh
              </button>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-paper-cream/55">
            {formatMemoryDate(memory.startDate, memory.endDate)}. Progress saves in this browser.
          </p>
        </section>

        {memory.song ? (
          <p className="text-center text-sm uppercase tracking-[0.3em] text-sakura/80">
            ♪ <span className="normal-case tracking-normal text-paper-cream/85">{memory.song}</span>
          </p>
        ) : null}

        <section className="moonlit-frame-soft rounded-[32px] border border-white/10 p-5 md:p-8">
          <h2 className="mb-6 text-center text-sm uppercase tracking-[0.35em] text-lantern-gold/80">From that night</h2>
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="moonlit"
            linkClassName="rounded-full border border-lantern-gold/40 px-5 py-2 text-sm text-lantern-gold transition hover:bg-lantern-gold/10"
            emptyText="The shrine is keeping these safe for now."
            emptyClassName="text-sm italic text-paper-cream/60"
          />
        </section>

        <MemoryPager
          previous={previous}
          next={next}
          linkClassName="moonlit-frame-soft flex-1 rounded-2xl border border-white/10 px-5 py-4 text-paper-cream/85 transition hover:border-lantern-gold/40"
        />
      </div>
    </div>
  );
}
