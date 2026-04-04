import { Container, Graphics } from "pixi.js";
import { GIFT_REVEALS } from "@/game/data/dialogue";
import { TRIAL_DEFINITIONS, getTrialControlsHint } from "@/game/data/trials";
import { BaseScene } from "@/game/scenes/BaseScene";
import { ComboSystem } from "@/game/systems/ComboSystem";
import { EffectsSystem } from "@/game/systems/EffectsSystem";
import { ScoreSystem } from "@/game/systems/ScoreSystem";
import { PixiHUD } from "@/game/ui/PixiHUD";
import { clamp, formatScore, randomRange } from "@/lib/utils";

type VoiceNoteKind = "tap" | "hold";
type VoicePhase = "briefing" | "demo" | "ready" | "live";

interface VoicePattern {
  kind: VoiceNoteKind;
  laneIndex: number;
  spawnAt: number;
  travelDuration: number;
  sustainDuration: number;
}

interface VoiceNote extends VoicePattern {
  id: number;
  node: Graphics;
  age: number;
  holding: boolean;
  perfectHold: boolean;
  resolved: boolean;
}

interface ResonanceBurst {
  node: Graphics;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  tint: number;
  scale: number;
}

const VOICE_CENTER_X = 720;
const VOICE_CENTER_Y = 452;
const VOICE_OUTER_RADIUS = 390;
const VOICE_RING_RADIUS = 108;
const VOICE_INNER_RADIUS = 18;
const VOICE_HOLD_TRAIL = 126;
const VOICE_PERFECT_WINDOW = 0.09;
const VOICE_GOOD_WINDOW = 0.2;
const VOICE_LATE_WINDOW = 0.32;
const VOICE_DEMO_GOAL = 3;
const VOICE_LANES = [-2.14, -1.85, -1.57, -1.29, -1.0] as const;

export class VoiceScene extends BaseScene {
  readonly id = "voice" as const;

  private readonly trial = TRIAL_DEFINITIONS.voice;
  private readonly scoreSystem = new ScoreSystem("voice");
  private readonly comboSystem = new ComboSystem();
  private readonly hud = new PixiHUD(() => this.game.getVisibleBounds());
  private readonly petals = EffectsSystem.createPetalField(1440, 810, 20, 0xf5efe0);
  private readonly stageGlow = new Graphics();
  private readonly stageDetails = new Graphics();
  private readonly ring = new Graphics();
  private readonly noteLayer = new Container();
  private readonly burstLayer = new Container();

  private notes: VoiceNote[] = [];
  private bursts: ResonanceBurst[] = [];
  private patternQueue: VoicePattern[] = [];
  private nextPatternIndex = 0;
  private runClock = 0;
  private runDuration = 0;
  private remainingTime = 0;
  private perfectHits = 0;
  private successfulNotes = 0;
  private mistakes = 0;
  private practiceSuccesses = 0;
  private resonanceLevel = 0;
  private ended = false;
  private phaseState: VoicePhase = "briefing";
  private status = "The last chamber is listening for resonance.";
  private pointerHeld = false;
  private lastSpaceDown = false;
  private noteCounter = 0;
  private pulse = 0;
  private pendingDemoResetPrompt: string | null = null;

  private getControlsHint(): string {
    return getTrialControlsHint(this.trial, this.game.isMobile());
  }

  private getPerfectWindow(): number {
    return this.game.isMobile() ? 0.15 : VOICE_PERFECT_WINDOW;
  }

  private getGoodWindow(): number {
    return this.game.isMobile() ? 0.32 : VOICE_GOOD_WINDOW;
  }

  private getLateWindow(): number {
    return this.game.isMobile() ? 0.46 : VOICE_LATE_WINDOW;
  }

  private getRingRadius(): number {
    return VOICE_RING_RADIUS * (this.game.isMobile() ? 1.2 : 1);
  }

