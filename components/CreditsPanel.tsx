"use client";

import { SimbaAvatar } from "@/components/SimbaAvatar";
import type { CreditsReflection } from "@/game/types/game";

export function CreditsPanel({
  title,
  message,
  reflection,
  onClose,
}: {
  title: string;
  message: string;
  reflection: CreditsReflection | null;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-6">
      <div className="panel-paper flex max-h-[calc(100%-2rem)] w-full max-w-full flex-col rounded-[30px] border border-white/12 px-5 py-6 md:max-w-2xl md:px-8 md:py-10">
        <div className="flex items-center gap-3">
          <SimbaAvatar className="h-11 w-11 shrink-0 md:h-12 md:w-12" />
          <p className="text-xs uppercase tracking-[0.3em] text-lantern-red/80">
            From Simba
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-3 pb-safe">
          <h2 className="text-2xl font-semibold text-text-ink md:text-4xl">{title}</h2>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-text-ink/90 md:text-lg md:leading-9">
            {message}
          </p>

          {reflection ? (
            <section className="mt-8 rounded-[26px] border border-text-ink/10 bg-white/55 p-4 md:p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-lantern-red/80">
                {reflection.heading}
              </p>
              <p className="mt-3 text-sm leading-7 text-text-ink/76 md:text-base">
                {reflection.introText}
              </p>

              <div className="mt-4 rounded-[22px] border border-lantern-gold/22 bg-lantern-gold/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-lantern-red/80">
                  {reflection.resonanceLabel}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-text-ink md:text-2xl">
                  {reflection.resonanceValue}
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-ink/80 md:text-base">
                  {reflection.resonanceSummary}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {reflection.gifts.map((gift) => (
                  <div
                    key={gift.trialId}
                    className="rounded-[18px] border border-text-ink/10 bg-white/45 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-text-ink md:text-lg">
                          {gift.giftName}
                        </h3>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-text-ink/58">
                          {gift.recordText}
                        </p>
                      </div>
                      <span className="rounded-full border border-lantern-gold/20 bg-lantern-gold/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-ink/72 md:text-[11px]">
                        {gift.glowLabel}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-text-ink/78 md:text-[15px]">
                      {gift.note}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm italic leading-7 text-text-ink/82 md:text-base">
                {reflection.simbaReflection}
              </p>
            </section>
          ) : null}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-text-ink px-6 py-3 font-semibold text-paper-cream transition hover:scale-[1.02] sm:w-auto"
          >
            Back to the Shrine
          </button>
        </div>
      </div>
    </div>
  );
}
