import { Container, Graphics, Rectangle, Text, TextStyle } from "pixi.js";
import type { GameManager } from "@/game/core/GameManager";
import type { SceneId } from "@/game/types/game";
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from "@/lib/constants";

const titleStyle = new TextStyle({
  fill: 0xf5efe0,
  fontFamily: "Georgia, serif",
  fontSize: 52,
  fontWeight: "700",
});

const subtitleStyle = new TextStyle({
  fill: 0xf5efe0,
  fontFamily: "Georgia, serif",
  fontSize: 26,
  fontStyle: "italic",
});

export abstract class BaseScene extends Container {
  abstract readonly id: SceneId;
  protected readonly game: GameManager;
  private updaters = new Set<(deltaMs: number) => void>();

  constructor(game: GameManager) {
    super();
    this.game = game;
    this.sortableChildren = true;
    this.eventMode = "static";
    this.hitArea = new Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  async init(): Promise<void> {}

  async enter(): Promise<void> {}

  update(deltaMs: number): void {
    this.updaters.forEach((update) => update(deltaMs));
  }

  async exit(): Promise<void> {}

  destroyScene(): void {
    if (this.destroyed) {
      return;
    }

    this.removeAllListeners();
    this.updaters.clear();
    super.destroy({ children: true });
  }

  protected addUpdater(update: (deltaMs: number) => void): void {
    this.updaters.add(update);
  }

  protected createNightBackdrop(warmth = 0): Container {
    const container = new Container();

    const sky = new Graphics();
    sky.rect(-720, -1800, GAME_WIDTH + 1440, GAME_HEIGHT + 3600).fill(COLORS.shrineDark);

    const haze = new Graphics();
    haze.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, 440).fill({
      color: warmth > 0.3 ? COLORS.lanternGold : COLORS.spiritPurple,
      alpha: 0.08 + warmth * 0.08,
    });

    const moon = new Graphics();
    moon.circle(GAME_WIDTH * 0.78, 118, 68).fill({ color: 0xf7f2d3, alpha: 0.92 });

    const moonGlow = new Graphics();
    moonGlow.circle(GAME_WIDTH * 0.78, 118, 140).fill({ color: COLORS.spiritBlue, alpha: 0.12 });

    const ground = new Graphics();
    ground.rect(-480, GAME_HEIGHT - 150, GAME_WIDTH + 960, 1800).fill({ color: 0x090910, alpha: 0.94 });

    container.addChild(sky, moonGlow, haze, moon, ground);
    return container;
  }

  protected createSceneHeading(title: string, subtitle: string): Container {
    const mobile = this.game.isMobile();
    const bounds = this.game.getVisibleBounds();
    const compactMobile = mobile && bounds.right - bounds.left < GAME_WIDTH - 120;
    const headingX = mobile ? Math.max(bounds.left + (compactMobile ? 32 : 36), 60) : 68;
    const availableWidth = mobile ? Math.max(420, bounds.right - headingX - 36) : 760;
    const heading = new Container();
    const titleText = new Text({
      text: title,
      style: mobile
        ? new TextStyle({
            fill: 0xf5efe0,
            fontFamily: "Georgia, serif",
            fontSize: compactMobile ? 36 : 42,
            fontWeight: "700",
            wordWrap: true,
            wordWrapWidth: availableWidth,
          })
        : titleStyle,
    });
    const subtitleText = new Text({
      text: subtitle,
      style: mobile
        ? new TextStyle({
            fill: 0xf5efe0,
            fontFamily: "Georgia, serif",
            fontSize: compactMobile ? 20 : 22,
            fontStyle: "italic",
            wordWrap: true,
            wordWrapWidth: availableWidth,
          })
        : subtitleStyle,
    });
    subtitleText.position.set(0, compactMobile ? 44 : mobile ? 50 : 62);
    heading.position.set(headingX, compactMobile ? 96 : mobile ? 108 : 140);
    heading.addChild(titleText, subtitleText);
    return heading;
  }
}
