import { Container, Graphics } from "pixi.js";
import { OPENING_DIALOGUE } from "@/game/data/dialogue";
import { BaseScene } from "@/game/scenes/BaseScene";
import { EffectsSystem } from "@/game/systems/EffectsSystem";

export class IntroScene extends BaseScene {
  readonly id = "intro" as const;

  async init(): Promise<void> {
    this.removeChildren();

    const backdrop = this.createNightBackdrop(0.14);
    const shrineGate = this.createShrineGate();
    const petals = EffectsSystem.createPetalField(1440, 810, 30);
    const heading = this.createSceneHeading(
      "Aanavee: The Seven Gifts",
      "Simba wakes the shrine with a quiet little grin.",
    );

    this.addChild(backdrop, shrineGate, petals.container, heading);
    this.addUpdater(petals.update);
  }

  async enter(): Promise<void> {
    this.game.hideHubOverlay();
    this.game.clearGuidance();
    void this.runIntroSequence();
  }

  private createShrineGate(): Container {
    const gate = new Container();
    gate.position.set(0, 0);

    const mainBeam = new Graphics();
    mainBeam.rect(360, 246, 720, 34).fill(0x6d1120);
    mainBeam.rect(410, 288, 620, 28).fill(0x7c1426);
    mainBeam.rect(470, 288, 34, 292).fill(0x501218);
    mainBeam.rect(936, 288, 34, 292).fill(0x501218);

    const stairs = new Graphics();
    stairs.rect(500, 620, 440, 26).fill(0x1b1a23);
    stairs.rect(450, 650, 540, 24).fill(0x1b1a23);
    stairs.rect(390, 680, 660, 26).fill(0x1b1a23);

    const lanternLeft = EffectsSystem.createLantern(458, 454, 0xf5c542, true);
    const lanternRight = EffectsSystem.createLantern(982, 454, 0xf5c542, true);

    gate.addChild(mainBeam, stairs, lanternLeft, lanternRight);
    return gate;
  }

  private async runIntroSequence(): Promise<void> {
    await this.game.showDialogue(OPENING_DIALOGUE);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.game.setOpeningSeen();
    await this.game.goToScene("followSimba");
  }
}
