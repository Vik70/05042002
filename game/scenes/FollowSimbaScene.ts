import { Assets, Container, Graphics, Sprite } from "pixi.js";
import { FOLLOW_SIMBA_DIALOGUE } from "@/game/data/dialogue";
import { BaseScene } from "@/game/scenes/BaseScene";
import { EffectsSystem } from "@/game/systems/EffectsSystem";
import { clamp, lerp } from "@/lib/utils";

export class FollowSimbaScene extends BaseScene {
  readonly id = "followSimba" as const;

  private readonly petals = EffectsSystem.createPetalField(1440, 810, 30, 0xf8b4c8);
  private readonly simba = new Container();
  private readonly simbaGlow = new Graphics();
  private readonly playerGlow = new Graphics();
  private readonly pathDots = new Container();

  private readonly waypoints = [
    { x: 450, y: 560, prompt: "Stay close to Simba and follow the first lantern glow." },
    { x: 680, y: 455, prompt: "That's it. The shrine is opening a path for Aanavee now." },
    { x: 915, y: 365, prompt: "One more little step. The first gift is waiting just ahead." },
  ];

  private currentWaypointIndex = 0;
  private completed = false;
  private targetX = 320;
  private targetY = 620;
  private playerX = 320;
  private playerY = 620;
  private simbaX = 420;
  private simbaY = 560;
  private proximityMs = 0;

  async init(): Promise<void> {
    this.removeChildren();
    this.currentWaypointIndex = 0;
    this.completed = false;
    this.targetX = 320;
    this.targetY = 620;
    this.playerX = 320;
    this.playerY = 620;
    this.simbaX = this.waypoints[0].x;
    this.simbaY = this.waypoints[0].y;
    this.proximityMs = 0;

    const backdrop = this.createNightBackdrop(0.18);
    const walkway = this.createWalkway();
    this.drawPlayerGlow();
    await this.drawSimba();
    this.drawPathDots();

    this.addChild(
      backdrop,
      walkway,
      this.pathDots,
      this.simba,
      this.playerGlow,
      this.petals.container,
    );

    this.addUpdater(this.petals.update);
    this.addUpdater((deltaMs) => this.updateScene(deltaMs));

    this.on("pointermove", (event) => {
      const point = this.game.toLogicalPoint(event.global.x, event.global.y);
      const bounds = this.game.getVisibleBounds();
      this.targetX = clamp(point.x, bounds.left + 24, bounds.right - 24);
      this.targetY = clamp(point.y, Math.max(bounds.top + 220, 220), Math.min(bounds.bottom - 130, 680));
    });

    this.on("pointertap", (event) => {
      const point = this.game.toLogicalPoint(event.global.x, event.global.y);
      const bounds = this.game.getVisibleBounds();
      this.targetX = clamp(point.x, bounds.left + 24, bounds.right - 24);
      this.targetY = clamp(point.y, Math.max(bounds.top + 220, 220), Math.min(bounds.bottom - 130, 680));
    });
  }

  async enter(): Promise<void> {
    this.game.hideHubOverlay();
    this.game.showGuidance({
      objectiveTitle: "Follow Simba",
      objectiveText: this.waypoints[0].prompt,
      simbaPrompt: "Just keep with me. Nice and easy.",
      controlsHint: this.game.isMobile()
        ? "Drag or tap to guide Aanavee's glow through the shrine light."
        : "Guide Aanavee's glow through the shrine light.",
      tutorialTitle: "Guided opening",
      tutorialText: "Bring Aanavee's glow close to Simba whenever he stops.",
    });
  }

  private createWalkway(): Container {
    const container = new Container();

    const ground = new Graphics();
    ground.rect(0, 560, 1440, 250).fill({ color: 0x11111c, alpha: 0.96 });

    const path = new Graphics();
    path.moveTo(250, 660)
      .quadraticCurveTo(430, 560, 540, 560)
      .quadraticCurveTo(710, 545, 770, 460)
      .quadraticCurveTo(860, 370, 980, 360)
      .stroke({ color: 0xf5efe0, width: 10, alpha: 0.22 });

    const gate = new Graphics();
    gate.rect(1010, 220, 240, 24).fill({ color: 0x6d1120, alpha: 0.92 });
    gate.rect(1040, 250, 180, 20).fill({ color: 0x7c1426, alpha: 0.92 });
    gate.rect(1080, 250, 24, 200).fill({ color: 0x501218, alpha: 0.94 });
    gate.rect(1158, 250, 24, 200).fill({ color: 0x501218, alpha: 0.94 });

    const gateGlow = new Graphics();
    gateGlow.circle(1130, 330, 150).fill({ color: 0xf5c542, alpha: 0.12 });

    const lanternLeft = EffectsSystem.createLantern(1068, 402, 0xf5c542, true);
    const lanternRight = EffectsSystem.createLantern(1194, 402, 0xf5c542, true);

    container.addChild(ground, path, gateGlow, gate, lanternLeft, lanternRight);
    return container;
  }

