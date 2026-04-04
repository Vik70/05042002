"use client";
import { RankBadge } from "@/components/RankBadge";
import type { TrialResult } from "@/game/types/game";
import { useIsTouchDevice } from "@/lib/hooks";
import { formatScore } from "@/lib/utils";

export function ScoreBrief({
  result,
  accentColor,
  onContinue,
}: {
  result: TrialResult;
  accentColor: string;
  onContinue: () => void;
}) {
  const isTouchDevice = useIsTouchDevice();

  return (
    <button
      type="button"
      onClick={onContinue}
      className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4 text-left md:p-6"
    >
      <div
        className="moonlit-frame max-h-[calc(100%-2rem)] w-full max-w-2xl overflow-y-auto rounded-[30px] border px-4 py-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:px-7 md:py-7"
        style={{ borderColor: `${accentColor}44` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-paper-cream/58">
              Awakening Settles
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-paper-cream md:text-4xl">
              {formatScore(result.score)}
            </h2>
            <p className="mt-2 text-sm text-paper-cream/64">Shrine record for {result.giftName}</p>
          </div>
          <RankBadge rank={result.rank} />
        </div>

        <div className="mt-6 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4 md:px-5 md:py-5">
          <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/55">
            Keepsake Detail
          </p>
          <p className="mt-3 text-lg text-paper-cream/72">{result.heroStat.label}</p>
          <p className="mt-2 text-3xl font-semibold text-paper-cream">{result.heroStat.value}</p>
        </div>

        <p className="mt-5 text-sm text-paper-cream/56">
          {isTouchDevice ? "Tap anywhere to continue." : "Click anywhere to continue."}
        </p>
      </div>
    </button>
  );
}
