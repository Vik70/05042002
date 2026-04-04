import type { BaseScene } from "@/game/scenes/BaseScene";
import type { GameManager } from "@/game/core/GameManager";
import type { SceneId } from "@/game/types/game";
import { SCENE_FADE_MS } from "@/lib/constants";
import { wait } from "@/lib/utils";

type SceneFactory = () => BaseScene;

export class SceneRouter {
  private factories = new Map<SceneId, SceneFactory>();
  private currentScene: BaseScene | null = null;
  private transitioning = false;
  private disposed = false;
  private transitionToken = 0;

  constructor(private readonly game: GameManager) {}

  register(sceneId: SceneId, factory: SceneFactory): void {
    this.factories.set(sceneId, factory);
  }

  getCurrentScene(): BaseScene | null {
    return this.currentScene;
  }

  async goTo(sceneId: SceneId): Promise<void> {
    if (this.disposed || this.game.isDestroyed() || this.transitioning) {
      return;
    }

    const factory = this.factories.get(sceneId);

    if (!factory) {
      if (this.disposed || this.game.isDestroyed()) {
        return;
      }

      throw new Error(`Scene "${sceneId}" is not registered.`);
    }

    const token = ++this.transitionToken;
    this.transitioning = true;
    this.game.setFade({ visible: true, mode: "out" });
    await wait(SCENE_FADE_MS);

    if (this.shouldAbort(token)) {
      this.transitioning = false;
      return;
    }

    if (this.currentScene) {
      await this.currentScene.exit();

      if (this.shouldAbort(token)) {
        this.transitioning = false;
        return;
      }

      this.game.app.stage.removeChild(this.currentScene);
      this.currentScene.destroyScene();
      this.currentScene = null;
    }

    const nextScene = factory();
    this.currentScene = nextScene;
    this.game.app.stage.addChild(nextScene);
    this.game.setSceneId(sceneId);
    this.game.events.emit("scene:change", { sceneId });

    await nextScene.init();

    if (this.shouldAbort(token)) {
      this.game.app.stage.removeChild(nextScene);
      if (this.currentScene === nextScene) {
        this.currentScene = null;
      }
      nextScene.destroyScene();
      this.transitioning = false;
      return;
    }

    await nextScene.enter();

    if (this.shouldAbort(token)) {
      this.game.app.stage.removeChild(nextScene);
      if (this.currentScene === nextScene) {
        this.currentScene = null;
      }
      nextScene.destroyScene();
      this.transitioning = false;
      return;
    }

    this.game.setFade({ visible: true, mode: "in" });
    await wait(Math.round(SCENE_FADE_MS * 0.65));

    if (this.shouldAbort(token)) {
      this.transitioning = false;
      return;
    }

    this.game.setFade({ visible: false, mode: "in" });
    this.transitioning = false;
  }

  update(deltaMs: number): void {
    this.currentScene?.update(deltaMs);
  }

  destroy(): void {
    this.disposed = true;
    this.transitionToken += 1;
    this.transitioning = false;

    this.currentScene?.destroyScene();
    this.currentScene = null;
    this.factories.clear();
  }

  private shouldAbort(token: number): boolean {
    return this.disposed || this.game.isDestroyed() || token !== this.transitionToken;
  }
}