  async init(): Promise<void> {
    this.removeChildren();
    this.scoreSystem.reset();
    this.comboSystem.reset();
    this.clearNotes();
    this.clearBursts();
    this.patternQueue = [];
    this.nextPatternIndex = 0;
    this.runClock = 0;
    this.runDuration = 0;
    this.remainingTime = 0;
    this.perfectHits = 0;
    this.successfulNotes = 0;
    this.mistakes = 0;
    this.practiceSuccesses = 0;
    this.resonanceLevel = 0;
    this.ended = false;
    this.phaseState = "briefing";
    this.status = "The last chamber is listening for resonance.";
    this.pointerHeld = false;
    this.lastSpaceDown = false;
    this.noteCounter = 0;
    this.pulse = 0;
    this.pendingDemoResetPrompt = null;
    this.hud.setMobile(this.game.isMobile());

    const backdrop = this.createNightBackdrop(0.3);
    const stage = this.createVoiceStage();

    this.addChild(
      backdrop,
      stage,
      this.noteLayer,
      this.burstLayer,
      this.petals.container,
      this.hud,
    );
    this.addUpdater(this.petals.update);
    this.addUpdater((deltaMs) => this.updateBursts(deltaMs));
    this.addUpdater((deltaMs) => this.updateScene(deltaMs));

    this.on("pointerdown", () => {
      this.pointerHeld = true;
      this.handlePress();
    });
    this.on("pointerup", () => {
      this.pointerHeld = false;
      this.handleRelease();
    });
    this.on("pointerupoutside", () => {
      this.pointerHeld = false;
      this.handleRelease();
    });

    this.drawVoiceStage();
    this.refreshHud();
  }

  async enter(): Promise<void> {
    this.game.hideHubOverlay();
    this.game.clearGuidance();
    void this.runGiftFlow();
  }

  private async runGiftFlow(): Promise<void> {
    await this.game.showGiftPrep({
      eyebrow: `Gift ${this.trial.giftNumber}`,
      title: this.trial.title,
      subtitle: this.trial.subtitle,
      description: this.trial.description,
      simbaLine:
        "We'll warm up with one little phrase first. Three gentle notes, then the live resonance can open.",
      instructions: this.trial.instructions,
      controlsHint: this.getControlsHint(),
      focusLabel: "Demo first",
      focusText: this.trial.demoObjective,
      primaryLabel: "Start Demo",
    });

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.beginDemo();
  }

  private beginDemo(): void {
    this.phaseState = "demo";
    this.resetRunState();
    this.patternQueue = this.buildDemoPattern();
    this.runDuration = this.computeRunDuration(this.patternQueue);
    this.remainingTime = this.runDuration;
    this.status = "Practice the phrase first. Let each note open before you answer it.";
    this.game.showGuidance({
      objectiveTitle: `${this.trial.title} Demo`,
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: "Listen for the whole phrase. This one is about resonance, not rushing.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Practice phrase",
      tutorialText: "Three notes only: two taps and one hold so you can feel the phrasing.",
    });
    this.refreshHud();
  }

  private async completeDemo(): Promise<void> {
    if (this.phaseState !== "demo") {
      return;
    }

    this.phaseState = "ready";
    this.clearNotes();
    this.status = "The live resonance is ready now.";
    this.refreshHud();

    await this.game.showGiftPrep({
      eyebrow: "Demo Complete",
      title: this.trial.title,
      subtitle: "The real resonance is ready to bloom.",
      description:
        "You felt the shape of a phrase already. Now the chamber will answer with longer crescendos and brighter returns.",
      simbaLine: "There. That's the feeling. Now let the real phrases bloom.",
      instructions: this.trial.instructions,
      controlsHint: this.getControlsHint(),
      focusLabel: "Live run",
      focusText: "The live phrases and shrine record begin as soon as you continue.",
      primaryLabel: "Start Gift",
    });

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.beginLiveRun();
  }

  private beginLiveRun(): void {
    this.phaseState = "live";
    this.resetRunState();
    this.patternQueue = this.buildLivePattern();
    this.runDuration = this.computeRunDuration(this.patternQueue);
    this.remainingTime = this.runDuration;
    this.status = "Let each phrase open, then answer it with warmth.";
    this.game.showGuidance({
      objectiveTitle: this.trial.objectiveTitle,
      objectiveText: this.trial.objectiveText,
      simbaPrompt: "Stay centered. Answer the phrase, not just the individual notes.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Live run",
      tutorialText: "The phrases start gentle, then build into crescendos.",
    });
    this.refreshHud();
  }

