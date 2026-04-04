import { HUB_AMBIENT_LINES, HUB_COPY } from "@/game/data/dialogue";
import { TRIAL_DEFINITIONS } from "@/game/data/trials";
import { HUB_GATE_POSITIONS } from "@/lib/constants";
import { pickRandom } from "@/lib/utils";
import { TRIAL_IDS } from "@/game/types/game";
import type { HubOverlayState } from "@/game/types/game";
import type { SaveData } from "@/game/types/save";

export class ProgressionSystem {
  getAwakeningLevel(save: SaveData): number {
    return Math.min(
      TRIAL_IDS.length,
      Math.max(save.worldAwakeningLevel, save.revealedGifts.length, save.completedTrials.length),
    );
  }

  getShrineWarmth(save: SaveData): number {
    return Math.min(1, 0.18 + (this.getAwakeningLevel(save) / TRIAL_IDS.length) * 0.82);
  }

  isEndingUnlocked(save: SaveData): boolean {
    return this.getAwakeningLevel(save) >= TRIAL_IDS.length;
  }

  getNextGiftId(save: SaveData) {
    const awakeningLevel = this.getAwakeningLevel(save);

    if (awakeningLevel >= TRIAL_IDS.length) {
      return undefined;
    }

    return TRIAL_IDS[awakeningLevel];
  }

  getHubState(save: SaveData): HubOverlayState {
    const awakeningLevel = this.getAwakeningLevel(save);
    const nextGiftId = this.getNextGiftId(save);
    const hubCopy = HUB_COPY[Math.min(awakeningLevel, HUB_COPY.length - 1)];

    return {
      visible: true,
      title: "Aanavee: The Seven Gifts",
      subtitle: hubCopy.subtitle,
      ambientLine: pickRandom(HUB_AMBIENT_LINES[Math.min(awakeningLevel, HUB_AMBIENT_LINES.length - 1)]),
      simbaPrompt: hubCopy.simbaPrompt,
      currentObjective: hubCopy.currentObjective,
      awakeningText: hubCopy.awakeningText,
      endingUnlocked: this.isEndingUnlocked(save),
      trials: Object.values(TRIAL_DEFINITIONS).map((trial) => ({
        id: trial.id,
        giftName: trial.giftName,
        title: trial.title,
        subtitle: trial.subtitle,
        quality: trial.quality,
        unlocked: save.unlockedTrials.includes(trial.id),
        completed: save.completedTrials.includes(trial.id),
        bestScore: save.bestScores[trial.id],
        bestRank: save.bestRanks[trial.id],
        sequenceLabel:
          trial.giftNumber === 1
            ? "First Gift"
            : trial.giftNumber === 2
              ? "Second Gift"
              : trial.giftNumber === 3
                ? "Third Gift"
                : "Fourth Gift",
        statusLabel: save.completedTrials.includes(trial.id)
          ? "Revealed"
          : save.unlockedTrials.includes(trial.id)
            ? nextGiftId === trial.id
              ? "Simba is waiting here"
              : "Ready"
            : "Sleeping",
        recommended: nextGiftId === trial.id,
        xPct: HUB_GATE_POSITIONS[trial.id].xPct,
        yPct: HUB_GATE_POSITIONS[trial.id].yPct,
      })),
    };
  }
}
