import { buildCreditsReflection } from "@/game/data/ending";
import { Graphics } from "pixi.js";
import { CREDITS_MESSAGE, ENDING_DIALOGUE } from "@/game/data/dialogue";
import { BaseScene } from "@/game/scenes/BaseScene";
import { EffectsSystem } from "@/game/systems/EffectsSystem";

export class EndingScene extends BaseScene {
  readonly id = "ending" as const;

  async init(): Promise<void> {
    this.removeChildren();

    const backdrop = this.createNightBackdrop(1);
    const petals = EffectsSystem.createPetalField(1440, 810, 40);
    const heading = this.createSceneHeading(
      "Inner Shrine",
      "Every lantern is awake now, and Simba has one last thing to say.",
    );

    const altarGlow = new Graphics();
    altarGlow.circle(720, 420, 220).fill({ color: 0xf5c542, alpha: 0.16 });
    altarGlow.circle(720, 420, 120).fill({ color: 0xf8b4c8, alpha: 0.14 });

    const altar = new Graphics();
    altar.roundRect(530, 320, 380, 220, 30).fill({ color: 0x25142f, alpha: 0.82 });
    altar.roundRect(530, 320, 380, 220, 30).stroke({ color: 0xf5efe0, width: 2, alpha: 0.65 });
    altar.rect(640, 250, 160, 90).fill({ color: 0x7c1426, alpha: 0.9 });

    this.addChild(backdrop, altarGlow, altar, petals.container, heading);
    this.addUpdater(petals.update);
  }

  async enter(): Promise<void> {
    this.game.hideHubOverlay();
    this.game.clearGuidance();
    void this.runEndingSequence();
  }

  private async runEndingSequence(): Promise<void> {
    await this.game.showDialogue(ENDING_DIALOGUE, false);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.game.setEndingSeen();
    await this.game.showCredits(
      "One Last Thing",
      CREDITS_MESSAGE,
      buildCreditsReflection(this.game.getSaveData()),
    );

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    await this.game.returnToHub();
  }
}