  private resetRunState(): void {
    this.clearNotes();
    this.clearBursts();
    this.patternQueue = [];
    this.nextPatternIndex = 0;
    this.runClock = 0;
    this.runDuration = 0;
    this.remainingTime = 0;
    this.perfectHits = 0;
    this.successfulNotes = 0;
    this.mistakes = 0;
    this.practiceSuccesses = 0;
    this.resonanceLevel = 0;
    this.pointerHeld = false;
    this.lastSpaceDown = false;
    this.pendingDemoResetPrompt = null;
    this.scoreSystem.reset();
    this.comboSystem.reset();
    this.drawVoiceStage();
  }

  private clearNotes(): void {
    this.notes.forEach((note) => {
      if (note.node.parent) {
        note.node.parent.removeChild(note.node);
      }
    });
    this.notes = [];
    this.noteLayer.removeChildren();
  }

  private clearBursts(): void {
    this.bursts.forEach((burst) => {
      if (burst.node.parent) {
        burst.node.parent.removeChild(burst.node);
      }
    });
    this.bursts = [];
    this.burstLayer.removeChildren();
  }

  private getDemoObjectiveText(): string {
    return `Complete the practice phrase (${this.practiceSuccesses}/${VOICE_DEMO_GOAL} notes answered)`;
  }

  private createVoiceStage(): Container {
    const stage = new Container();

    const floor = new Graphics();
    floor.rect(0, 578, 1440, 232).fill({ color: 0x0b0d16, alpha: 0.96 });

    const dais = new Graphics();
    dais.ellipse(VOICE_CENTER_X, VOICE_CENTER_Y + 160, 290, 96).fill({
      color: 0x151827,
      alpha: 0.86,
    });
    dais.ellipse(VOICE_CENTER_X, VOICE_CENTER_Y + 160, 214, 68).stroke({
      color: 0xf5efe0,
      width: 2,
      alpha: 0.18,
    });

    stage.addChild(floor, this.stageGlow, this.stageDetails, dais, this.ring);
    return stage;
  }

  private buildDemoPattern(): VoicePattern[] {
    return [
      {
        kind: "tap",
        laneIndex: 2,
        spawnAt: 0.7,
        travelDuration: 1.75,
        sustainDuration: 0,
      },
      {
        kind: "tap",
        laneIndex: 1,
        spawnAt: 2.35,
        travelDuration: 1.75,
        sustainDuration: 0,
      },
      {
        kind: "hold",
        laneIndex: 2,
        spawnAt: 4,
        travelDuration: 1.8,
        sustainDuration: 0.78,
      },
    ];
  }

  private buildLivePattern(): VoicePattern[] {
    const phrases: Array<Array<{ laneIndex: number; kind: VoiceNoteKind }>> = [
      [
        { laneIndex: 2, kind: "tap" },
        { laneIndex: 1, kind: "tap" },
        { laneIndex: 3, kind: "tap" },
      ],
      [
        { laneIndex: 2, kind: "hold" },
        { laneIndex: 1, kind: "tap" },
        { laneIndex: 3, kind: "tap" },
      ],
      [
        { laneIndex: 0, kind: "tap" },
        { laneIndex: 2, kind: "tap" },
        { laneIndex: 4, kind: "tap" },
        { laneIndex: 2, kind: "hold" },
      ],
      [
        { laneIndex: 1, kind: "tap" },
        { laneIndex: 2, kind: "tap" },
        { laneIndex: 3, kind: "tap" },
        { laneIndex: 2, kind: "hold" },
      ],
      [
        { laneIndex: 0, kind: "tap" },
        { laneIndex: 1, kind: "tap" },
        { laneIndex: 2, kind: "tap" },
        { laneIndex: 3, kind: "tap" },
        { laneIndex: 4, kind: "hold" },
      ],
      [
        { laneIndex: 4, kind: "tap" },
        { laneIndex: 3, kind: "tap" },
        { laneIndex: 2, kind: "hold" },
        { laneIndex: 1, kind: "tap" },
        { laneIndex: 0, kind: "tap" },
      ],
    ];

    let spawnAt = 0.9;
    const patterns: VoicePattern[] = [];

    phrases.forEach((phrase, phraseIndex) => {
      const noteSpacing = Math.max(0.7, 0.98 - phraseIndex * 0.06);

      phrase.forEach((entry, entryIndex) => {
        patterns.push({
          kind: entry.kind,
          laneIndex: entry.laneIndex,
          spawnAt,
          travelDuration: entry.kind === "hold" ? 1.82 : 1.72,
          sustainDuration: entry.kind === "hold" ? 0.82 : 0,
        });
        spawnAt += noteSpacing - entryIndex * 0.02;
      });

      spawnAt += Math.max(1.55, 2.45 - phraseIndex * 0.16);
    });

    return patterns;
  }

