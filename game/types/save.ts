import type { Rank, TrialId } from "./game";

export interface TrialStats {
  accuracy: number;
  maxCombo: number;
  maxStreak: number;
  perfectHits: number;
  correctMixtures: number;
  mistakes: number;
  totalAttempts: number;
}

export interface SaveData {
  playerName: string;
  introSeen: boolean;
  openingSeen: boolean;
  followIntroSeen: boolean;
  endingSeen: boolean;
  completedTrials: TrialId[];
  unlockedTrials: TrialId[];
  revealedGifts: TrialId[];
  guidedGiftIndex: number;
  worldAwakeningLevel: number;
  bestScores: Record<TrialId, number>;
  bestRanks: Partial<Record<TrialId, Rank>>;
  trialStats: Record<TrialId, TrialStats>;
}

export interface TrialProgressUpdate {
  score: number;
  rank: Rank;
  stats: Partial<TrialStats>;
}
