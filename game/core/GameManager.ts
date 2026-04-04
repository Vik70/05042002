import { Application } from "pixi.js";
import { AudioManager } from "@/game/core/AudioManager";
import { EventBus } from "@/game/core/EventBus";
import { InputManager } from "@/game/core/InputManager";
import { SaveManager } from "@/game/core/SaveManager";
import { SceneRouter } from "@/game/core/SceneRouter";
import { EndingScene } from "@/game/scenes/EndingScene";
import { FollowSimbaScene } from "@/game/scenes/FollowSimbaScene";
import { HubScene } from "@/game/scenes/HubScene";
import { IntroScene } from "@/game/scenes/IntroScene";
import { ApothecaryScene } from "@/game/scenes/ApothecaryScene";
import { MarksmanScene } from "@/game/scenes/MarksmanScene";
import { RallyScene } from "@/game/scenes/RallyScene";
import { TitleScene } from "@/game/scenes/TitleScene";
import { VoiceScene } from "@/game/scenes/VoiceScene";
import { DialogueSystem } from "@/game/systems/DialogueSystem";
import { ProgressionSystem } from "@/game/systems/ProgressionSystem";
import type {
  CreditsState,
  FadeState,
  GiftPrepState,
  GameEventMap,
  GuidanceState,
  HubOverlayState,
  ResultMetric,
  ResultsState,
  SceneId,
  TrialId,
  TrialResult,
  UIState,
} from "@/game/types/game";
import type { SaveData, TrialStats } from "@/game/types/save";
import { isTouchDevice } from "@/lib/hooks";
import { GAME_HEIGHT, GAME_WIDTH } from "@/lib/constants";

const PORTRAIT_CANVAS_ZOOM = 1.3;

interface VisibleBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const defaultVisibleBounds = (): VisibleBounds => ({
  left: 0,
  right: GAME_WIDTH,
  top: 0,
  bottom: GAME_HEIGHT,
});

const defaultResultsState = (): ResultsState => ({
  visible: false,
  result: null,
});

const defaultCreditsState = (): CreditsState => ({
  visible: false,
  title: "",
  message: "",
});

const defaultHubState = (): HubOverlayState => ({
  visible: false,
  title: "",
  subtitle: "",
  ambientLine: "",
  simbaPrompt: "",
  currentObjective: "",
  awakeningText: "",
  trials: [],
  endingUnlocked: false,
});

const defaultGuidanceState = (): GuidanceState => ({
  visible: false,
  objectiveTitle: "",
  objectiveText: "",
  simbaPrompt: "",
  controlsHint: "",
  tutorialTitle: "",
  tutorialText: "",
});

const defaultGiftPrepState = (): GiftPrepState => ({
  visible: false,
  eyebrow: "",
  title: "",
  subtitle: "",
  description: "",
  simbaLine: "",
  instructions: [],
  controlsHint: "",
  focusLabel: "",
  focusText: "",
  primaryLabel: "",
});

const defaultFadeState = (): FadeState => ({
  visible: false,
  mode: "in",
});

const defaultUiState = (): UIState => ({
  sceneId: "title",
  dialogue: {
    visible: false,
    lines: [],
    index: 0,
    canSkip: true,
  },
  results: defaultResultsState(),
  hub: defaultHubState(),
  guidance: defaultGuidanceState(),
  giftPrep: defaultGiftPrepState(),
  credits: defaultCreditsState(),
  fade: defaultFadeState(),
});

export class GameManager {
  public readonly events = new EventBus<GameEventMap>();
  public readonly audio = new AudioManager();
  public readonly input = new InputManager();
  public readonly progression = new ProgressionSystem();

  public app!: Application;

  private appDestroyed = false;
  private destroyed = false;
  private readonly saveManager = new SaveManager((data) => {
    this.events.emit("save:update", data);
    this.refreshHubOverlay();
  });

  private readonly dialogueSystem = new DialogueSystem((state) => {
    this.uiState = {
      ...this.uiState,
      dialogue: state,
    };
    this.emitUi();
  });