  private computeRunDuration(patterns: VoicePattern[]): number {
    return patterns.reduce(
      (maxDuration, pattern) =>
        Math.max(maxDuration, pattern.spawnAt + pattern.travelDuration + pattern.sustainDuration + 0.65),
      0,
    );
  }

  private updateScene(deltaMs: number): void {
    if (this.ended || this.phaseState === "briefing" || this.phaseState === "ready") {
      return;
    }

    const deltaSeconds = deltaMs / 1000;
    this.runClock += deltaSeconds;
    this.remainingTime = Math.max(0, this.runDuration - this.runClock);
    this.pulse += deltaSeconds;
    this.drawVoiceStage();

    const spaceDown = this.game.input.isPressed("Space");
    if (spaceDown && !this.lastSpaceDown) {
      this.handlePress();
    }
    if (!spaceDown && this.lastSpaceDown) {
      this.handleRelease();
    }
    this.lastSpaceDown = spaceDown;

    while (
      this.nextPatternIndex < this.patternQueue.length &&
      this.runClock >= this.patternQueue[this.nextPatternIndex].spawnAt
    ) {
      this.spawnNote(this.patternQueue[this.nextPatternIndex]);
      this.nextPatternIndex += 1;
    }

    const nextNotes: VoiceNote[] = [];
    this.notes.forEach((note) => {
      if (note.resolved) {
        return;
      }

      note.age += deltaSeconds;
      this.drawNote(note);
      this.updateNoteState(note);

      if (!note.resolved) {
        nextNotes.push(note);
      }
    });
    this.notes = nextNotes;

    if (this.pendingDemoResetPrompt) {
      const prompt = this.pendingDemoResetPrompt;
      this.pendingDemoResetPrompt = null;
      this.restartDemoPhrase(prompt);
      return;
    }

    this.refreshHud();

    if (this.phaseState === "live") {
      const runComplete = this.nextPatternIndex >= this.patternQueue.length && this.notes.length === 0;
      if (this.remainingTime <= 0 || runComplete) {
        void this.finishTrial();
      }
    }
  }

  private updateBursts(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;
    const nextBursts: ResonanceBurst[] = [];

    this.bursts.forEach((burst) => {
      burst.life += deltaSeconds;
      const progress = clamp(burst.life / burst.maxLife, 0, 1);

      burst.node.clear();
      const radius = 18 + progress * 48 * burst.scale;
      const alpha = 1 - progress;

      burst.node.circle(burst.x, burst.y, radius * 0.45).fill({
        color: 0xf5efe0,
        alpha: alpha * 0.42,
      });
      burst.node.circle(burst.x, burst.y, radius).stroke({
        color: burst.tint,
        width: 2,
        alpha: alpha * 0.8,
      });

      for (let index = 0; index < 5; index += 1) {
        const angle = (Math.PI * 2 * index) / 5 + progress * 0.4;
        const innerX = burst.x + Math.cos(angle) * radius * 0.42;
        const innerY = burst.y + Math.sin(angle) * radius * 0.42;
        const outerX = burst.x + Math.cos(angle) * radius;
        const outerY = burst.y + Math.sin(angle) * radius;
        burst.node.moveTo(innerX, innerY).lineTo(outerX, outerY).stroke({
          color: burst.tint,
          width: 3,
          alpha: alpha * 0.72,
        });
      }

      if (progress < 1) {
        nextBursts.push(burst);
      } else if (burst.node.parent) {
        burst.node.parent.removeChild(burst.node);
      }
    });

    this.bursts = nextBursts;
  }

  private spawnNote(pattern: VoicePattern): void {
    const node = new Graphics();
    const note: VoiceNote = {
      ...pattern,
      id: this.noteCounter += 1,
      node,
      age: 0,
      holding: false,
      perfectHold: false,
      resolved: false,
    };

    this.noteLayer.addChild(node);
    this.notes.push(note);
  }

