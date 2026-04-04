import { RANK_ORDER, TRIAL_RANK_THRESHOLDS } from "@/game/data/ranks";
import type { Rank, TrialId } from "@/game/types/game";

export class ScoreSystem {
  private score = 0;

  constructor(private readonly trialId: TrialId) {}

  reset(): void {
    this.score = 0;
  }

  add(points: number): number {
    this.score += Math.max(0, Math.round(points));
    return this.score;
  }

  getScore(): number {
    return this.score;
  }

  getRank(): Rank {
    return ScoreSystem.rankForScore(this.trialId, this.score);
  }

  static rankForScore(trialId: TrialId, score: number): Rank {
    const thresholds = TRIAL_RANK_THRESHOLDS[trialId];
    let resolved: Rank = "bronze";

    RANK_ORDER.forEach((rank) => {
      if (score >= thresholds[rank]) {
        resolved = rank;
      }
    });

    return resolved;
  }
}
