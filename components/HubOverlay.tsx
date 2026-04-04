"use client";

import clsx from "clsx";
import { RankBadge } from "@/components/RankBadge";
import { SimbaAvatar } from "@/components/SimbaAvatar";
import type { HubOverlayState, TrialId } from "@/game/types/game";
import { formatScore } from "@/lib/utils";

interface HubOverlayProps {
  hub: HubOverlayState;
  onSelectTrial: (trialId: TrialId) => void;
  onOpenEnding: () => void;
}

export function HubOverlay({ hub, onSelectTrial, onOpenEnding }: HubOverlayProps) {
  if (!hub.visible) {
    return null;
  }

  const orderedTrials = [...hub.trials].sort((left, right) => left.xPct - right.xPct);
  const recommendedTrial = orderedTrials.find((trial) => trial.recommended);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="flex h-full flex-col overflow-y-auto p-3 pt-12 pb-safe md:p-6 md:pt-20">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,420px)_1fr_minmax(0,360px)] md:items-start md:gap-6">
          <div className="pointer-events-auto rounded-[28px] border border-white/10 bg-black/18 px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-md md:px-5 md:py-5">
            <div className="flex items-center gap-3">
              <SimbaAvatar className="h-11 w-11 shrink-0 md:h-12 md:w-12" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-sakura/80">
                  Guided by Simba
                </p>
                <h2 className="mt-1 text-xl font-semibold text-paper-cream md:text-2xl">
                  {hub.title}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-paper-cream/72 md:text-base">{hub.subtitle}</p>

            <div className="mt-4 rounded-[22px] border border-lantern-gold/18 bg-lantern-gold/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <SimbaAvatar className="h-10 w-10 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-lantern-gold/92">
                    Simba&apos;s Next Step
                  </p>
                  <p className="mt-1 text-sm italic leading-6 text-lantern-gold/88">
                    {hub.simbaPrompt}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto rounded-[28px] border border-white/10 bg-black/18 px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-md md:col-start-3 md:px-5 md:py-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sakura/80">
              Current Objective
            </p>
            {recommendedTrial ? (
              <p className="mt-3 inline-flex rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-lantern-gold/92">
                Next Path: {recommendedTrial.giftName}
              </p>
            ) : null}
            <p className="mt-3 text-lg font-semibold leading-7 text-paper-cream md:text-xl md:leading-8">
              {hub.currentObjective}
            </p>
            <p className="mt-4 text-sm leading-7 text-paper-cream/72">{hub.awakeningText}</p>
          </div>
        </div>

        <div className="relative mt-4 md:mt-auto md:pt-6">
          <div className="absolute inset-x-0 bottom-0 h-64 rounded-[32px] bg-[linear-gradient(180deg,transparent,rgba(4,4,10,0.14)_18%,rgba(4,4,10,0.4)_100%)]" />

          <div className="pointer-events-auto relative rounded-[30px] border border-white/10 bg-black/18 px-4 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-md md:px-6 md:py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-sakura/80">
                  Shrine Gifts
                </p>
                <p className="mt-2 text-sm leading-7 text-paper-cream/72">
                  Follow the highlighted path below, or revisit any awakened gift. Simba will keep nudging the shrine&apos;s next step.
                </p>
              </div>

              {hub.endingUnlocked ? (
                <button
                  type="button"
                  onClick={onOpenEnding}
                  className="w-full rounded-full border border-lantern-gold/60 bg-lantern-gold/90 px-5 py-3 text-sm font-semibold text-text-ink shadow-[0_0_36px_rgba(245,197,66,0.22)] transition hover:scale-[1.02] md:w-auto md:px-6"
                >
                  Step Into the Inner Shrine
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:mt-5 md:grid-cols-4 md:gap-4">
              {orderedTrials.map((trial) => (
                <button
                  key={trial.id}
                  type="button"
                  onClick={() => onSelectTrial(trial.id)}
                  disabled={!trial.unlocked}
                  className={clsx(
                    "flex min-h-[176px] flex-col rounded-[24px] border px-3 py-3 text-left shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 md:min-h-0 md:px-4 md:py-4",
                    trial.recommended
                      ? "border-lantern-gold/70 bg-lantern-gold/12 shadow-[0_0_40px_rgba(245,197,66,0.16)]"
                      : "border-white/10 bg-black/18",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-sakura/75">
                        {trial.sequenceLabel}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-paper-cream md:text-2xl">
                        {trial.giftName}
                      </h3>
                      <p className="mt-1 text-sm italic text-paper-cream/62">{trial.title}</p>
                    </div>
                    {trial.bestRank ? (
                      <RankBadge rank={trial.bestRank} className="px-2 py-1 text-[10px]" />
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-paper-cream/72">{trial.subtitle}</p>

                  {trial.recommended ? (
                    <div className="mt-4 rounded-[18px] border border-lantern-gold/30 bg-lantern-gold/14 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-lantern-gold/95">
                      Start Here
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5 text-sm text-paper-cream/68">
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <span>{trial.statusLabel}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span>Best</span>
                      <span>{trial.bestScore > 0 ? formatScore(trial.bestScore) : "--"}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 hidden items-center gap-3 rounded-full border border-white/10 bg-black/16 px-4 py-3 text-sm italic text-paper-cream/76 md:flex">
              <SimbaAvatar className="h-10 w-10 shrink-0" />
              <span>{hub.ambientLine}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
