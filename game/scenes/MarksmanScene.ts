import { Container, Graphics } from "pixi.js";
import { GIFT_REVEALS } from "@/game/data/dialogue";
import { TRIAL_DEFINITIONS, getTrialControlsHint } from "@/game/data/trials";
import { BaseScene } from "@/game/scenes/BaseScene";
import { ComboSystem } from "@/game/systems/ComboSystem";
import { EffectsSystem } from "@/game/systems/EffectsSystem";
import { ScoreSystem } from "@/game/systems/ScoreSystem";
import { PixiHUD } from "@/game/ui/PixiHUD";
import { clamp, formatPercent, formatScore, randomRange } from "@/lib/utils";

interface TargetState {
  id: number;
  node: Container;
  radius: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface HitFlash {
  node: Graphics;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tint: number;
}

type MarksmanPhase = "briefing" | "demo" | "ready" | "live";

const MARKSMAN_DEMO_GOAL = 2;

export class MarksmanScene extends BaseScene {
  readonly id = "marksman" as const;

  private readonly trial = TRIAL_DEFINITIONS.marksman;
  private readonly scoreSystem = new ScoreSystem("marksman");
  private readonly comboSystem = new ComboSystem();
  private readonly hud = new PixiHUD(() => this.game.getVisibleBounds());
  private readonly feedbackLayer = new Container();
  private readonly reticle = new Container();
  private readonly focusRing = new Graphics();

  private petals = EffectsSystem.createPetalField(1440, 810, 24, 0xf8b4c8);
  private targets: TargetState[] = [];
  private flashes: HitFlash[] = [];
  private pointerX = 720;
  private pointerY = 420;
  private focus = 0;
  private charging = false;
  private spawnTimer = 0;
  private remainingTime = 62;
  private totalShots = 0;
  private hitShots = 0;
  private misses = 0;
  private perfectHits = 0;
  private targetCounter = 0;
  private ended = false;
  private phase: MarksmanPhase = "briefing";
  private demoHits = 0;
  private status = "The distant lanterns are listening for stillness.";

  private getControlsHint(): string {
    return getTrialControlsHint(this.trial, this.game.isMobile());
  }

  async init(): Promise<void> {
    this.removeChildren();
    this.targets = [];
    this.scoreSystem.reset();
    this.spawnTimer = 0;
    this.remainingTime = 62;
    this.totalShots = 0;
    this.hitShots = 0;
    this.misses = 0;
    this.perfectHits = 0;
    this.targetCounter = 0;
    this.ended = false;
    this.phase = "briefing";
    this.demoHits = 0;
    this.status = "The distant lanterns are listening for stillness.";
    this.focus = 0;
    this.charging = false;
    this.comboSystem.reset();
    this.flashes = [];
    this.feedbackLayer.removeChildren();
    this.hud.setMobile(this.game.isMobile());

    const backdrop = this.createNightBackdrop(0.25);
    const range = this.createRangeBackdrop();
    this.createReticle();

    this.addChild(backdrop, range, this.feedbackLayer, this.petals.container, this.hud, this.reticle);
    this.addUpdater(this.petals.update);
    this.addUpdater((deltaMs) => this.updateScene(deltaMs));

    this.on("pointermove", (event) => {
      const point = this.game.toLogicalPoint(event.global.x, event.global.y);
      const bounds = this.game.getVisibleBounds();
      const touchOffset = this.game.isMobile() ? 60 : 0;
      this.pointerX = clamp(point.x, bounds.left + 46, bounds.right - 46);
      this.pointerY = clamp(
        point.y - touchOffset,
        Math.max(bounds.top + 170, 170),
        Math.min(bounds.bottom - 160, 650),
      );
      this.reticle.position.set(this.pointerX, this.pointerY);
    });
    this.on("pointerdown", () => {
      this.charging = true;
    });
    this.on("pointerup", () => {
      this.fire();
    });
    this.on("pointerupoutside", () => {
      this.fire();
    });

    this.reticle.position.set(this.pointerX, this.pointerY);
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
      simbaLine: "Steady first, superstar. We'll do a tiny practice run before the shrine starts keeping score.",
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
    this.phase = "demo";
    this.demoHits = 0;
    this.resetRunState();
    this.status = "Practice first. Wake two calm lights, then the real lantern court begins.";
    this.game.showGuidance({
      objectiveTitle: `${this.trial.title} Demo`,
      objectiveText: this.getDemoObjectiveText(),
      simbaPrompt: "Take your time. Nothing counts yet except finding the stillness.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Practice run",
      tutorialText: "Wake two practice lights before the live lantern court opens.",
    });
    this.refreshHud();
  }

