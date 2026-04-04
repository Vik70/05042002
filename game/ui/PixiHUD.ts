import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH } from "@/lib/constants";

interface VisibleBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PixiHUDValues {
  title: string;
  subtitle: string;
  score: number;
  comboLabel: string;
  timerLabel: string;
  status: string;
}

const defaultVisibleBounds = (): VisibleBounds => ({
  left: 0,
  right: GAME_WIDTH,
  top: 0,
  bottom: 810,
});

const headingStyle = new TextStyle({
  fill: 0xf5efe0,
  fontFamily: "Georgia, serif",
  fontSize: 34,
  fontWeight: "600",
});

const bodyStyle = new TextStyle({
  fill: 0xf5efe0,
  fontFamily: "Georgia, serif",
  fontSize: 22,
});

export class PixiHUD extends Container {
  private panel = new Graphics();
  private titleText = new Text({ text: "", style: headingStyle });
  private subtitleText = new Text({ text: "", style: bodyStyle });
  private scoreText = new Text({ text: "", style: bodyStyle });
  private comboText = new Text({ text: "", style: bodyStyle });
  private timerText = new Text({ text: "", style: bodyStyle });
  private statusText = new Text({ text: "", style: bodyStyle });
  private mobile = false;

  constructor(private readonly getVisibleBounds: () => VisibleBounds = defaultVisibleBounds) {
    super();

    this.addChild(
      this.panel,
      this.titleText,
      this.subtitleText,
      this.comboText,
      this.timerText,
      this.statusText,
      this.scoreText,
    );

    this.applyLayout();
  }

  setMobile(mobile: boolean): void {
    if (this.mobile === mobile) {
      return;
    }

    this.mobile = mobile;
    this.applyLayout();
  }

  updateValues(values: PixiHUDValues): void {
    this.applyLayout();
    this.titleText.text = values.title;
    this.subtitleText.text = values.subtitle;
    this.statusText.text = values.status;
    this.timerText.text = values.timerLabel;
    this.comboText.text = values.comboLabel;
    this.scoreText.text = `Shrine Record  ${Math.round(values.score)}`;
  }

  private applyLayout(): void {
    const bounds = this.getVisibleBounds();
    const visibleWidth = bounds.right - bounds.left;
    const compactMobile = this.mobile && visibleWidth < GAME_WIDTH - 120;
    const panelX = compactMobile ? bounds.left + 12 : 20;
    const panelWidth = compactMobile ? visibleWidth - 24 : GAME_WIDTH - 40;
    const panelHeight = compactMobile ? 126 : this.mobile ? 148 : 128;
    const bodyFontSize = compactMobile ? 18 : this.mobile ? 26 : 22;
    const headingFontSize = compactMobile ? 30 : this.mobile ? 40 : 34;
    const leftColumnX = panelX + (compactMobile ? 18 : 22);
    const rightColumnX = compactMobile ? panelX + panelWidth - 250 : this.mobile ? GAME_WIDTH - 382 : GAME_WIDTH - 322;
    const textColumnWidth = Math.max(320, rightColumnX - leftColumnX - (compactMobile ? 28 : 40));
    const panelRadius = compactMobile ? 20 : 24;

    this.panel.clear();
    this.panel.roundRect(panelX, 20, panelWidth, panelHeight, panelRadius).fill({
      color: 0x090914,
      alpha: 0.6,
    });
    this.panel.roundRect(panelX, 20, panelWidth, panelHeight, panelRadius).stroke({
      color: 0xf5efe0,
      width: 1,
      alpha: 0.08,
    });

    this.titleText.style.fontSize = headingFontSize;
    this.subtitleText.style.fontSize = bodyFontSize;
    this.scoreText.style.fontSize = bodyFontSize;
    this.comboText.style.fontSize = bodyFontSize;
    this.timerText.style.fontSize = bodyFontSize;
    this.statusText.style.fontSize = bodyFontSize;
    this.subtitleText.style.wordWrap = compactMobile;
    this.statusText.style.wordWrap = compactMobile;
    this.subtitleText.style.wordWrapWidth = textColumnWidth;
    this.statusText.style.wordWrapWidth = textColumnWidth;

    this.titleText.position.set(leftColumnX, compactMobile ? 24 : this.mobile ? 26 : 28);
    this.subtitleText.position.set(leftColumnX, compactMobile ? 56 : this.mobile ? 72 : 66);
    this.statusText.position.set(leftColumnX, compactMobile ? 88 : this.mobile ? 112 : 100);
    this.timerText.position.set(rightColumnX, compactMobile ? 24 : this.mobile ? 28 : 30);
    this.comboText.position.set(rightColumnX, compactMobile ? 56 : this.mobile ? 70 : 64);
    this.scoreText.position.set(rightColumnX, compactMobile ? 88 : this.mobile ? 112 : 98);
  }
}
