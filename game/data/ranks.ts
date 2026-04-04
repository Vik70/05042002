import type { Rank, TrialId } from "@/game/types/game";

export const RANK_ORDER: Rank[] = ["bronze", "silver", "gold", "spirit", "mythic"];

export const TRIAL_RANK_THRESHOLDS: Record<TrialId, Record<Rank, number>> = {
  marksman: {
    bronze: 250,
    silver: 500,
    gold: 820,
    spirit: 1100,
    mythic: 1400,
  },
  rally: {
    bronze: 500,
    silver: 950,
    gold: 1450,
    spirit: 2000,
    mythic: 2550,
  },
  apothecary: {
    bronze: 550,
    silver: 1050,
    gold: 1600,
    spirit: 2150,
    mythic: 2700,
  },
  voice: {
    bronze: 500,
    silver: 980,
    gold: 1500,
    spirit: 2060,
    mythic: 2620,
  },
};
