import { Container, Graphics } from "pixi.js";
import { TRIAL_DEFINITIONS } from "@/game/data/trials";
import { BaseScene } from "@/game/scenes/BaseScene";
import { EffectsSystem } from "@/game/systems/EffectsSystem";
import { COLORS, GAME_HEIGHT, GAME_WIDTH, HUB_GATE_POSITIONS } from "@/lib/constants";
import { randomRange } from "@/lib/utils";

export class HubScene extends BaseScene {
  readonly id = "hub" as const;

  async init(): Promise<void> {
    this.removeChildren();

    const save = this.game.getSaveData();
    const awakeningLevel = this.game.progression.getAwakeningLevel(save);
    const warmth = this.game.progression.getShrineWarmth(save);
    const backdrop = this.createShrineBackdrop(warmth, awakeningLevel);
    const petals = EffectsSystem.createPetalField(1440, 810, 28 + awakeningLevel * 10);
    const foxfire = this.createFoxfireField(6 + awakeningLevel * 5);
    const shrine = this.createShrine(warmth, awakeningLevel);

    this.addChild(backdrop, shrine, foxfire.container, petals.container);
    this.addUpdater(petals.update);
    this.addUpdater(foxfire.update);
  }

  async enter(): Promise<void> {
    this.game.showHubOverlay();
  }

