import { Graphics } from "pixi.js";
import { BaseScene } from "@/game/scenes/BaseScene";
import { EffectsSystem } from "@/game/systems/EffectsSystem";

export class TitleScene extends BaseScene {
  readonly id = "title" as const;

  async init(): Promise<void> {
    this.removeChildren();

    const backdrop = this.createNightBackdrop(0.15);
    const petals = EffectsSystem.createPetalField(1440, 810, 20);
    const heading = this.createSceneHeading(
      "Aanavee",
      "The Seven Gifts",
    );

    const shrine = new Graphics();
    shrine.roundRect(530, 300, 380, 210, 28).fill({ color: 0x160f21, alpha: 0.7 });
    shrine.roundRect(560, 336, 320, 130, 18).stroke({ color: 0xf5c542, width: 3, alpha: 0.55 });

    this.addChild(backdrop, shrine, petals.container, heading);
    this.addUpdater(petals.update);
  }
}