  private readonly sceneRouter = new SceneRouter(this);
  private uiState = defaultUiState();
  private hostElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private stageScale = { x: 1, y: 1 };
  private stageOffset = { x: 0, y: 0 };
  private visibleBounds = defaultVisibleBounds();
  private resultsResolver: (() => void) | null = null;
  private creditsResolver: (() => void) | null = null;
  private giftPrepResolver: (() => void) | null = null;

  private handleTick = (): void => {
    if (this.destroyed || !this.app?.ticker) {
      return;
    }

    this.sceneRouter.update(this.app.ticker.deltaMS);
  };

  async init(hostElement: HTMLElement): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.hostElement = hostElement;
    this.saveManager.load();
    this.input.attach();

    this.app = new Application();
    this.appDestroyed = false;
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      antialias: true,
      backgroundAlpha: 0,
      preference: "webgl",
    });

    if (this.destroyed) {
      this.safeDestroyApp();
      return;
    }

    this.app.canvas.style.width = "100%";
    this.app.canvas.style.height = "100%";
    this.app.canvas.style.display = "block";
    this.hostElement.appendChild(this.app.canvas);
    this.attachResizeObserver();
    this.resizeToHost();

    this.registerScenes();
    this.app.ticker.add(this.handleTick);

    if (this.destroyed) {
      return;
    }

    const save = this.saveManager.getData();
    const startingScene: SceneId = !save.openingSeen
      ? "intro"
      : !save.followIntroSeen && save.completedTrials.length === 0
        ? "followSimba"
        : "hub";
    await this.sceneRouter.goTo(startingScene);
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.dialogueSystem.skip();
    this.resultsResolver?.();
    this.creditsResolver?.();
    this.giftPrepResolver?.();
    this.resultsResolver = null;
    this.creditsResolver = null;
    this.giftPrepResolver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.app?.ticker?.remove?.(this.handleTick);
    this.sceneRouter.destroy();
    this.audio.destroy();
    this.input.detach();
    this.events.clear();
    this.safeDestroyApp();

    if (this.hostElement) {
      this.hostElement.innerHTML = "";
    }
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  getSaveData(): SaveData {
    return this.saveManager.getData();
  }

  getUiState(): UIState {
    return this.uiState;
  }

  getScale(): { x: number; y: number } {
    return { ...this.stageScale };
  }

  getVisibleBounds(): VisibleBounds {
    return { ...this.visibleBounds };
  }

  isMobile(): boolean {
    return (this.hostElement?.clientWidth ?? GAME_WIDTH) < 768 || isTouchDevice();
  }

  toLogicalPoint(x: number, y: number): { x: number; y: number } {
    const scaleX = this.stageScale.x || 1;
    const scaleY = this.stageScale.y || 1;

    return {
      x: (x - this.stageOffset.x) / scaleX,
      y: (y - this.stageOffset.y) / scaleY,
    };
  }

  subscribeUi(listener: (state: UIState) => void): () => void {
    return this.events.on("ui:update", listener);
  }

  setSceneId(sceneId: SceneId): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      sceneId,
      hub: sceneId === "hub" ? this.progression.getHubState(this.getSaveData()) : defaultHubState(),
    };
    this.emitUi();
  }

  setFade(nextFade: FadeState): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      fade: nextFade,
    };
    this.emitUi();
  }

  async showDialogue(lines: UIState["dialogue"]["lines"], canSkip = true): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await this.dialogueSystem.present(lines, canSkip);
  }

  advanceDialogue(): void {
    this.dialogueSystem.advance();
  }

  skipDialogue(): void {
    this.dialogueSystem.skip();
  }

  showResults(result: TrialResult): Promise<void> {
    if (this.destroyed) {
      return Promise.resolve();
    }

    this.uiState = {
      ...this.uiState,
      guidance: defaultGuidanceState(),
      giftPrep: defaultGiftPrepState(),
      results: {
        visible: true,
        result,
      },
    };
    this.emitUi();

    return new Promise((resolve) => {
      this.resultsResolver = resolve;
    });
  }

  dismissResults(): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      giftPrep: defaultGiftPrepState(),
      results: defaultResultsState(),
    };
    this.emitUi();

    this.resultsResolver?.();
    this.resultsResolver = null;
  }

  showCredits(title: string, message: string): Promise<void> {
    if (this.destroyed) {
      return Promise.resolve();
    }

    this.uiState = {
      ...this.uiState,
      guidance: defaultGuidanceState(),
      giftPrep: defaultGiftPrepState(),
      credits: {
        visible: true,
        title,
        message,
      },
    };
    this.emitUi();

    return new Promise((resolve) => {
      this.creditsResolver = resolve;
    });
  }

  dismissCredits(): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      giftPrep: defaultGiftPrepState(),
      credits: defaultCreditsState(),
    };
    this.emitUi();

    this.creditsResolver?.();
    this.creditsResolver = null;
  }

  showGiftPrep(prep: Omit<GiftPrepState, "visible">): Promise<void> {
    if (this.destroyed) {
      return Promise.resolve();
    }

    this.uiState = {
      ...this.uiState,
      guidance: defaultGuidanceState(),
      giftPrep: {
        visible: true,
        ...prep,
      },
    };
    this.emitUi();

    return new Promise((resolve) => {
      this.giftPrepResolver = resolve;
    });
  }

  dismissGiftPrep(): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      giftPrep: defaultGiftPrepState(),
    };
    this.emitUi();

    this.giftPrepResolver?.();
    this.giftPrepResolver = null;
  }

  showHubOverlay(): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      guidance: defaultGuidanceState(),
      giftPrep: defaultGiftPrepState(),
      hub: this.progression.getHubState(this.getSaveData()),
    };
    this.emitUi();
  }

  hideHubOverlay(): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      giftPrep: defaultGiftPrepState(),
      hub: defaultHubState(),
    };
    this.emitUi();
  }

  startGift(trialId: TrialId): void {
    if (this.destroyed) {
      return;
    }

    this.events.emit("trial:start", { trialId });
    this.hideHubOverlay();
    void this.sceneRouter.goTo(trialId);
  }

  startTrial(trialId: TrialId): void {
    this.startGift(trialId);
  }

  startNextGift(): void {
    const nextGiftId = this.progression.getNextGiftId(this.getSaveData()) ?? "marksman";
    this.startGift(nextGiftId);
  }

  openEnding(): void {
    if (this.destroyed) {
      return;
    }

    this.hideHubOverlay();
    void this.sceneRouter.goTo("ending");
  }

  async goToScene(sceneId: SceneId): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await this.sceneRouter.goTo(sceneId);
  }

  async returnToHub(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await this.sceneRouter.goTo("hub");
  }

  setIntroSeen(): void {
    this.saveManager.setIntroSeen(true);
  }

  setOpeningSeen(): void {
    this.saveManager.setOpeningSeen(true);
  }

  setFollowIntroSeen(): void {
    this.saveManager.setFollowIntroSeen(true);
  }

  setEndingSeen(): void {
    this.saveManager.setEndingSeen(true);
  }

  showGuidance(guidance: Omit<GuidanceState, "visible">): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      giftPrep: defaultGiftPrepState(),
      guidance: {
        ...defaultGuidanceState(),
        visible: true,
        ...guidance,
      },
    };
    this.emitUi();
  }

  updateGuidance(patch: Partial<Omit<GuidanceState, "visible">>): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      giftPrep: defaultGiftPrepState(),
      guidance: {
        ...this.uiState.guidance,
        ...patch,
        visible: true,
      },
    };
    this.emitUi();
  }

  clearGuidance(): void {
    if (this.destroyed) {
      return;
    }

    this.uiState = {
      ...this.uiState,
      guidance: defaultGuidanceState(),
    };
    this.emitUi();
  }

  recordTrialResult(
    result: TrialResult,
    stats: Partial<TrialStats>,
  ): SaveData {
    if (this.destroyed) {
      return this.getSaveData();
    }

    const updatedSave = this.saveManager.recordTrialResult(result.trialId, {
      score: result.score,
      rank: result.rank,
      stats,
    });

    this.events.emit("trial:complete", result);
    return updatedSave;
  }

  createResultMetrics(metrics: Array<ResultMetric>): ResultMetric[] {
    return metrics;
  }

  isEndingUnlocked(): boolean {
    return this.progression.isEndingUnlocked(this.getSaveData());
  }

  private emitUi(): void {
    if (this.destroyed) {
      return;
    }

    this.events.emit("ui:update", this.getUiState());
  }

  private refreshHubOverlay(): void {
    if (this.destroyed) {
      return;
    }

    if (this.uiState.sceneId === "hub") {
      this.showHubOverlay();
    }
  }

  private attachResizeObserver(): void {
    if (!this.hostElement || typeof ResizeObserver === "undefined") {
      return;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeToHost();
    });
    this.resizeObserver.observe(this.hostElement);
  }

  private resizeToHost(): void {
    if (!this.hostElement || !this.app?.renderer) {
      return;
    }

    const width = Math.max(1, Math.floor(this.hostElement.clientWidth));
    const height = Math.max(1, Math.floor(this.hostElement.clientHeight));
    const containerAspect = width / height;
    const gameAspect = GAME_WIDTH / GAME_HEIGHT;
    const portraitZoom = containerAspect < gameAspect ? PORTRAIT_CANVAS_ZOOM : 1;
    const scale = Math.min((width / GAME_WIDTH) * portraitZoom, height / GAME_HEIGHT);
    const scaledWidth = GAME_WIDTH * scale;
    const scaledHeight = GAME_HEIGHT * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    const overflowX = Math.max(0, scaledWidth - width);
    const overflowY = Math.max(0, scaledHeight - height);
    const cropX = overflowX / (2 * scale);
    const cropY = overflowY / (2 * scale);

    this.app.renderer.resize(width, height);
    this.stageScale = {
      x: scale,
      y: scale,
    };
    this.stageOffset = {
      x: offsetX,
      y: offsetY,
    };
    this.visibleBounds = {
      left: cropX,
      right: GAME_WIDTH - cropX,
      top: cropY,
      bottom: GAME_HEIGHT - cropY,
    };
    this.app.stage.scale.set(this.stageScale.x, this.stageScale.y);
    this.app.stage.position.set(this.stageOffset.x, this.stageOffset.y);
    this.syncCanvasCssVars(width, height, scaledWidth, scaledHeight);
  }

  private syncCanvasCssVars(
    hostWidth: number,
    hostHeight: number,
    scaledWidth: number,
    scaledHeight: number,
  ): void {
    const targets = [this.hostElement, this.hostElement?.parentElement].filter(
      (element): element is HTMLElement => Boolean(element),
    );
    const canvasTop = Math.max(0, this.stageOffset.y);
    const canvasBottom = Math.min(hostHeight, this.stageOffset.y + scaledHeight);
    const canvasLeft = Math.max(0, this.stageOffset.x);
    const canvasRight = Math.min(hostWidth, this.stageOffset.x + scaledWidth);

    targets.forEach((element) => {
      element.style.setProperty("--canvas-top", `${canvasTop}px`);
      element.style.setProperty("--canvas-bottom", `${canvasBottom}px`);
      element.style.setProperty("--canvas-left", `${canvasLeft}px`);
      element.style.setProperty("--canvas-right", `${canvasRight}px`);
      element.style.setProperty("--canvas-scale", this.stageScale.x.toFixed(4));
    });
  }

  private safeDestroyApp(): void {
    if (!this.app || this.appDestroyed) {
      return;
    }

    this.appDestroyed = true;

    try {
      this.app.ticker?.remove?.(this.handleTick);
    } catch {}

    try {
      this.app.destroy(true, { children: true });
    } catch {}
  }

  private registerScenes(): void {
    this.sceneRouter.register("title", () => new TitleScene(this));
    this.sceneRouter.register("intro", () => new IntroScene(this));
    this.sceneRouter.register("followSimba", () => new FollowSimbaScene(this));
    this.sceneRouter.register("hub", () => new HubScene(this));
    this.sceneRouter.register("marksman", () => new MarksmanScene(this));
    this.sceneRouter.register("rally", () => new RallyScene(this));
    this.sceneRouter.register("apothecary", () => new ApothecaryScene(this));
    this.sceneRouter.register("voice", () => new VoiceScene(this));
    this.sceneRouter.register("ending", () => new EndingScene(this));
  }
}