  private createShrineBackdrop(warmth: number, awakeningLevel: number): Container {
    const container = new Container();

    const sky = new Graphics();
    sky.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: COLORS.shrineDark, alpha: 0.34 });

    const moonGlow = new Graphics();
    moonGlow.circle(GAME_WIDTH * 0.8, 118, 188).fill({ color: COLORS.spiritBlue, alpha: 0.08 });

    const warmthBloom = new Graphics();
    warmthBloom.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.44, 360).fill({
      color: warmth > 0.42 ? COLORS.lanternGold : COLORS.spiritPurple,
      alpha: 0.05 + awakeningLevel * 0.02,
    });

    const moon = new Graphics();
    moon.circle(GAME_WIDTH * 0.8, 118, 74).fill({ color: 0xf7f2d3, alpha: 0.84 });

    const lowerMist = new Graphics();
    lowerMist.rect(0, GAME_HEIGHT - 230, GAME_WIDTH, 250).fill({ color: 0x090910, alpha: 0.42 });

    const sideVignetteLeft = new Graphics();
    sideVignetteLeft.circle(-60, GAME_HEIGHT * 0.5, 260).fill({ color: COLORS.shrineDark, alpha: 0.16 });

    const sideVignetteRight = new Graphics();
    sideVignetteRight.circle(GAME_WIDTH + 60, GAME_HEIGHT * 0.48, 260).fill({
      color: COLORS.shrineDark,
      alpha: 0.16,
    });

    container.addChild(
      sky,
      sideVignetteLeft,
      sideVignetteRight,
      moonGlow,
      warmthBloom,
      moon,
      lowerMist,
    );

    return container;
  }

  private createShrine(warmth: number, awakeningLevel: number): Container {
    const save = this.game.getSaveData();
    const shrine = new Container();

    const platform = new Graphics();
    platform.rect(240, 540, 960, 160).fill({ color: 0x120d18, alpha: 0.7 });

    const building = new Graphics();
    building.roundRect(400, 280, 640, 260, 24).fill({ color: 0x171225, alpha: 0.52 });
    building.roundRect(450, 326, 540, 160, 18).stroke({ color: 0xf5efe0, width: 2, alpha: 0.26 });
    building.rect(570, 200, 300, 90).fill({ color: 0x290d1c, alpha: 0.58 });
    building.rect(440, 246, 560, 18).fill({ color: 0x6a1322, alpha: 0.92 });

    const innerGlow = new Graphics();
    innerGlow.circle(720, 378, 160).fill({
      color: warmth > 0.4 ? 0xf5c542 : 0x7c5cbf,
      alpha: 0.08 + warmth * 0.12,
    });

    const warmthHalo = new Graphics();
    warmthHalo.circle(720, 420, 290).fill({
      color: 0xf5c542,
      alpha: 0.05 + awakeningLevel * 0.035,
    });

    shrine.addChild(platform, building, innerGlow, warmthHalo);

    Object.values(TRIAL_DEFINITIONS).forEach((trial) => {
      const completed = save.completedTrials.includes(trial.id);
      const lantern = EffectsSystem.createLantern(
        (HUB_GATE_POSITIONS[trial.id].xPct / 100) * 1440,
        (HUB_GATE_POSITIONS[trial.id].yPct / 100) * 810,
        trial.accentColor,
        completed || warmth > 0.2,
      );

      const gateGlow = EffectsSystem.createGlowOrb(
        lantern.x,
        lantern.y + 6,
        completed ? 110 : 74,
        trial.accentColor,
        completed ? 0.2 : 0.08,
      );

      shrine.addChild(gateGlow, lantern);

      let pulse = 0;
      this.addUpdater((deltaMs) => {
        pulse += deltaMs / 1000;
        const intensity = completed ? 1 : 0.55 + warmth * 0.3;
        lantern.scale.set(0.97 + Math.sin(pulse * 2.2) * 0.02 * intensity);
        gateGlow.alpha = (completed ? 0.18 : 0.07) + (Math.sin(pulse * 1.8) + 1) * 0.02;
      });
    });

    if (awakeningLevel >= 1) {
      const lanternRow = [520, 640, 800, 920].map((x, index) =>
        EffectsSystem.createLantern(
          x,
          320 + (index % 2) * 14,
          0xf5c542,
          true,
        ),
      );
      shrine.addChild(...lanternRow);
    }

    if (awakeningLevel >= 2) {
      const treeGlowLeft = EffectsSystem.createGlowOrb(280, 420, 140, 0xf8b4c8, 0.14);
      const treeGlowRight = EffectsSystem.createGlowOrb(1160, 410, 140, 0x6ec6ff, 0.14);
      shrine.addChild(treeGlowLeft, treeGlowRight);
    }

    if (awakeningLevel >= 3) {
      const resonanceHalo = EffectsSystem.createGlowOrb(720, 470, 178, 0xf5efe0, 0.12);
      const voiceLanternLeft = EffectsSystem.createLantern(560, 520, 0xf8b4c8, true);
      const voiceLanternRight = EffectsSystem.createLantern(880, 520, 0x6ec6ff, true);
      shrine.addChild(resonanceHalo, voiceLanternLeft, voiceLanternRight);
    }

    if (awakeningLevel >= 4) {
      const roofBloom = EffectsSystem.createGlowOrb(720, 248, 132, 0xf5c542, 0.16);
      const blessingArc = new Graphics();
      [500, 580, 660, 720, 780, 860, 940].forEach((x, index) => {
        const y = 230 + Math.abs(3 - index) * 10;
        blessingArc.circle(x, y, 10).fill({
          color: index % 2 === 0 ? 0xf5efe0 : 0xf8b4c8,
          alpha: 0.78,
        });
        blessingArc.circle(x, y, 24).fill({
          color: index % 2 === 0 ? 0xf5c542 : 0x6ec6ff,
          alpha: 0.12,
        });
      });
      shrine.addChild(roofBloom, blessingArc);
    }

    if (this.game.isEndingUnlocked()) {
      const altar = new Graphics();
      altar.roundRect(610, 476, 220, 94, 22).fill({ color: 0x201530, alpha: 0.68 });
      altar.roundRect(610, 476, 220, 94, 22).stroke({ color: 0xf5c542, width: 3, alpha: 0.92 });

      const altarGlow = EffectsSystem.createGlowOrb(720, 520, 120, 0xf5c542, 0.22);
      shrine.addChild(altarGlow, altar);
    }

    return shrine;
  }

  private createFoxfireField(count: number): {
    container: Container;
    update: (deltaMs: number) => void;
  } {
    const container = new Container();
    const flames = Array.from({ length: count }, () => {
      const flame = new Graphics();
      flame.circle(0, 0, randomRange(4, 8)).fill({ color: 0xf5c542, alpha: 0.78 });
      flame.circle(0, 0, randomRange(12, 20)).fill({ color: 0xf8b4c8, alpha: 0.12 });
      flame.position.set(randomRange(180, 1240), randomRange(250, 590));
      container.addChild(flame);

      return {
        node: flame,
        vx: randomRange(-12, 12),
        vy: randomRange(-16, -6),
        sway: randomRange(0.002, 0.005),
      };
    });

    const update = (deltaMs: number): void => {
      flames.forEach((flame) => {
        flame.node.x += flame.vx * deltaMs / 1000 + Math.sin(flame.node.y * flame.sway) * 0.4;
        flame.node.y += flame.vy * deltaMs / 1000;
        flame.node.alpha = 0.55 + (Math.sin((flame.node.x + flame.node.y) * 0.02) + 1) * 0.12;

        if (flame.node.y < 180) {
          flame.node.y = randomRange(500, 640);
          flame.node.x = randomRange(180, 1240);
        }
      });
    };

    return { container, update };
  }
}