  private async completeDemo(): Promise<void> {
    if (this.phase !== "demo") {
      return;
    }

    this.phase = "ready";
    this.clearTargets();
    this.focus = 0;
    this.charging = false;
    this.status = "The live lantern court is awake now.";
    this.refreshHud();

    await this.game.showGiftPrep({
      eyebrow: "Demo Complete",
      title: this.trial.title,
      subtitle: "The real lantern court is awake.",
      description: "The practice glow is done. This time the shrine record will count every clean shot.",
      simbaLine: "There you are. Same hands, same calm. Now let it be the real one.",
      instructions: this.trial.instructions,
      controlsHint: this.getControlsHint(),
      focusLabel: "Live run",
      focusText: "The timer and shrine record begin as soon as you continue.",
      primaryLabel: "Start Gift",
    });

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.beginLiveRun();
  }

  private beginLiveRun(): void {
    this.phase = "live";
    this.resetRunState();
    this.status = "The distant lanterns are listening for stillness.";
    this.game.showGuidance({
      objectiveTitle: this.trial.objectiveTitle,
      objectiveText: this.trial.objectiveText,
      simbaPrompt: "Breathe first. The lanterns will meet you there.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Live run",
      tutorialText: "This time the shrine record counts.",
    });
    this.refreshHud();
  }

  private resetRunState(): void {
    this.clearTargets();
    this.scoreSystem.reset();
    this.comboSystem.reset();
    this.spawnTimer = 0;
    this.remainingTime = 62;
    this.totalShots = 0;
    this.hitShots = 0;
    this.misses = 0;
    this.perfectHits = 0;
    this.focus = 0;
    this.charging = false;
    this.targetCounter = 0;
  }

  private clearTargets(): void {
    this.targets.forEach((target) => {
      if (target.node.parent) {
        target.node.parent.removeChild(target.node);
      }
    });
    this.targets = [];
  }

  private getDemoObjectiveText(): string {
    return `${this.trial.demoObjective} (${this.demoHits}/${MARKSMAN_DEMO_GOAL})`;
  }

  private createRangeBackdrop(): Container {
    const container = new Container();

    const platform = new Graphics();
    platform.rect(180, 620, 1080, 100).fill({ color: 0x0e1018, alpha: 0.94 });

    const shrineWall = new Graphics();
    shrineWall.roundRect(220, 220, 1000, 340, 28).fill({ color: 0x15121d, alpha: 0.8 });
    shrineWall.roundRect(280, 270, 880, 240, 18).stroke({ color: 0xf5efe0, width: 2, alpha: 0.18 });

    const lanternGlow = new Graphics();
    lanternGlow.circle(720, 180, 150).fill({ color: 0xf5c542, alpha: 0.08 });

    container.addChild(platform, shrineWall, lanternGlow);
    return container;
  }

  private createReticle(): void {
    this.reticle.removeChildren();

    const crosshair = new Graphics();
    crosshair.circle(0, 0, 22).stroke({ color: 0xf5efe0, width: 2, alpha: 0.95 });
    crosshair.moveTo(-28, 0).lineTo(28, 0).stroke({ color: 0xf5efe0, width: 2, alpha: 0.75 });
    crosshair.moveTo(0, -28).lineTo(0, 28).stroke({ color: 0xf5efe0, width: 2, alpha: 0.75 });

    this.reticle.addChild(this.focusRing, crosshair);
  }

  private updateScene(deltaMs: number): void {
    if (this.ended || this.phase === "briefing" || this.phase === "ready") {
      return;
    }

    if (this.phase === "live") {
      this.remainingTime -= deltaMs / 1000;
    }

    this.spawnTimer -= deltaMs / 1000;

    if (this.charging) {
      this.focus = clamp(this.focus + deltaMs / 650, 0, 1);
    }

    this.drawFocusRing();

    if (this.spawnTimer <= 0) {
      this.spawnTarget();
    }

    const deltaSeconds = deltaMs / 1000;
    this.updateFlashes(deltaSeconds);

    this.targets = this.targets.filter((target) => {
      target.life -= deltaSeconds;
      target.node.x += target.vx * deltaSeconds;
      target.node.y += target.vy * deltaSeconds;

      if (target.node.x < 220 || target.node.x > 1220) {
        target.vx *= -1;
      }

      if (target.node.y < 220 || target.node.y > 560) {
        target.vy *= -1;
      }

      target.node.alpha = clamp(target.life / target.maxLife, 0.15, 1);

      if (target.life <= 0) {
        this.removeChild(target.node);
        if (this.phase === "live") {
          this.misses += 1;
          this.comboSystem.registerFailure();
          this.status = "A distant light slipped away. No rush. Another one will rise.";
        } else {
          this.status = "That practice light drifted away. Another gentle glow is already on its way.";
          this.game.updateGuidance({
            simbaPrompt: "Easy. Let the light arrive instead of chasing it.",
          });
        }
        return false;
      }

      return true;
    });

    this.refreshHud();

    if (this.phase === "live" && this.remainingTime <= 0) {
      void this.finishTrial();
    }
  }

