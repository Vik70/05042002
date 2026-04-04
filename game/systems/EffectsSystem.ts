import { Container, Graphics } from "pixi.js";
import { COLORS } from "@/lib/constants";
import { randomRange } from "@/lib/utils";

export interface AnimatedEffect {
  container: Container;
  update: (deltaMs: number) => void;
}

export class EffectsSystem {
  static createGlowOrb(x: number, y: number, radius: number, tint: number, alpha = 0.3): Graphics {
    const orb = new Graphics();
    orb.circle(0, 0, radius).fill({ color: tint, alpha });
    orb.position.set(x, y);
    return orb;
  }

  static createLantern(x: number, y: number, tint: number, lit = true): Container {
    const lantern = new Container();
    lantern.position.set(x, y);

    const pole = new Graphics();
    pole.rect(-5, 16, 10, 80).fill(0x4f2a1f);

    const body = new Graphics();
    body.roundRect(-34, -20, 68, 74, 14).fill(0x2b1733);
    body.roundRect(-26, -12, 52, 58, 12).fill({ color: tint, alpha: lit ? 0.86 : 0.18 });

    const frame = new Graphics();
    frame.roundRect(-34, -20, 68, 74, 14).stroke({ color: 0xf8e7ad, width: 3, alpha: 0.9 });

    if (lit) {
      const glow = this.createGlowOrb(0, 8, 56, tint, 0.22);
      lantern.addChild(glow);
    }

    lantern.addChild(pole, body, frame);
    return lantern;
  }

  static createPetalField(
    width: number,
    height: number,
    count: number,
    tint: number = COLORS.sakura,
  ): AnimatedEffect {
    const container = new Container();
    const petals = Array.from({ length: count }, (_, index) => {
      const petal = new Graphics();
      petal.ellipse(0, 0, 6, 10).fill({ color: tint, alpha: 0.75 });
      petal.position.set(randomRange(0, width), randomRange(0, height));
      petal.rotation = randomRange(0, Math.PI * 2);
      petal.alpha = 0.35 + Math.random() * 0.65;
      container.addChild(petal);

      return {
        node: petal,
        drift: randomRange(18, 54),
        sway: randomRange(0.002, 0.006),
        offset: index * 1.2,
      };
    });

    const update = (deltaMs: number): void => {
      petals.forEach((petal) => {
        petal.node.y += (petal.drift * deltaMs) / 1000;
        petal.node.x += Math.sin((petal.node.y + petal.offset) * petal.sway) * 0.6 * deltaMs;
        petal.node.rotation += 0.0018 * deltaMs;

        if (petal.node.y > height + 20) {
          petal.node.y = -20;
          petal.node.x = randomRange(0, width);
        }

        if (petal.node.x < -20) {
          petal.node.x = width + 20;
        } else if (petal.node.x > width + 20) {
          petal.node.x = -20;
        }
      });
    };

    return { container, update };
  }
}
