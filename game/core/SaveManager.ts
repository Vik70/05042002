import { RANK_ORDER } from "@/game/data/ranks";
import { STORAGE_KEY } from "@/lib/constants";
import { TRIAL_IDS, type Rank, type TrialId } from "@/game/types/game";
import type { SaveData, TrialProgressUpdate, TrialStats } from "@/game/types/save";

const DEFAULT_TRIAL_STATS = (): TrialStats => ({
  accuracy: 0,
  maxCombo: 0,
  maxStreak: 0,
  perfectHits: 0,
  correctMixtures: 0,
  mistakes: 0,
  totalAttempts: 0,
});

const createTrialRecord = <T>(builder: (trialId: TrialId) => T): Record<TrialId, T> =>
  Object.fromEntries(TRIAL_IDS.map((trialId) => [trialId, builder(trialId)])) as Record<TrialId, T>;

const computeUnlockedTrials = (
  completedTrials: TrialId[],
  endingSeen: boolean,
): TrialId[] => {
  if (endingSeen || completedTrials.length >= TRIAL_IDS.length) {
    return [...TRIAL_IDS];
  }

  const unlockedCount = Math.min(TRIAL_IDS.length, completedTrials.length + 1);
  const unlocked = new Set<TrialId>(TRIAL_IDS.slice(0, unlockedCount));
  completedTrials.forEach((trialId) => {
    unlocked.add(trialId);
  });

  return TRIAL_IDS.filter((trialId) => unlocked.has(trialId));
};

export const createDefaultSaveData = (): SaveData => ({
  playerName: "Aanavee",
  introSeen: false,
  openingSeen: false,
  followIntroSeen: false,
  endingSeen: false,
  completedTrials: [],
  unlockedTrials: [TRIAL_IDS[0]],
  revealedGifts: [],
  guidedGiftIndex: 0,
  worldAwakeningLevel: 0,
  bestScores: createTrialRecord(() => 0),
  bestRanks: {},
  trialStats: createTrialRecord(() => DEFAULT_TRIAL_STATS()),
});

const safeClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isRank = (value: unknown): value is Rank =>
  typeof value === "string" && RANK_ORDER.includes(value as Rank);

const isTrialId = (value: unknown): value is TrialId =>
  typeof value === "string" && (TRIAL_IDS as readonly string[]).includes(value);

const rankIndex = (rank?: Rank): number => (rank ? RANK_ORDER.indexOf(rank) : -1);

const sanitizeSaveData = (value: unknown): SaveData => {
  const fallback = createDefaultSaveData();

  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const raw = value as Partial<SaveData>;
  const completedTrials = (raw.completedTrials ?? []).filter(isTrialId);
  const revealedGifts = (raw.revealedGifts ?? completedTrials).filter(isTrialId);
  const endingSeen = Boolean(raw.endingSeen);
  const worldAwakeningLevel = Math.min(
    TRIAL_IDS.length,
    Math.max(
      typeof raw.worldAwakeningLevel === "number" ? raw.worldAwakeningLevel : 0,
      revealedGifts.length,
      completedTrials.length,
    ),
  );
  const guidedGiftIndex = Math.min(
    TRIAL_IDS.length,
    Math.max(
      0,
      typeof raw.guidedGiftIndex === "number"
        ? Math.floor(raw.guidedGiftIndex)
        : completedTrials.length,
    ),
  );
  const unlockedTrials = computeUnlockedTrials(completedTrials, endingSeen);
  const playerName =
    typeof raw.playerName === "string" && raw.playerName.trim()
      ? raw.playerName === "Beloved Champion"
        ? "Aanavee"
        : raw.playerName
      : fallback.playerName;

  return {
    playerName,
    introSeen: Boolean(raw.introSeen || raw.openingSeen),
    openingSeen: Boolean(raw.openingSeen || raw.introSeen),
    followIntroSeen: Boolean(raw.followIntroSeen),
    endingSeen,
    completedTrials,
    unlockedTrials: unlockedTrials.length > 0 ? unlockedTrials : fallback.unlockedTrials,
    revealedGifts,
    guidedGiftIndex,
    worldAwakeningLevel,
    bestScores: createTrialRecord((trialId) => Math.max(0, raw.bestScores?.[trialId] ?? 0)),
    bestRanks: Object.fromEntries(
      TRIAL_IDS.flatMap((trialId) =>
        isRank(raw.bestRanks?.[trialId]) ? [[trialId, raw.bestRanks?.[trialId]]] : [],
      ),
    ) as Partial<Record<TrialId, Rank>>,
    trialStats: createTrialRecord((trialId) => ({
      ...fallback.trialStats[trialId],
      ...raw.trialStats?.[trialId],
    })),
  };
};