  private updateNoteState(note: VoiceNote): void {
    if (note.kind === "tap") {
      if (note.age > note.travelDuration + this.getLateWindow()) {
        this.registerMiss("A note faded before the phrase could settle. That's alright. Stay centered.", note);
      }
      return;
    }

    if (note.holding) {
      if (!this.isInputHeld()) {
        this.registerMiss("Too soon. Let the sustained note finish glowing before you release it.", note);
        return;
      }

      if (note.age >= note.travelDuration + note.sustainDuration) {
        this.completeHold(note);
      }
      return;
    }

    if (note.age > note.travelDuration + this.getLateWindow()) {
      this.registerMiss("The sustained note passed before you carried it. Listen for the phrase opening.", note);
    }
  }

  private handlePress(): void {
    if (this.ended || (this.phaseState !== "demo" && this.phaseState !== "live")) {
      return;
    }

    const activeHold = this.getActiveHoldNote();
    if (activeHold) {
      return;
    }

    const holdCandidate = this.findNearestNote("hold", this.getGoodWindow());
    if (holdCandidate) {
      this.startHold(holdCandidate.note, holdCandidate.offset);
      return;
    }

    const tapCandidate = this.findNearestNote("tap", this.getGoodWindow());
    if (tapCandidate) {
      this.resolveTap(tapCandidate.note, tapCandidate.offset);
      return;
    }

    const penaltyNote = this.findPenaltyNote();
    if (penaltyNote) {
      this.registerMiss("A little early or late. Let the note reach the center before you answer it.", penaltyNote);
    }
  }

  private handleRelease(): void {
    if (this.ended || (this.phaseState !== "demo" && this.phaseState !== "live")) {
      return;
    }

    if (this.isInputHeld()) {
      return;
    }

    const activeHold = this.getActiveHoldNote();
    if (activeHold) {
      this.registerMiss("Too soon. Let the sustained note finish its little bloom.", activeHold);
    }
  }

  private isInputHeld(): boolean {
    return this.pointerHeld || this.game.input.isPressed("Space");
  }

  private getActiveHoldNote(): VoiceNote | undefined {
    return this.notes.find((note) => note.kind === "hold" && note.holding && !note.resolved);
  }

  private findNearestNote(
    kind: VoiceNoteKind,
    window: number,
  ): { note: VoiceNote; offset: number } | null {
    const candidates = this.notes
      .filter((note) => note.kind === kind && !note.resolved && !note.holding)
      .map((note) => ({
        note,
        offset: Math.abs(note.age - note.travelDuration),
      }))
      .filter((entry) => entry.offset <= window)
      .sort((left, right) => left.offset - right.offset);

    return candidates[0] ?? null;
  }

  private findPenaltyNote(): VoiceNote | null {
    const candidates = this.notes
      .filter((note) => !note.resolved && !note.holding)
      .map((note) => ({
        note,
        offset: Math.abs(note.age - note.travelDuration),
      }))
      .filter((entry) => entry.offset <= this.getLateWindow())
      .sort((left, right) => left.offset - right.offset);

    return candidates[0]?.note ?? null;
  }

  private startHold(note: VoiceNote, offset: number): void {
    note.holding = true;
    note.perfectHold = offset <= this.getPerfectWindow();
    this.status = note.perfectHold
      ? "Beautiful. Keep that note warm."
      : "Good. Stay with the phrase and keep the note glowing.";
    this.refreshHud();
  }

  private resolveTap(note: VoiceNote, offset: number): void {
    const head = this.positionOnLane(note.laneIndex, this.getHeadRadius(note));
    this.spawnBurst(head.x, head.y, 0xf5c542);
    this.removeNote(note);

    const perfect = offset <= this.getPerfectWindow();

    if (this.phaseState === "live") {
      this.comboSystem.registerSuccess();
      const multiplier = this.comboSystem.getMultiplier();
      this.successfulNotes += 1;
      this.resonanceLevel += 1;

      if (perfect) {
        this.perfectHits += 1;
      }

      this.scoreSystem.add((perfect ? 120 : 70) * multiplier + this.comboSystem.getCombo() * 5);
      this.status = perfect
        ? "Beautiful. The chamber rang right back."
        : "Good. The phrase is warming up around you.";
      this.drawVoiceStage();
      this.refreshHud();
      return;
    }

    this.practiceSuccesses += 1;
    this.resonanceLevel += 1;
    this.status =
      this.practiceSuccesses >= VOICE_DEMO_GOAL
        ? "Lovely. Practice phrase complete."
        : "Good. Let the next note arrive before you answer it.";
    this.game.updateGuidance({
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt:
        this.practiceSuccesses >= VOICE_DEMO_GOAL
          ? "There you are. You felt the phrase."
          : "Good. Stay centered. The note will come to you.",
      tutorialTitle: "Practice phrase",
      tutorialText: "Two tap notes first, then keep the final note held through its glow.",
    });
    this.drawVoiceStage();
    this.refreshHud();

    if (this.practiceSuccesses >= VOICE_DEMO_GOAL) {
      void this.completeDemo();
    }
  }

