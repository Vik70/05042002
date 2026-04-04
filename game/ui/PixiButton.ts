import { Container, Graphics, Text, TextStyle } from "pixi.js";

interface PixiButtonOptions {
  label: string;
  width: number;
  height: number;
  tint?: number;
  onClick: () => void;
}

const labelStyle = new TextStyle({
  fill: 0xf5efe0,
  fontFamily: "Georgia, serif",
  fontSize: 20,
  fontWeight: "600",
});

export class PixiButton extends Container {
  private background = new Graphics();
  private labelText: Text;

  constructor(options: PixiButtonOptions) {
    super();

    const tint = options.tint ?? 0x7c5cbf;

    this.background.roundRect(0, 0, options.width, options.height, 18).fill({
      color: tint,
      alpha: 0.88,
    });
    this.background.roundRect(0, 0, options.width, options.height, 18).stroke({
      color: 0xf5efe0,
      width: 2,
      alpha: 0.8,
    });

    this.labelText = new Text({ text: options.label, style: labelStyle });
    this.labelText.anchor.set(0.5);
    this.labelText.position.set(options.width / 2, options.height / 2);

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointertap", options.onClick);
    this.on("pointerover", () => {
      this.scale.set(1.03);
      this.alpha = 1;
    });
    this.on("pointerout", () => {
      this.scale.set(1);
      this.alpha = 0.95;
    });

    this.alpha = 0.95;
    this.addChild(this.background, this.labelText);
  }
}
