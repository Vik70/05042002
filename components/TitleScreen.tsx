"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "@/lib/constants";

export function TitleScreen() {
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHasProgress(Boolean(stored));
  }, []);

  const handleContinue = () => {
    router.push("/game");
  };

  const handleStartFresh = () => {
    const confirmed = window.confirm(
      "Start fresh? This will erase the saved shrine progress in this browser and begin again from the opening.",
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setHasProgress(false);
    router.push("/game");
  };

  return (
    <main className="relative flex min-h-screen items-start justify-center overflow-y-auto overflow-x-hidden px-4 py-6 pt-safe pb-safe md:items-center md:px-6 md:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,10,26,0.06),transparent_42%),linear-gradient(180deg,rgba(4,4,10,0.08),rgba(4,4,10,0.18))]" />

      <div className="moonlit-frame-soft relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[36px] border border-white/10 px-5 py-8 text-center [@media(max-height:500px)]:px-8 [@media(max-height:500px)]:py-6 md:px-14 md:py-14">
        <div className="flex flex-col gap-8 [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-8">
          <div>
            <div className="relative mx-auto mb-6 h-20 w-20 overflow-hidden rounded-full border border-lantern-gold/30 bg-lantern-gold/10 shadow-[0_0_40px_rgba(245,197,66,0.18)] md:h-24 md:w-24">
              <Image
                src="/images/av.png"
                alt="Aanavee portrait"
                fill
                priority
                sizes="96px"
                className="object-cover"
              />
            </div>

            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-sakura/80">
              A guided moonlit shrine journey
            </p>
            <h1 className="glow-text text-3xl font-semibold tracking-wide text-paper-cream sm:text-4xl md:text-7xl">
              Aanavee
            </h1>
            <p className="mt-3 text-base italic text-paper-cream/80 sm:text-lg md:text-2xl">
              The Four Gifts
            </p>
          </div>

          <div>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-paper-cream/78 sm:text-base md:text-lg md:leading-8">
              Guided by Simba, a warm-hearted spirit cat, the shrine wakes to reveal
              four gifts that have always belonged to Aanavee: precision, flow, insight, and voice.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 md:mt-12">
              {hasProgress ? (
                <>
                  <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full rounded-full border border-lantern-gold/60 bg-lantern-gold px-8 py-3 text-base font-semibold text-text-ink transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(245,197,66,0.28)] sm:w-auto sm:text-lg"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={handleStartFresh}
                      className="w-full rounded-full border border-white/18 bg-black/18 px-8 py-3 text-base font-semibold text-paper-cream transition hover:scale-[1.02] hover:bg-white/8 sm:w-auto sm:text-lg"
                    >
                      Start Fresh
                    </button>
                  </div>

                  <p className="text-sm text-paper-cream/60">
                    Start Fresh clears this browser&apos;s saved shrine progress and begins
                    from the opening.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full rounded-full border border-lantern-gold/60 bg-lantern-gold px-8 py-3 text-base font-semibold text-text-ink transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(245,197,66,0.28)] sm:w-auto sm:text-lg"
                >
                  Enter the Shrine
                </button>
              )}

              <p className="text-sm text-paper-cream/60">Progress saves locally in this browser.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
