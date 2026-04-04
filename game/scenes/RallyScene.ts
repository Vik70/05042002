import { Container, Graphics } from "pixi.js";
import { GIFT_REVEALS } from "@/game/data/dialogue";
import { TRIAL_DEFINITIONS, getTrialControlsHint } from "@/game/data/trials";
import { BaseScene } from "@/game/scenes/BaseScene";
import { ComboSystem } from "@/game/systems/ComboSystem";
import { EffectsSystem } from "@/game/systems/EffectsSystem";
import { ScoreSystem } from "@/game/systems/ScoreSystem";
import { PixiHUD } from "@/game/ui/PixiHUD";
import { clamp, formatScore, randomRange } from "@/lib/utils";

type CharmKind = "tap" | "hold";
type RallyPhase = "briefing" | "demo" | "ready" | "live";

interface CharmPattern {
  kind: CharmKind;
  spawnAt: number;
  angle: number;
  travelDuration: number;
  sustainDuration: number;
}

interface CharmNote extends CharmPattern {
  id: number;
  node: Graphics;
  age: number;
  holding: boolean;
  perfectHold: boolean;
  resolved: boolean;
}

interface RingFlash {
  node: Graphics;
  life: number;
  maxLife: number;
  tint: number;
}

const FLOW_CENTER_X = 720;
const FLOW_CENTER_Y = 520;
const FLOW_OUTER_RADIUS = 470;
const FLOW_RING_RADIUS = 132;
const FLOW_INNER_RADIUS = 26;
const FLOW_HOLD_TRAIL = 150;
const FLOW_DEMO_GOAL = 2;
const FLOW_PERFECT_WINDOW = 0.08;
const FLOW_GOOD_WINDOW = 0.18;
const FLOW_LATE_WINDOW = 0.28;

export class RallyScene extends BaseScene {
  readonly id = "rally" as const;

  private readonly trial = TRIAL_DEFINITIONS.rally;
  private readonly scoreSystem = new ScoreSystem("rally");
  private readonly comboSystem = new ComboSystem();
  private readonly hud = new PixiHUD(() => this.game.getVisibleBounds());
  private readonly petals = EffectsSystem.createPetalField(1440, 810, 28, 0x6ec6ff);
  private readonly ring = new Graphics();
  private readonly noteLayer = new Container();
  private readonly feedbackLayer = new Container();

  private charms: CharmNote[] = [];
  private flashes: RingFlash[] = [];
  private patternQueue: CharmPattern[] = [];
  private nextPatternIndex = 0;
  private runClock = 0;
  private runDuration = 0;
  private remainingTime = 0;
  private lives = 3;
  private successfulNotes = 0;
  private perfectHits = 0;
  private completedHolds = 0;
  private ended = false;
  private phaseState: RallyPhase = "briefing";
  private practiceSuccesses = 0;
  private status = "Let the rhythm gather before you answer it.";
  private pointerHeld = false;
  private lastSpaceDown = false;
  private charmCounter = 0;
  private ringPulse = 0;
  private pendingDemoResetPrompt: string | null = null;

  private getControlsHint(): string {
    return getTrialControlsHint(this.trial, this.game.isMobile());
  }

  private getPerfectWindow(): number {
    return this.game.isMobile() ? 0.12 : FLOW_PERFECT_WINDOW;
  }

  private getGoodWindow(): number {
    return this.game.isMobile() ? 0.26 : FLOW_GOOD_WINDOW;
  }

  private getLateWindow(): number {
    return this.game.isMobile() ? 0.38 : FLOW_LATE_WINDOW;
  }

  private getRingRadius(): number {
    return FLOW_RING_RADIUS * (this.game.isMobile() ? 1.2 : 1);
  }

