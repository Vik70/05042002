import { RANK_ORDER, TRIAL_RANK_THRESHOLDS } from "@/game/data/ranks";
import { TRIAL_DEFINITIONS } from "@/game/data/trials";
import { TRIAL_IDS, type CreditsReflection, type Rank, type TrialId } from "@/game/types/game";
import type { SaveData } from "@/game/types/save";
import { formatScore } from "@/lib/utils";

const RANK_PROGRESS: Record<Rank, number> = {
  bronze: 0.2,
  silver: 0.4,
  gold: 0.6,
  spirit: 0.8,
  mythic: 1,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const formatRank = (rank: Rank): string => `${rank.slice(0, 1).toUpperCase()}${rank.slice(1)}`;

const joinGiftNames = (giftNames: string[]): string => {
  if (giftNames.length === 0) {
    return "the first small light that answered back";
  }

  if (giftNames.length === 1) {
    return giftNames[0];
  }

  if (giftNames.length === 2) {
    return `${giftNames[0]} and ${giftNames[1]}`;
  }

  return `${giftNames.slice(0, -1).join(", ")}, and ${giftNames[giftNames.length - 1]}`;
};

const resolveRank = (trialId: TrialId, score: number): Rank => {
  const thresholds = TRIAL_RANK_THRESHOLDS[trialId];
  let resolved: Rank = "bronze";

  RANK_ORDER.forEach((rank) => {
    if (score >= thresholds[rank]) {
      resolved = rank;
    }
  });

  return resolved;
};

const normalizeGiftScore = (trialId: TrialId, score: number): number => {
  if (score <= 0) {
    return 0;
  }

  const thresholds = TRIAL_RANK_THRESHOLDS[trialId];
  const anchors = [
    { score: 0, progress: 0 },
    { score: thresholds.bronze, progress: RANK_PROGRESS.bronze },
    { score: thresholds.silver, progress: RANK_PROGRESS.silver },
    { score: thresholds.gold, progress: RANK_PROGRESS.gold },
    { score: thresholds.spirit, progress: RANK_PROGRESS.spirit },
    { score: thresholds.mythic, progress: RANK_PROGRESS.mythic },
  ];

  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];

    if (score <= current.score) {
      const span = Math.max(1, current.score - previous.score);
      const localProgress = (score - previous.score) / span;

      return previous.progress + localProgress * (current.progress - previous.progress);
    }
  }

  const overflowRatio = (score - thresholds.mythic) / Math.max(1, thresholds.mythic);
  return clamp(1 + overflowRatio * 0.12, 0, 1.08);
};

const getGiftGlowLabel = (normalizedScore: number): string => {
  if (normalizedScore >= 0.95) {
    return "Unmistakable";
  }

  if (normalizedScore >= 0.75) {
    return "Radiant";
  }

  if (normalizedScore >= 0.55) {
    return "Steady light";
  }

  if (normalizedScore >= 0.3) {
    return "Gentle glow";
  }

  if (normalizedScore > 0) {
    return "Just waking";
  }

  return "Still sleeping";
};

const getResonanceValue = (averageScore: number): string => {
  if (averageScore >= 0.9) {
    return "Unmistakable light";
  }

  if (averageScore >= 0.75) {
    return "Open-hearted radiance";
  }

  if (averageScore >= 0.55) {
    return "Warm and certain";
  }

  if (averageScore >= 0.3) {
    return "A steady glow";
  }

  if (averageScore > 0) {
    return "A first shimmer";
  }

  return "Still waiting on the first lantern";
};

const buildResonanceSummary = (averageScore: number, highlightedGifts: string): string => {
  if (averageScore >= 0.85) {
    return `Every chamber answered brightly, and the clearest pull kept gathering around ${highlightedGifts}.`;
  }

  if (averageScore >= 0.65) {
    return `The shrine stayed warm from beginning to end, leaning closest toward ${highlightedGifts}.`;
  }

  if (averageScore >= 0.45) {
    return `The light built gently, then surely, especially around ${highlightedGifts}.`;
  }

  if (averageScore > 0) {
    return `Even the softer glows left a trace, and the first clear answers came through ${highlightedGifts}.`;
  }

  return "The shrine is still quiet, but it is listening.";
};

const buildSimbaReflection = (averageScore: number, highlightedGifts: string): string => {
  if (averageScore >= 0.8) {
    return `No little number was ever the point anyway. I just like that the brightest answers kept circling back to ${highlightedGifts}. That feels very, very you.`;
  }

  if (averageScore >= 0.5) {
    return `No little number was ever the point anyway. I just like that the shrine kept finding its way back to ${highlightedGifts}. That feels very, very you.`;
  }

  if (averageScore > 0) {
    return `No little number was ever the point anyway. I just like that even the softer lights still found their way to ${highlightedGifts}. That feels very, very you.`;
  }

  return "No little number was ever the point anyway. The shrine will know more once more lights have had time to wake.";
};

export function buildCreditsReflection(save: SaveData): CreditsReflection {
  const gifts = TRIAL_IDS.map((trialId) => {
    const definition = TRIAL_DEFINITIONS[trialId];
    const score = save.bestScores[trialId] ?? 0;
    const awakened = save.completedTrials.includes(trialId) || score > 0;
    const normalizedScore = awakened ? normalizeGiftScore(trialId, score) : 0;
    const rank = awakened ? save.bestRanks[trialId] ?? resolveRank(trialId, score) : null;

    return {
      trialId,
      giftName: definition.giftName,
      glowLabel: awakened ? getGiftGlowLabel(normalizedScore) : "Still sleeping",
      recordText:
        awakened && rank
          ? `${formatRank(rank)} · ${formatScore(score)} shrine record`
          : "Still sleeping",
      note: awakened
        ? definition.simbaValueTheme
        : "This chamber is still waiting for its first clear answer.",
      normalizedScore,
      rawScore: score,
    };
  });

  const averageScore =
    gifts.reduce((total, gift) => total + gift.normalizedScore, 0) / Math.max(1, gifts.length);
  const strongestGifts = [...gifts]
    .sort(
      (left, right) =>
        right.normalizedScore - left.normalizedScore || right.rawScore - left.rawScore,
    )
    .filter((gift) => gift.normalizedScore > 0)
    .slice(0, 2)
    .map((gift) => gift.giftName);
  const highlightedGifts = joinGiftNames(strongestGifts);

  return {
    heading: "The shrine kept this record of you",
    introText:
      "It kept the brightest answer from each gift that woke, then read the whole pattern back as one final little portrait.",
    resonanceLabel: "Shrine Resonance",
    resonanceValue: getResonanceValue(averageScore),
    resonanceSummary: buildResonanceSummary(averageScore, highlightedGifts),
    gifts: gifts.map((gift) => ({
      trialId: gift.trialId,
      giftName: gift.giftName,
      glowLabel: gift.glowLabel,
      recordText: gift.recordText,
      note: gift.note,
    })),
    simbaReflection: buildSimbaReflection(averageScore, highlightedGifts),
  };
}
