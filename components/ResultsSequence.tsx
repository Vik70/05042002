"use client";

import { useEffect, useMemo, useState } from "react";
import { AwakeningReaction } from "@/components/AwakeningReaction";
import { GiftRevealCard } from "@/components/GiftRevealCard";
import { ScoreBrief } from "@/components/ScoreBrief";
import { SimbaDialoguePanel } from "@/components/SimbaDialoguePanel";
import { TRIAL_DEFINITIONS } from "@/game/data/trials";
import type { TrialResult } from "@/game/types/game";

type ResultsPhase = "awakening" | "score" | "reveal" | "simba";

const toCssHex = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

export function ResultsSequence({
  result,
  onContinue,
}: {
  result: TrialResult;
  onContinue: () => void;
}) {
  const [phase, setPhase] = useState<ResultsPhase>("awakening");

  useEffect(() => {
    setPhase("awakening");
  }, [result]);

  const accentColor = useMemo(
    () => toCssHex(TRIAL_DEFINITIONS[result.trialId].accentColor),
    [result.trialId],
  );

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      {phase === "awakening" ? (
        <AwakeningReaction
          giftName={result.giftName}
          awakeningText={result.awakeningText}
          accentColor={accentColor}
          onComplete={() => setPhase("score")}
        />
      ) : (
        <>
          <div
            className="absolute inset-0 bg-black/58 backdrop-blur-[2px]"
            style={{
              backgroundImage: `radial-gradient(circle at center, ${accentColor}18, transparent 42%)`,
            }}
          />

          {phase === "score" ? (
            <ScoreBrief
              result={result}
              accentColor={accentColor}
              onContinue={() => setPhase("reveal")}
            />
          ) : null}

          {phase === "reveal" ? (
            <GiftRevealCard
              result={result}
              accentColor={accentColor}
              onContinue={() => setPhase("simba")}
            />
          ) : null}

          {phase === "simba" ? (
            <SimbaDialoguePanel
              result={result}
              accentColor={accentColor}
              onContinue={onContinue}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