  private spawnTarget(): void {
    const isDemo = this.phase === "demo";
    const wave = isDemo ? 1 : this.remainingTime > 42 ? 1 : this.remainingTime > 20 ? 2 : 3;
    const baseRadius = isDemo ? 38 : wave === 1 ? 34 : wave === 2 ? 30 : 26;
    const radius = baseRadius * (this.game.isMobile() ? 1.3 : 1);
    const moving = isDemo ? false : Math.random() > (wave === 1 ? 0.58 : 0.34);
    const x = randomRange(280, 1160);
    const y = randomRange(240, 530);

    const node = new Container();
    node.position.set(x, y);

    const glow = new Graphics();
    glow.circle(0, 0, radius + 24).fill({ color: 0xf5c542, alpha: 0.12 });

    const body = new Graphics();
    body.circle(0, 0, radius).fill({ color: 0x2c1636, alpha: 0.92 });
    body.circle(0, 0, radius - 7).stroke({ color: 0xf5efe0, width: 2, alpha: 0.76 });
    body.moveTo(-radius / 2, -radius / 2).lineTo(radius / 2, radius / 2).stroke({
      color: 0xf5c542,
      width: 2,
      alpha: 0.7,
    });
    body.moveTo(radius / 2, -radius / 2).lineTo(-radius / 2, radius / 2).stroke({
      color: 0xf5c542,
      width: 2,
      alpha: 0.7,
    });

    node.addChild(glow, body);
    this.addChildAt(node, this.children.length - 2);

    this.targets.push({
      id: this.targetCounter += 1,
      node,
      radius,
      vx: moving ? randomRange(-70, 70) : 0,
      vy: moving ? randomRange(-45, 45) : 0,
      life: isDemo ? 5.5 : randomRange(2.2, 3.8),
      maxLife: isDemo ? 5.5 : 3.8,
    });

    this.spawnTimer = isDemo ? 1.2 : wave === 1 ? 0.95 : wave === 2 ? 0.74 : 0.56;
  }

  private fire(): void {
    const liveRun = this.phase === "live";
    const demoRun = this.phase === "demo";

    if (this.ended || (!liveRun && !demoRun) || !this.charging) {
      this.charging = false;
      return;
    }

    if (liveRun) {
      this.totalShots += 1;
    }

    this.charging = false;

    const closest = this.targets
      .map((target) => ({
        target,
        distance: Math.hypot(target.node.x - this.pointerX, target.node.y - this.pointerY),
      }))
      .sort((left, right) => left.distance - right.distance)[0];

    const effectiveRadius = closest?.target.radius ? closest.target.radius * (this.game.isMobile() ? 1.25 : 1) : 0;

    if (!closest || closest.distance > effectiveRadius) {
      this.focus = 0;
      if (liveRun) {
        this.comboSystem.registerFailure();
        this.misses += 1;
        this.status = "Not quite. Let your hands settle and wake the next light.";
      } else {
        this.status = "Almost. Let the reticle settle into stillness a little longer.";
        this.game.updateGuidance({
          simbaPrompt: "You don't need to hurry. The stillness is what wakes it.",
        });
      }
      this.refreshHud();
      return;
    }

    const { target, distance } = closest;
    const accuracy = clamp(1 - distance / effectiveRadius, 0, 1);
    const focusBonus = this.focus;
    this.focus = 0;
    const perfectThreshold = this.game.isMobile() ? 0.72 : 0.86;
    const greatThreshold = this.game.isMobile() ? 0.45 : 0.6;

    if (liveRun) {
      const multiplier = this.comboSystem.getMultiplier();

      let label = "Good";
      let points = 55;

      if (accuracy > perfectThreshold) {
        label = "Perfect";
        points = 110;
        this.perfectHits += 1;
      } else if (accuracy > greatThreshold) {
        label = "Great";
        points = 80;
      }

      this.comboSystem.registerSuccess();
      this.hitShots += 1;
      this.scoreSystem.add(points * multiplier + focusBonus * 30);
      this.status =
        label === "Perfect"
          ? "Lovely. The distant light answered right away."
          : `${label} hit. The lantern softened under your calm.`;
    } else {
      this.demoHits += 1;
      this.status =
        this.demoHits >= MARKSMAN_DEMO_GOAL
          ? "Lovely. Practice complete."
          : "Lovely. One more practice hit and the real court opens.";
      this.game.updateGuidance({
        objectiveText: this.getDemoObjectiveText(),
        simbaPrompt:
          this.demoHits >= MARKSMAN_DEMO_GOAL
            ? "See? I knew you'd get that."
            : "That's it. Same calm one more time.",
        tutorialTitle: "Practice run",
        tutorialText: "No score yet. Just get comfortable with the stillness.",
      });
    }

    this.spawnHitFlash(target.node.x, target.node.y, 0xf5c542, target.radius);
    this.removeChild(target.node);
    this.targets = this.targets.filter((existing) => existing.id !== target.id);
    this.refreshHud();

    if (demoRun && this.demoHits >= MARKSMAN_DEMO_GOAL) {
      void this.completeDemo();
    }
  }