  async init(): Promise<void> {
    this.removeChildren();
    this.scoreSystem.reset();
    this.comboSystem.reset();
    this.clearCharms();
    this.patternQueue = [];
    this.nextPatternIndex = 0;
    this.runClock = 0;
    this.runDuration = 0;
    this.remainingTime = 0;
    this.lives = 3;
    this.successfulNotes = 0;
    this.perfectHits = 0;
    this.completedHolds = 0;
    this.ended = false;
    this.phaseState = "briefing";
    this.practiceSuccesses = 0;
    this.status = "Let the rhythm gather before you answer it.";
    this.pointerHeld = false;
    this.lastSpaceDown = false;
    this.charmCounter = 0;
    this.ringPulse = 0;
    this.pendingDemoResetPrompt = null;
    this.flashes = [];
    this.feedbackLayer.removeChildren();
    this.hud.setMobile(this.game.isMobile());

    const backdrop = this.createNightBackdrop(0.24);
    const stage = this.createFlowStage();

    this.addChild(backdrop, stage, this.noteLayer, this.feedbackLayer, this.petals.container, this.hud);
    this.addUpdater(this.petals.update);
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
        "We'll do one tiny practice wave first. A tap charm, then a hold charm, then the real flow can show off.",
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
    this.status = "Practice the pattern first: tap the first charm, then hold the second.";
    this.game.showGuidance({
      objectiveTitle: `${this.trial.title} Demo`,
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: "First a tap charm, then a hold charm. Just feel the difference.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Practice run",
      tutorialText: "Nothing is scored yet. This wave only teaches the two note types.",
    });
    this.refreshHud();
  }