  private completeHold(note: VoiceNote): void {
    const head = this.positionOnLane(note.laneIndex, this.getHeadRadius(note));
    this.spawnBurst(head.x, head.y, 0xf8b4c8);
    this.removeNote(note);

    if (this.phaseState === "live") {
      this.comboSystem.registerSuccess();
      const multiplier = this.comboSystem.getMultiplier();
      this.successfulNotes += 1;
      this.resonanceLevel += 1;

      if (note.perfectHold) {
        this.perfectHits += 1;
      }

      this.scoreSystem.add((note.perfectHold ? 120 : 70) * multiplier + this.comboSystem.getCombo() * 8);
      this.status = note.perfectHold
        ? "Perfect hold. The whole chamber bloomed for that one."
        : "Lovely hold. You carried the phrase all the way through.";
      this.drawVoiceStage();
      this.refreshHud();
      return;
    }

    this.practiceSuccesses += 1;
    this.resonanceLevel += 1;
    this.status = "Lovely. Practice phrase complete.";
    this.game.updateGuidance({
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: "There. That's the resonance I wanted you to feel.",
      tutorialTitle: "Practice phrase",
      tutorialText: "The note only wants a steady answer. Let it finish glowing before you release it.",
    });
    this.drawVoiceStage();
    this.refreshHud();

    if (this.practiceSuccesses >= VOICE_DEMO_GOAL) {
      void this.completeDemo();
    }
  }

  private registerMiss(message: string, note: VoiceNote): void {
    this.removeNote(note);

    if (this.phaseState === "live") {
      this.comboSystem.registerFailure();
      this.mistakes += 1;
      this.status = message;
      this.refreshHud();
      return;
    }

    this.pendingDemoResetPrompt =
      "No problem. We'll run that little phrase again. Let it open first, then answer it.";
  }

  private restartDemoPhrase(prompt: string): void {
    if (this.phaseState !== "demo") {
      return;
    }

    this.clearNotes();
    this.clearBursts();
    this.patternQueue = this.buildDemoPattern();
    this.nextPatternIndex = 0;
    this.runClock = 0;
    this.runDuration = this.computeRunDuration(this.patternQueue);
    this.remainingTime = this.runDuration;
    this.practiceSuccesses = 0;
    this.resonanceLevel = 0;
    this.status = "No rush. Practice the little phrase again and let it breathe.";
    this.game.updateGuidance({
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: prompt,
      tutorialTitle: "Practice phrase",
      tutorialText: "Listen for the shape of the phrase: tap, tap, then hold.",
    });
    this.drawVoiceStage();
    this.refreshHud();
  }

  private removeNote(note: VoiceNote): void {
    note.resolved = true;
    if (note.node.parent) {
      note.node.parent.removeChild(note.node);
    }
  }

  private spawnBurst(x: number, y: number, tint: number): void {
    const node = new Graphics();
    this.burstLayer.addChild(node);
    this.bursts.push({
      node,
      x,
      y,
      life: 0,
      maxLife: this.game.isMobile() ? 0.85 : 0.62,
      tint,
      scale: this.game.isMobile() ? randomRange(1.1, 1.5) : randomRange(0.85, 1.15),
    });
  }