  private drawFocusRing(): void {
    this.focusRing.clear();
    this.focusRing.circle(0, 0, 32 + this.focus * 18).stroke({
      color: 0x6ec6ff,
      width: 2,
      alpha: 0.35 + this.focus * 0.6,
    });
  }

  private spawnHitFlash(x: number, y: number, tint: number, radius: number): void {
    const flash = new Graphics();
    this.feedbackLayer.addChild(flash);
    this.flashes.push({
      node: flash,
      x,
      y,
      radius,
      life: 0,
      maxLife: this.game.isMobile() ? 0.15 : 0.12,
      tint,
    });
  }

  private updateFlashes(deltaSeconds: number): void {
    const nextFlashes: HitFlash[] = [];

    this.flashes.forEach((flash) => {
      flash.life += deltaSeconds;
      const progress = clamp(flash.life / flash.maxLife, 0, 1);
      const bloomRadius = flash.radius * (this.game.isMobile() ? 2.4 : 1.9);
      const alpha = 1 - progress;

      flash.node.clear();
      flash.node.circle(flash.x, flash.y, bloomRadius * (0.55 + progress * 0.25)).fill({
        color: flash.tint,
        alpha: alpha * 0.24,
      });
      flash.node.circle(flash.x, flash.y, bloomRadius * (0.9 + progress * 0.38)).stroke({
        color: 0xf5efe0,
        width: 3,
        alpha: alpha * 0.95,
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
    if (this.phase === "demo") {
      this.hud.updateValues({
        title: `${this.trial.title} Demo`,
        subtitle: this.getDemoObjectiveText(),
        score: 0,
        comboLabel: "Practice only",
        timerLabel: "Demo Run",
        status: this.status,
      });
      return;
    }

    if (this.phase === "briefing" || this.phase === "ready") {
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
      comboLabel: `Stillness streak  ${this.comboSystem.getCombo()}`,
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
    this.clearTargets();

    const accuracy = this.totalShots > 0 ? (this.hitShots / this.totalShots) * 100 : 0;
    const reveal = GIFT_REVEALS.marksman;
    const result = {
      trialId: "marksman" as const,
      title: this.trial.title,
      subtitle: "Head back into the courtyard and see what the first glow changed.",
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
        value: formatPercent(accuracy),
      },
      metrics: this.game.createResultMetrics([
        { label: "Longest Streak", value: String(this.comboSystem.getMaxCombo()) },
        { label: "Perfect Hits", value: String(this.perfectHits) },
        { label: "Misses", value: String(this.misses) },
        { label: "Shrine Record", value: formatScore(this.scoreSystem.getScore()) },
      ]),
      ctaLabel: reveal.ctaLabel,
    };

    this.game.recordTrialResult(result, {
      accuracy,
      maxCombo: this.comboSystem.getMaxCombo(),
      perfectHits: this.perfectHits,
      mistakes: this.misses,
    });

    await this.game.showResults(result);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    await this.game.returnToHub();
  }
}