  private updateScene(deltaMs: number): void {
    if (this.completed) {
      return;
    }

    const bounds = this.game.getVisibleBounds();
    this.playerX = lerp(this.playerX, this.targetX, Math.min(1, deltaMs / 180));
    this.playerY = lerp(this.playerY, this.targetY, Math.min(1, deltaMs / 180));
    this.playerX = clamp(this.playerX, bounds.left + 24, bounds.right - 24);
    this.playerY = clamp(this.playerY, Math.max(bounds.top + 220, 220), Math.min(bounds.bottom - 130, 680));

    const waypoint = this.waypoints[this.currentWaypointIndex];
    this.simbaX = lerp(this.simbaX, waypoint.x, Math.min(1, deltaMs / 260));
    this.simbaY = lerp(this.simbaY, waypoint.y, Math.min(1, deltaMs / 260));

    this.playerGlow.position.set(this.playerX, this.playerY);
    this.simba.position.set(this.simbaX, this.simbaY);

    const distance = Math.hypot(this.playerX - waypoint.x, this.playerY - waypoint.y);

    if (distance < 86) {
      this.proximityMs += deltaMs;
    } else {
      this.proximityMs = 0;
    }

    if (this.proximityMs > 550) {
      this.advanceWaypoint();
    }
  }

  private advanceWaypoint(): void {
    this.proximityMs = 0;

    if (this.currentWaypointIndex < this.waypoints.length - 1) {
      this.currentWaypointIndex += 1;
      this.drawPathDots();
      this.game.updateGuidance({
        objectiveText: this.waypoints[this.currentWaypointIndex].prompt,
        simbaPrompt:
          this.currentWaypointIndex === 1
            ? "There you go. This place is already warming up."
            : "Almost there. The first gift is feeling brave enough to glow.",
      });
      return;
    }

    void this.finishSequence();
  }

  private async finishSequence(): Promise<void> {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.game.showGuidance({
      objectiveTitle: "The first gift is awake",
      objectiveText: "Simba is leading Aanavee straight into the lantern court.",
      simbaPrompt: "See? I told you this place liked you.",
      controlsHint: "The first gift begins now.",
      tutorialTitle: "",
      tutorialText: "",
    });
    await this.game.showDialogue(FOLLOW_SIMBA_DIALOGUE);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.game.setFollowIntroSeen();
    this.game.startGift("marksman");
  }

  private drawPlayerGlow(): void {
    this.playerGlow.clear();
    this.playerGlow.circle(0, 0, 18).fill({ color: 0xf5efe0, alpha: 0.95 });
    this.playerGlow.circle(0, 0, 42).fill({ color: 0xf8b4c8, alpha: 0.18 });
    this.playerGlow.circle(0, 0, 72).fill({ color: 0x6ec6ff, alpha: 0.08 });
  }

  private async drawSimba(): Promise<void> {
    this.simba.removeChildren();
    this.simbaGlow.clear();
    this.simbaGlow.circle(0, -50, 78).fill({ color: 0xf5c542, alpha: 0.12 });
    this.simbaGlow.circle(0, -50, 122).fill({ color: 0xf5c542, alpha: 0.05 });

    const trailGlow = new Graphics();
    trailGlow.ellipse(0, 6, 62, 18).fill({ color: 0xf5c542, alpha: 0.12 });

    const texture = await Assets.load("/sprites/simba.png");

    if (this.destroyed) {
      return;
    }

    const simbaSprite = new Sprite(texture);
    const targetHeight = 154;
    const scale = targetHeight / simbaSprite.height;
    simbaSprite.scale.set(scale);
    simbaSprite.anchor.set(0.5, 0.92);
    simbaSprite.position.set(0, 10);

    this.simba.addChild(this.simbaGlow, trailGlow, simbaSprite);
  }

  private drawPathDots(): void {
    this.pathDots.removeChildren();

    this.waypoints.forEach((waypoint, index) => {
      const lit = index <= this.currentWaypointIndex;
      const dot = new Graphics();
      dot.circle(waypoint.x, waypoint.y, lit ? 12 : 9).fill({
        color: lit ? 0xf5c542 : 0xf5efe0,
        alpha: lit ? 0.85 : 0.24,
      });
      dot.circle(waypoint.x, waypoint.y, lit ? 28 : 20).fill({
        color: lit ? 0xf5c542 : 0xf8b4c8,
        alpha: lit ? 0.16 : 0.08,
      });
      this.pathDots.addChild(dot);
    });
  }
}