  private drawVoiceStage(): void {
    const pulse = 1 + Math.sin(this.pulse * 3.1) * 0.03;
    const warmth = clamp(this.resonanceLevel / 14, 0, 1);
    const ringRadius = this.getRingRadius();

    this.stageGlow.clear();
    this.stageGlow.circle(VOICE_CENTER_X, VOICE_CENTER_Y, 280).fill({
      color: 0xf5c542,
      alpha: 0.03 + warmth * 0.08,
    });
    this.stageGlow.circle(VOICE_CENTER_X, VOICE_CENTER_Y, 186).fill({
      color: 0xf5efe0,
      alpha: 0.04 + warmth * 0.06,
    });

    this.stageDetails.clear();
    this.stageDetails.circle(VOICE_CENTER_X, VOICE_CENTER_Y, ringRadius + 168).stroke({
      color: 0xf5efe0,
      width: 1,
      alpha: 0.12 + warmth * 0.08,
    });
    this.stageDetails.circle(VOICE_CENTER_X, VOICE_CENTER_Y, ringRadius + 92).stroke({
      color: 0xf8b4c8,
      width: 1,
      alpha: 0.12 + warmth * 0.06,
    });
    this.stageDetails.circle(VOICE_CENTER_X, VOICE_CENTER_Y, ringRadius + 28).stroke({
      color: 0x6ec6ff,
      width: 1,
      alpha: 0.14 + warmth * 0.08,
    });

    const lanternsToWake = Math.min(4, Math.floor(this.resonanceLevel / 3));
    [
      { x: 448, y: 540 },
      { x: 592, y: 596 },
      { x: 848, y: 596 },
      { x: 992, y: 540 },
    ].forEach((lantern, index) => {
      const lit = index < lanternsToWake;
      this.stageDetails.circle(lantern.x, lantern.y, lit ? 26 : 18).fill({
        color: lit ? 0xf5c542 : 0x2a3044,
        alpha: lit ? 0.78 : 0.32,
      });
      this.stageDetails.circle(lantern.x, lantern.y, lit ? 56 : 34).fill({
        color: lit ? 0xf8b4c8 : 0x6ec6ff,
        alpha: lit ? 0.14 : 0.04,
      });
    });

    const bloomsToWake = Math.min(5, Math.floor(this.resonanceLevel / 2));
    [520, 620, 720, 820, 920].forEach((x, index) => {
      if (index >= bloomsToWake) {
        return;
      }

      const y = 640 + Math.abs(2 - index) * 10;
      this.stageDetails.circle(x, y, 14).fill({ color: 0xf5efe0, alpha: 0.82 });
      this.stageDetails.circle(x - 16, y + 6, 10).fill({ color: 0xf8b4c8, alpha: 0.76 });
      this.stageDetails.circle(x + 16, y + 6, 10).fill({ color: 0xf8b4c8, alpha: 0.76 });
    });

    this.ring.clear();
    this.ring.circle(VOICE_CENTER_X, VOICE_CENTER_Y, ringRadius + 72).fill({
      color: 0xf5c542,
      alpha: 0.06 + warmth * 0.05,
    });
    this.ring.circle(VOICE_CENTER_X, VOICE_CENTER_Y, ringRadius * pulse).stroke({
      color: 0xf5efe0,
      width: 3,
      alpha: 0.92,
    });
    this.ring.circle(VOICE_CENTER_X, VOICE_CENTER_Y, (ringRadius + 26) * pulse).stroke({
      color: 0x6ec6ff,
      width: 2,
      alpha: 0.24 + warmth * 0.16,
    });
    this.ring.circle(VOICE_CENTER_X, VOICE_CENTER_Y, ringRadius - 22).stroke({
      color: 0xf8b4c8,
      width: 1,
      alpha: 0.16 + warmth * 0.1,
    });
  }

  private drawNote(note: VoiceNote): void {
    const headRadius = this.getHeadRadius(note);
    const head = this.positionOnLane(note.laneIndex, headRadius);
    const nearCenter = Math.abs(note.age - note.travelDuration) <= this.getGoodWindow();
    const tint = note.holding ? 0xf5c542 : nearCenter ? 0xf8b4c8 : 0x6ec6ff;
    const sizeMultiplier = this.game.isMobile() ? 1.4 : 1;
    const ringRadius = this.getRingRadius();

    note.node.clear();

    if (note.kind === "hold") {
      const tailRadius = clamp(headRadius + VOICE_HOLD_TRAIL, ringRadius + 14, VOICE_OUTER_RADIUS);
      const tail = this.positionOnLane(note.laneIndex, tailRadius);
      note.node.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({
        color: tint,
        width: 16,
        alpha: 0.46,
      });
      note.node.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({
        color: 0xf5efe0,
        width: 5,
        alpha: 0.2,
      });
    }

    note.node.circle(head.x, head.y, (note.kind === "hold" ? 18 : 15) * sizeMultiplier).fill({
      color: 0xf5efe0,
      alpha: 0.94,
    });
    note.node.circle(head.x, head.y, (note.kind === "hold" ? 32 : 26) * sizeMultiplier).fill({
      color: tint,
      alpha: note.holding ? 0.22 : 0.15,
    });
    note.node.circle(head.x, head.y, (note.kind === "hold" ? 9 : 8) * sizeMultiplier).fill({
      color: tint,
      alpha: 0.86,
    });
  }