  private async completeDemo(): Promise<void> {
    if (this.phaseState !== "demo") {
      return;
    }

    this.phaseState = "ready";
    this.clearCharms();
    this.status = "The live flow is ready now.";
    this.refreshHud();

    await this.game.showGiftPrep({
      eyebrow: "Demo Complete",
      title: this.trial.title,
      subtitle: "The real flow is ready to answer back.",
      description:
        "You felt both note types already. Now the live run will build them into rhythm chains that keep moving from every angle.",
      simbaLine: "That was lovely. Same feeling now, just for real.",
      instructions: this.trial.instructions,
      controlsHint: this.getControlsHint(),
      focusLabel: "Live run",
      focusText: "The timer and chances begin as soon as you continue.",
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
    this.status = "Let the rhythm gather, then meet it cleanly at the ring.";
    this.game.showGuidance({
      objectiveTitle: this.trial.objectiveTitle,
      objectiveText: this.trial.objectiveText,
      simbaPrompt: "Tap the light charms. Hold the long ones. Let the ring do the counting.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Live run",
      tutorialText: "This time the flow really counts.",
    });
    this.refreshHud();
  }

  private resetRunState(): void {
    this.clearCharms();
    this.patternQueue = [];
    this.nextPatternIndex = 0;
    this.runClock = 0;
    this.runDuration = 0;
    this.remainingTime = 0;
    this.lives = 3;
    this.successfulNotes = 0;
    this.perfectHits = 0;
    this.completedHolds = 0;
    this.practiceSuccesses = 0;
    this.pointerHeld = false;
    this.lastSpaceDown = false;
    this.pendingDemoResetPrompt = null;
    this.scoreSystem.reset();
    this.comboSystem.reset();
  }

  private clearCharms(): void {
    this.charms.forEach((charm) => {
      if (charm.node.parent) {
        charm.node.parent.removeChild(charm.node);
      }
    });
    this.charms = [];
    this.noteLayer.removeChildren();
  }

  private getDemoObjectiveText(): string {
    return `Clear the practice wave: tap one charm and hold one charm (${this.practiceSuccesses}/${FLOW_DEMO_GOAL})`;
  }

  private createFlowStage(): Container {
    const stage = new Container();
    const ringRadius = this.getRingRadius();

    const floor = new Graphics();
    floor.rect(0, 590, 1440, 220).fill({ color: 0x0e1118, alpha: 0.95 });

    const dais = new Graphics();
    dais.ellipse(FLOW_CENTER_X, FLOW_CENTER_Y + 42, 340, 132).fill({ color: 0x141926, alpha: 0.8 });
    dais.ellipse(FLOW_CENTER_X, FLOW_CENTER_Y + 42, 246, 92).stroke({
      color: 0xf5efe0,
      width: 2,
      alpha: 0.16,
    });

    const moonGlow = new Graphics();
    moonGlow.circle(1040, 180, 210).fill({ color: 0x6ec6ff, alpha: 0.1 });

    const centerBloom = new Graphics();
    centerBloom.circle(FLOW_CENTER_X, FLOW_CENTER_Y, 180).fill({ color: 0x6ec6ff, alpha: 0.08 });

    const orbitLines = new Graphics();
    orbitLines.circle(FLOW_CENTER_X, FLOW_CENTER_Y, ringRadius + 106).stroke({
      color: 0x6ec6ff,
      width: 2,
      alpha: 0.12,
    });
    orbitLines.circle(FLOW_CENTER_X, FLOW_CENTER_Y, ringRadius + 208).stroke({
      color: 0x6ec6ff,
      width: 1,
      alpha: 0.08,
    });
    orbitLines.ellipse(FLOW_CENTER_X, FLOW_CENTER_Y + 24, 440, 236).stroke({
      color: 0xf8b4c8,
      width: 1,
      alpha: 0.08,
    });

    this.drawRing();

    stage.addChild(floor, moonGlow, centerBloom, orbitLines, dais, this.ring);
    return stage;
  }

  private buildDemoPattern(): CharmPattern[] {
    return [
      {
        kind: "tap",
        spawnAt: 0.5,
        angle: -2.08,
        travelDuration: 1.28,
        sustainDuration: 0,
      },
      {
        kind: "hold",
        spawnAt: 2.35,
        angle: -0.98,
        travelDuration: 1.36,
        sustainDuration: 0.58,
      },
    ];
  }

  private buildLivePattern(): CharmPattern[] {
    const waveTemplates: CharmKind[][] = [
      ["tap", "tap", "hold"],
      ["tap", "hold", "tap"],
      ["tap", "tap", "hold", "tap"],
      ["hold", "tap", "tap", "hold"],
      ["tap", "hold", "tap", "tap", "hold"],
    ];

    let spawnAt = 0.5;
    const patterns: CharmPattern[] = [];

    waveTemplates.forEach((wave) => {
      wave.forEach((kind) => {
        patterns.push({
          kind,
          spawnAt,
          angle: this.pickFlowAngle(),
          travelDuration: kind === "hold" ? randomRange(1.34, 1.54) : randomRange(1.18, 1.4),
          sustainDuration: kind === "hold" ? randomRange(0.5, 0.7) : 0,
        });
        spawnAt += randomRange(0.56, 0.74);
      });

      spawnAt += randomRange(1.05, 1.36);
    });

    return patterns;
  }

  private pickFlowAngle(): number {
    return randomRange(-2.42, -0.72);
  }

  private computeRunDuration(patterns: CharmPattern[]): number {
    return patterns.reduce(
      (maxDuration, pattern) =>
        Math.max(maxDuration, pattern.spawnAt + pattern.travelDuration + pattern.sustainDuration + 0.5),
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
    this.ringPulse += deltaSeconds;
    this.updateFlashes(deltaSeconds);
    this.drawRing();

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
      this.spawnCharm(this.patternQueue[this.nextPatternIndex]);
      this.nextPatternIndex += 1;
    }

    const nextCharms: CharmNote[] = [];
    this.charms.forEach((charm) => {
      if (charm.resolved) {
        return;
      }

      charm.age += deltaSeconds;
      this.drawCharm(charm);
      this.updateCharmState(charm);

      if (!charm.resolved) {
        nextCharms.push(charm);
      }
    });
    this.charms = nextCharms;

    if (this.pendingDemoResetPrompt) {
      const prompt = this.pendingDemoResetPrompt;
      this.pendingDemoResetPrompt = null;
      this.restartDemoWave(prompt);
      return;
    }

    this.refreshHud();

    if (this.phaseState === "live") {
      const runComplete = this.nextPatternIndex >= this.patternQueue.length && this.charms.length === 0;
      if (this.lives <= 0 || this.remainingTime <= 0 || runComplete) {
        void this.finishTrial();
      }
    }
  }

  private spawnCharm(pattern: CharmPattern): void {
    const node = new Graphics();
    const charm: CharmNote = {
      ...pattern,
      id: this.charmCounter += 1,
      node,
      age: 0,
      holding: false,
      perfectHold: false,
      resolved: false,
    };

    this.noteLayer.addChild(node);
    this.charms.push(charm);
  }

  private updateCharmState(charm: CharmNote): void {
    if (charm.kind === "tap") {
      if (charm.age > charm.travelDuration + this.getLateWindow()) {
        this.registerMiss("A moon charm slipped past the ring. No rush. Another wave is already coming.", charm);
      }
      return;
    }

    if (charm.holding) {
      if (!this.isInputHeld()) {
        this.registerMiss("Too soon. Let the held charm finish glowing before you release it.", charm);
        return;
      }

      if (charm.age >= charm.travelDuration + charm.sustainDuration) {
        this.completeHold(charm);
      }
      return;
    }

    if (charm.age > charm.travelDuration + this.getLateWindow()) {
      this.registerMiss("The long charm passed through before you carried it. Let the ring meet you first.", charm);
    }
  }

  private handlePress(): void {
    if (this.ended || (this.phaseState !== "demo" && this.phaseState !== "live")) {
      return;
    }

    const activeHold = this.getActiveHoldCharm();
    if (activeHold) {
      return;
    }

    const holdCandidate = this.findNearestCharm("hold", this.getGoodWindow());
    if (holdCandidate) {
      this.startHold(holdCandidate.charm, holdCandidate.offset);
      return;
    }

    const tapCandidate = this.findNearestCharm("tap", this.getGoodWindow());
    if (tapCandidate) {
      this.resolveTap(tapCandidate.charm, tapCandidate.offset);
      return;
    }

    const penaltyCharm = this.findPenaltyCharm();
    if (penaltyCharm) {
      this.registerMiss("A little early or late. Let the ring arrive before you answer it.", penaltyCharm);
    }
  }

  private handleRelease(): void {
    if (this.ended || (this.phaseState !== "demo" && this.phaseState !== "live")) {
      return;
    }

    if (this.isInputHeld()) {
      return;
    }

    const activeHold = this.getActiveHoldCharm();
    if (activeHold) {
      this.registerMiss("Too soon. Let the hold charm pass fully through the ring.", activeHold);
    }
  }

  private isInputHeld(): boolean {
    return this.pointerHeld || this.game.input.isPressed("Space");
  }

  private getActiveHoldCharm(): CharmNote | undefined {
    return this.charms.find((charm) => charm.kind === "hold" && charm.holding && !charm.resolved);
  }

  private findNearestCharm(
    kind: CharmKind,
    window: number,
  ): { charm: CharmNote; offset: number } | null {
    const candidates = this.charms
      .filter((charm) => charm.kind === kind && !charm.resolved && !charm.holding)
      .map((charm) => ({
        charm,
        offset: Math.abs(charm.age - charm.travelDuration),
      }))
      .filter((entry) => entry.offset <= window)
      .sort((left, right) => left.offset - right.offset);

    return candidates[0] ?? null;
  }

  private findPenaltyCharm(): CharmNote | null {
    const candidates = this.charms
      .filter((charm) => !charm.resolved && !charm.holding)
      .map((charm) => ({
        charm,
        offset: Math.abs(charm.age - charm.travelDuration),
      }))
      .filter((entry) => entry.offset <= this.getLateWindow())
      .sort((left, right) => left.offset - right.offset);

    return candidates[0]?.charm ?? null;
  }

  private startHold(charm: CharmNote, offset: number): void {
    charm.holding = true;
    charm.perfectHold = offset <= this.getPerfectWindow();
    this.status = charm.perfectHold
      ? "Lovely. Hold the glow there."
      : "Good. Keep the long charm moving through the ring.";
    this.refreshHud();
  }

  private resolveTap(charm: CharmNote, offset: number): void {
    this.removeCharm(charm);

    const perfect = offset <= this.getPerfectWindow();
    this.spawnRingFlash(perfect ? 0xf8b4c8 : 0x6ec6ff);

    if (this.phaseState === "live") {
      this.comboSystem.registerSuccess();
      const multiplier = this.comboSystem.getMultiplier();
      this.successfulNotes += 1;

      if (perfect) {
        this.perfectHits += 1;
      }

      this.scoreSystem.add((perfect ? 110 : 75) * multiplier + this.comboSystem.getCombo() * 6);
      this.status = perfect
        ? "Perfect. The moon charm answered the ring beautifully."
        : "Good. The moon charm stayed with you cleanly.";
      this.refreshHud();
      return;
    }

    this.practiceSuccesses += 1;
    this.status =
      this.practiceSuccesses >= FLOW_DEMO_GOAL
        ? "Lovely. Practice wave complete."
        : "Good. One more now, and this time hold it through the ring.";
    this.game.updateGuidance({
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt:
        this.practiceSuccesses >= FLOW_DEMO_GOAL
          ? "That was lovely. You felt both note types."
          : "There. Now the next one is a hold charm. Keep it glowing a little longer.",
      tutorialTitle: "Practice run",
      tutorialText: "Tap the first note at the ring. Hold the long note all the way through.",
    });
    this.refreshHud();

    if (this.practiceSuccesses >= FLOW_DEMO_GOAL) {
      void this.completeDemo();
    }
  }

  private completeHold(charm: CharmNote): void {
    this.removeCharm(charm);
    this.spawnRingFlash(charm.perfectHold ? 0xf5c542 : 0x6ec6ff);

    if (this.phaseState === "live") {
      this.comboSystem.registerSuccess();
      const multiplier = this.comboSystem.getMultiplier();
      this.successfulNotes += 1;
      this.completedHolds += 1;

      if (charm.perfectHold) {
        this.perfectHits += 1;
      }

      this.scoreSystem.add((charm.perfectHold ? 125 : 95) * multiplier + this.comboSystem.getCombo() * 8);
      this.status = charm.perfectHold
        ? "Perfect hold. The whole ring bloomed for that one."
        : "Beautiful hold. You carried the charm through cleanly.";
      this.refreshHud();
      return;
    }

    this.practiceSuccesses += 1;
    this.status = "Lovely. Practice wave complete.";
    this.game.updateGuidance({
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: "That was lovely. You have the feel of it now.",
      tutorialTitle: "Practice run",
      tutorialText: "Tap notes meet the ring once. Hold notes stay with it a little longer.",
    });
    this.refreshHud();

    if (this.practiceSuccesses >= FLOW_DEMO_GOAL) {
      void this.completeDemo();
    }
  }

  private registerMiss(message: string, charm: CharmNote): void {
    this.removeCharm(charm);

    if (this.phaseState === "live") {
      this.comboSystem.registerFailure();
      this.lives = Math.max(0, this.lives - 1);
      this.status = message;
      this.refreshHud();
      return;
    }

    this.pendingDemoResetPrompt = "No problem. We'll run that little practice wave again, nice and gently.";
  }

  private restartDemoWave(prompt: string): void {
    if (this.phaseState !== "demo") {
      return;
    }

    this.clearCharms();
    this.patternQueue = this.buildDemoPattern();
    this.nextPatternIndex = 0;
    this.runClock = 0;
    this.runDuration = this.computeRunDuration(this.patternQueue);
    this.remainingTime = this.runDuration;
    this.practiceSuccesses = 0;
    this.status = "No rush. Practice the little wave again: tap first, then hold.";
    this.game.updateGuidance({
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: prompt,
      tutorialTitle: "Practice run",
      tutorialText: "Watch the ring. Tap the first charm there, then keep holding the long one through it.",
    });
    this.refreshHud();
  }

  private removeCharm(charm: CharmNote): void {
    charm.resolved = true;
    if (charm.node.parent) {
      charm.node.parent.removeChild(charm.node);
    }
  }

  private drawRing(): void {
    const holding = Boolean(this.getActiveHoldCharm());
    const pulse = 1 + Math.sin(this.ringPulse * 3.8) * 0.03;
    const ringRadius = this.getRingRadius();

    this.ring.clear();
    this.ring.circle(FLOW_CENTER_X, FLOW_CENTER_Y, ringRadius + 74).fill({
      color: holding ? 0xf5c542 : 0x6ec6ff,
      alpha: holding ? 0.08 : 0.05,
    });
    this.ring.circle(FLOW_CENTER_X, FLOW_CENTER_Y, ringRadius * pulse).stroke({
      color: 0xf5efe0,
      width: 3,
      alpha: 0.88,
    });
    this.ring.circle(FLOW_CENTER_X, FLOW_CENTER_Y, (ringRadius + 28) * pulse).stroke({
      color: 0x6ec6ff,
      width: 2,
      alpha: holding ? 0.38 : 0.22,
    });
    this.ring.circle(FLOW_CENTER_X, FLOW_CENTER_Y, ringRadius - 24).stroke({
      color: 0xf8b4c8,
      width: 1,
      alpha: 0.18,
    });
  }

  private drawCharm(charm: CharmNote): void {
    const headRadius = this.getHeadRadius(charm);
    const head = this.positionOnPath(charm.angle, headRadius);
    const nearRing = Math.abs(charm.age - charm.travelDuration) <= this.getGoodWindow();
    const tint = charm.holding ? 0xf5c542 : nearRing ? 0xf8b4c8 : 0x6ec6ff;
    const alpha = charm.holding ? 0.98 : 0.86;
    const sizeMultiplier = this.game.isMobile() ? 1.4 : 1;
    const ringRadius = this.getRingRadius();

    charm.node.clear();

    if (charm.kind === "hold") {
      const tailRadius = clamp(headRadius + FLOW_HOLD_TRAIL, ringRadius + 18, FLOW_OUTER_RADIUS);
      const tail = this.positionOnPath(charm.angle, tailRadius);
      charm.node.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({
        color: tint,
        width: 18,
        alpha: 0.48,
      });
      charm.node.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({
        color: 0xf5efe0,
        width: 6,
        alpha: 0.2,
      });
    }

    charm.node.circle(head.x, head.y, (charm.kind === "hold" ? 19 : 16) * sizeMultiplier).fill({
      color: 0xf5efe0,
      alpha,
    });
    charm.node.circle(head.x, head.y, (charm.kind === "hold" ? 36 : 28) * sizeMultiplier).fill({
      color: tint,
      alpha: charm.holding ? 0.22 : 0.16,
    });
    charm.node.circle(head.x, head.y, (charm.kind === "hold" ? 10 : 8) * sizeMultiplier).fill({
      color: tint,
      alpha: 0.82,
    });
  }

  private getHeadRadius(charm: CharmNote): number {
    const ringRadius = this.getRingRadius();

    if (charm.age <= charm.travelDuration) {
      const progress = clamp(charm.age / charm.travelDuration, 0, 1);
      return FLOW_OUTER_RADIUS + (ringRadius - FLOW_OUTER_RADIUS) * progress;
    }

    const sustainDuration = charm.kind === "hold" ? charm.sustainDuration : this.getLateWindow();
    const progress = clamp((charm.age - charm.travelDuration) / Math.max(sustainDuration, 0.001), 0, 1);
    return ringRadius + (FLOW_INNER_RADIUS - ringRadius) * progress;
  }

  private positionOnPath(angle: number, radius: number): { x: number; y: number } {
    return {
      x: FLOW_CENTER_X + Math.cos(angle) * radius,
      y: FLOW_CENTER_Y + Math.sin(angle) * radius,
    };
  }

  private spawnRingFlash(tint: number): void {
    const flash = new Graphics();
    this.feedbackLayer.addChild(flash);
    this.flashes.push({
      node: flash,
      life: 0,
      maxLife: 0.15,
      tint,
    });
  }

  private updateFlashes(deltaSeconds: number): void {
    const nextFlashes: RingFlash[] = [];
    const ringRadius = this.getRingRadius();

    this.flashes.forEach((flash) => {
      flash.life += deltaSeconds;
      const progress = clamp(flash.life / flash.maxLife, 0, 1);
      const alpha = 1 - progress;

      flash.node.clear();
      flash.node.circle(FLOW_CENTER_X, FLOW_CENTER_Y, (ringRadius + 16) * (0.9 + progress * 0.18)).fill({
        color: flash.tint,
        alpha: alpha * 0.2,
      });
      flash.node.circle(FLOW_CENTER_X, FLOW_CENTER_Y, (ringRadius + 40) * (0.92 + progress * 0.28)).stroke({
        color: 0xf5efe0,
        width: 3,
        alpha: alpha * 0.9,
      });

      if (progress < 1) {
        nextFlashes.push(flash);
      } else if (flash.node.parent) {
        flash.node.parent.removeChild(flash.node);
      }
    });

    this.flashes = nextFlashes;
  }

  private refreshHud(): void {
    if (this.phaseState === "demo") {
      this.hud.updateValues({
        title: `${this.trial.title} Demo`,
        subtitle: this.getDemoObjectiveText(),
        score: 0,
        comboLabel: "Practice only",
        timerLabel: "Demo Wave",
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
      comboLabel: `Flow chain  ${this.comboSystem.getCombo()}   Chances  ${this.lives}`,
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
    this.clearCharms();
    const reveal = GIFT_REVEALS.rally;

    const result = {
      trialId: "rally" as const,
      title: this.trial.title,
      subtitle: "Step back into the shrine and feel how much more alive it moves now.",
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
        { label: "Successful Charms", value: String(this.successfulNotes) },
        { label: "Perfect Timing", value: String(this.perfectHits) },
        { label: "Completed Holds", value: String(this.completedHolds) },
        { label: "Shrine Record", value: formatScore(this.scoreSystem.getScore()) },
      ]),
      ctaLabel: reveal.ctaLabel,
    };

    this.game.recordTrialResult(result, {
      maxStreak: this.comboSystem.getMaxCombo(),
      perfectHits: this.perfectHits,
      mistakes: Math.max(0, 3 - this.lives),
    });

    await this.game.showResults(result);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    await this.game.returnToHub();
  }
}
