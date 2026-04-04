export const SCENE_IDS = [
  "title",
  "intro",
  "followSimba",
  "hub",
  "marksman",
  "rally",
  "apothecary",
  "voice",
  "ending",
] as const;

export const TRIAL_IDS = ["marksman", "rally", "apothecary", "voice"] as const;

export const RANKS = ["bronze", "silver", "gold", "spirit", "mythic"] as const;

export type SceneId = (typeof SCENE_IDS)[number];
export type TrialId = (typeof TRIAL_IDS)[number];
export type Rank = (typeof RANKS)[number];

export interface TrialDefinition {
  id: TrialId;
  giftNumber: number;
  giftName: string;
  title: string;
  subtitle: string;
  quality: string;
  giftMeaning: string;
  simbaValueTheme: string;
  awakeningSummary: string;
  description: string;
  accentColor: number;
  ambientColor: number;
  statLabel: string;
  controlsHint: string;
  controlsHintTouch: string;
  instructions: string[];
  demoObjective: string;
  objectiveTitle: string;
  objectiveText: string;
  tutorialTitle: string;
  tutorialText: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

export interface DialogueState {
  visible: boolean;
  lines: DialogueLine[];
  index: number;
  canSkip: boolean;
}

export interface ResultMetric {
  label: string;
  value: string;
}

export interface TrialResult {
  trialId: TrialId;
  title: string;
  subtitle: string;
  score: number;
  rank: Rank;
  quality: string;
  giftName: string;
  giftSummary: string;
  giftMeaning: string;
  simbaValueTheme: string;
  awakeningSummary: string;
  simbaLine: string;
  awakeningText: string;
  simbaReflection: DialogueLine[];
  heroStat: ResultMetric;
  metrics: ResultMetric[];
  ctaLabel: string;
}

export interface ResultsState {
  visible: boolean;
  result: TrialResult | null;
}

export interface HubTrialCard {
  id: TrialId;
  giftName: string;
  title: string;
  subtitle: string;
  quality: string;
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  bestRank?: Rank;
  sequenceLabel: string;
  statusLabel: string;
  recommended: boolean;
  xPct: number;
  yPct: number;
}

export interface HubOverlayState {
  visible: boolean;
  title: string;
  subtitle: string;
  ambientLine: string;
  simbaPrompt: string;
  currentObjective: string;
  awakeningText: string;
  trials: HubTrialCard[];
  endingUnlocked: boolean;
}

export interface GuidanceState {
  visible: boolean;
  objectiveTitle: string;
  objectiveText: string;
  simbaPrompt: string;
  controlsHint: string;
  tutorialTitle: string;
  tutorialText: string;
}

export interface GiftPrepState {
  visible: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  simbaLine: string;
  instructions: string[];
  controlsHint: string;
  focusLabel: string;
  focusText: string;
  primaryLabel: string;
}

export interface CreditsState {
  visible: boolean;
  title: string;
  message: string;
}

export interface FadeState {
  visible: boolean;
  mode: "in" | "out";
}

export interface UIState {
  sceneId: SceneId;
  dialogue: DialogueState;
  results: ResultsState;
  hub: HubOverlayState;
  guidance: GuidanceState;
  giftPrep: GiftPrepState;
  credits: CreditsState;
  fade: FadeState;
}

export interface ScenePayloadMap {
  title: undefined;
  intro: undefined;
  followSimba: undefined;
  hub: undefined;
  marksman: undefined;
  rally: undefined;
  apothecary: undefined;
  voice: undefined;
  ending: undefined;
}

export type ScenePayload<T extends SceneId> = ScenePayloadMap[T];

export interface GameEventMap {
  "ui:update": UIState;
  "save:update": import("./save").SaveData;
  "scene:change": { sceneId: SceneId };
  "trial:start": { trialId: TrialId };
  "trial:complete": TrialResult;
}