  private getHeadRadius(note: VoiceNote): number {
    const ringRadius = this.getRingRadius();

    if (note.age <= note.travelDuration) {
      const progress = clamp(note.age / note.travelDuration, 0, 1);
      return VOICE_OUTER_RADIUS + (ringRadius - VOICE_OUTER_RADIUS) * progress;
    }

    const sustainDuration = note.kind === "hold" ? note.sustainDuration : this.getLateWindow();
    const progress = clamp((note.age - note.travelDuration) / Math.max(sustainDuration, 0.001), 0, 1);
    return ringRadius + (VOICE_INNER_RADIUS - ringRadius) * progress;
  }

  private positionOnLane(laneIndex: number, radius: number): { x: number; y: number } {
    const angle = VOICE_LANES[laneIndex] ?? VOICE_LANES[2];
    return {
      x: VOICE_CENTER_X + Math.cos(angle) * radius,
      y: VOICE_CENTER_Y + Math.sin(angle) * radius,
    };
  }

  private refreshHud(): void {
    if (this.phaseState === "demo") {
      this.hud.updateValues({
        title: `${this.trial.title} Demo`,
        subtitle: this.getDemoObjectiveText(),
        score: 0,
        comboLabel: "Practice only",
        timerLabel: "Practice Phrase",
        status: this.status,
      });
      return;
    }

    if (this.phaseState === "briefing" || this.phaseState === "ready") {
      this.hud.updateValues({
        title: this.trial.title,
        subtitle: "Read the instructions above, then continue when you feel ready.",
        score: 0,
        comboLabel: "Practice unlocks the live run",
        timerLabel: "Paused",
        status: this.status,
      });
      return;
    }

    this.hud.updateValues({
      title: this.trial.title,
      subtitle: this.trial.objectiveText,
      score: this.scoreSystem.getScore(),
      comboLabel: `Resonance  ${this.comboSystem.getCombo()}   Perfect  ${this.perfectHits}`,
      timerLabel: `Time  ${Math.max(0, Math.ceil(this.remainingTime))}s`,
      status: this.status,
    });
  }

  private async finishTrial(): Promise<void> {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.game.clearGuidance();
    this.clearNotes();
    const reveal = GIFT_REVEALS.voice;

    const result = {
      trialId: "voice" as const,
      title: this.trial.title,
      subtitle: "The whole shrine is awake now. Let Simba show you what all four gifts meant together.",
      score: this.scoreSystem.getScore(),
      rank: this.scoreSystem.getRank(),
      quality: this.trial.quality,
      giftName: this.trial.giftName,
      giftSummary: reveal.giftSummary,
      giftMeaning: reveal.giftMeaning,
      simbaValueTheme: reveal.simbaValueTheme,
      awakeningSummary: reveal.awakeningSummary,
      simbaLine: reveal.simbaLine,
      awakeningText: reveal.awakeningText,
      simbaReflection: reveal.simbaReflection,
      heroStat: {
        label: this.trial.statLabel,
        value: String(this.comboSystem.getMaxCombo()),
      },
      metrics: this.game.createResultMetrics([
        { label: "Notes Answered", value: `${this.successfulNotes}/${this.patternQueue.length}` },
        { label: "Perfect Hits", value: String(this.perfectHits) },
        { label: "Mistakes", value: String(this.mistakes) },
        { label: "Shrine Record", value: formatScore(this.scoreSystem.getScore()) },
      ]),
      ctaLabel: reveal.ctaLabel,
    };

    this.game.recordTrialResult(result, {
      maxStreak: this.comboSystem.getMaxCombo(),
      perfectHits: this.perfectHits,
      mistakes: this.mistakes,
    });

    await this.game.showResults(result);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    await this.game.returnToHub();
  }
}
