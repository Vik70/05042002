"use client";

import { ResultsSequence } from "@/components/ResultsSequence";
import type { TrialResult } from "@/game/types/game";

export function ResultsCard({
  result,
  onContinue,
}: {
  result: TrialResult;
  onContinue: () => void;
}) {
  return <ResultsSequence result={result} onContinue={onContinue} />;
}