export class SaveManager {
  private data: SaveData = createDefaultSaveData();

  constructor(private readonly onUpdate?: (data: SaveData) => void) {}

  load(): SaveData {
    if (typeof window === "undefined") {
      return this.getData();
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      this.data = createDefaultSaveData();
      return this.getData();
    }

    try {
      this.data = sanitizeSaveData(JSON.parse(stored));
    } catch {
      this.data = createDefaultSaveData();
    }

    return this.getData();
  }

  getData(): SaveData {
    return safeClone(this.data);
  }

  save(): SaveData {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    this.onUpdate?.(this.getData());
    return this.getData();
  }

  update(mutator: (draft: SaveData) => void): SaveData {
    const draft = this.getData();
    mutator(draft);
    this.data = sanitizeSaveData(draft);
    return this.save();
  }

  reset(): SaveData {
    this.data = createDefaultSaveData();
    return this.save();
  }

  setIntroSeen(value = true): SaveData {
    return this.update((draft) => {
      draft.introSeen = value;
      draft.openingSeen = value;
    });
  }

  setOpeningSeen(value = true): SaveData {
    return this.update((draft) => {
      draft.introSeen = value;
      draft.openingSeen = value;
    });
  }

  setFollowIntroSeen(value = true): SaveData {
    return this.update((draft) => {
      draft.followIntroSeen = value;
    });
  }

  setEndingSeen(value = true): SaveData {
    return this.update((draft) => {
      draft.endingSeen = value;
      draft.unlockedTrials = [...TRIAL_IDS];
    });
  }

  recordTrialResult(trialId: TrialId, update: TrialProgressUpdate): SaveData {
    return this.update((draft) => {
      const stats = draft.trialStats[trialId];
      draft.bestScores[trialId] = Math.max(draft.bestScores[trialId], update.score);

      if (rankIndex(update.rank) > rankIndex(draft.bestRanks[trialId])) {
        draft.bestRanks[trialId] = update.rank;
      }

      if (!draft.completedTrials.includes(trialId)) {
        draft.completedTrials.push(trialId);
      }

      if (!draft.revealedGifts.includes(trialId)) {
        draft.revealedGifts.push(trialId);
      }

      draft.guidedGiftIndex = Math.min(
        TRIAL_IDS.length,
        Math.max(draft.guidedGiftIndex, TRIAL_IDS.indexOf(trialId) + 1),
      );
      draft.worldAwakeningLevel = Math.min(
        TRIAL_IDS.length,
        Math.max(draft.worldAwakeningLevel, draft.revealedGifts.length),
      );
      draft.unlockedTrials = computeUnlockedTrials(draft.completedTrials, draft.endingSeen);

      stats.totalAttempts += 1;
      stats.accuracy = Math.max(stats.accuracy, update.stats.accuracy ?? 0);
      stats.maxCombo = Math.max(stats.maxCombo, update.stats.maxCombo ?? 0);
      stats.maxStreak = Math.max(stats.maxStreak, update.stats.maxStreak ?? 0);
      stats.perfectHits = Math.max(stats.perfectHits, update.stats.perfectHits ?? 0);
      stats.correctMixtures = Math.max(
        stats.correctMixtures,
        update.stats.correctMixtures ?? 0,
      );
      stats.mistakes = Math.min(
        stats.mistakes === 0 ? Number.POSITIVE_INFINITY : stats.mistakes,
        update.stats.mistakes ?? Number.POSITIVE_INFINITY,
      );

      if (!Number.isFinite(stats.mistakes)) {
        stats.mistakes = 0;
      }
    });
  }
}
