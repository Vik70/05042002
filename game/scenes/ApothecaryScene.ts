import { Container, Graphics, Rectangle, Text, TextStyle } from "pixi.js";
import { GIFT_REVEALS } from "@/game/data/dialogue";
import {
  INGREDIENTS,
  RECIPES,
  type IngredientDefinition,
  type IngredientId,
  type RecipeDefinition,
} from "@/game/data/recipes";
import { TRIAL_DEFINITIONS, getTrialControlsHint } from "@/game/data/trials";
import { BaseScene } from "@/game/scenes/BaseScene";
import { EffectsSystem } from "@/game/systems/EffectsSystem";
import { ScoreSystem } from "@/game/systems/ScoreSystem";
import { PixiButton } from "@/game/ui/PixiButton";
import { PixiHUD } from "@/game/ui/PixiHUD";
import { formatScore, shuffleArray } from "@/lib/utils";

const recipeStyle = new TextStyle({
  fill: 0x2c1810,
  fontFamily: "Georgia, serif",
  fontSize: 28,
  fontWeight: "700",
  wordWrap: true,
  wordWrapWidth: 540,
});

const bodyStyle = new TextStyle({
  fill: 0x2c1810,
  fontFamily: "Georgia, serif",
  fontSize: 22,
  wordWrap: true,
  wordWrapWidth: 520,
});

const phaseHintStyle = new TextStyle({
  fill: 0xf5efe0,
  fontFamily: "Georgia, serif",
  fontSize: 20,
  fontWeight: "600",
  wordWrap: true,
  wordWrapWidth: 520,
  lineHeight: 28,
});

const phaseBadgeStyle = new TextStyle({
  fill: 0x2c1810,
  fontFamily: "Georgia, serif",
  fontSize: 16,
  fontWeight: "700",
  letterSpacing: 2,
});

interface IngredientChoice {
  definition: IngredientDefinition;
  node: Container;
}

interface ApothecaryLayout {
  recipeX: number;
  recipeY: number;
  recipeWidth: number;
  recipeHeight: number;
  recipeTextX: number;
  recipeTitleY: number;
  recipeDetailY: number;
  recipeTextWidth: number;
  timerX: number;
  timerY: number;
  timerWidth: number;
  ingredientX: number;
  ingredientY: number;
  ingredientColumns: number;
  ingredientGapX: number;
  ingredientGapY: number;
  buttonY: number;
  clearButtonX: number;
  confirmButtonX: number;
  selectedX: number;
  selectedY: number;
  selectedWidth: number;
  tableY: number;
  shelfX: number;
  shelfY: number;
  shelfWidth: number;
  shelfHeight: number;
  bowlX: number;
  bowlY: number;
  bowlRadius: number;
  bowlGlowRadius: number;
  hintX: number;
  hintY: number;
  hintWidth: number;
  phaseBadgeX: number;
  phaseBadgeY: number;
}

type ApothecaryPhase = "briefing" | "demo" | "ready" | "live";
type RecipePhase = "memorize" | "recall";

const APOTHECARY_DEMO_TIME = 18;
const APOTHECARY_DEMO_RECIPE_ID = "moonpetal-salve";

export class ApothecaryScene extends BaseScene {
  readonly id = "apothecary" as const;

  private readonly trial = TRIAL_DEFINITIONS.apothecary;
  private readonly scoreSystem = new ScoreSystem("apothecary");
  private readonly hud = new PixiHUD(() => this.game.getVisibleBounds());
  private readonly petals = EffectsSystem.createPetalField(1440, 810, 24, 0xf8b4c8);
  private readonly workbench = new Container();
  private readonly recipePaper = new Graphics();
  private readonly phaseBadge = new Graphics();
  private readonly phaseBadgeText = new Text({ text: "", style: phaseBadgeStyle });
  private readonly recipeTitleText = new Text({ text: "", style: recipeStyle });
  private readonly recipeDetailText = new Text({ text: "", style: bodyStyle });
  private readonly phaseHintText = new Text({ text: "", style: phaseHintStyle });
  private readonly selectedText = new Text({ text: "", style: bodyStyle });
  private readonly timerBar = new Graphics();
  private readonly ingredientLayer = new Container();
  private confirmButton!: PixiButton;
  private clearButton!: PixiButton;

  private recipeQueue: RecipeDefinition[] = [];
  private currentRecipeIndex = 0;
  private currentRecipe: RecipeDefinition | null = null;
  private availableIngredientIds: IngredientId[] = [];
  private selectedIngredients: IngredientId[] = [];
  private ingredientChoices: IngredientChoice[] = [];
  private currentLayout: ApothecaryLayout | null = null;
  private layoutKey = "";
  private recipeTimer = 0;
  private recipeRecallTime = 0;
  private recipeMemorizeTime = 0;
  private memorizeTimeRemaining = 0;
  private streak = 0;
  private maxStreak = 0;
  private correctCount = 0;
  private mistakes = 0;
  private ended = false;
  private phaseState: ApothecaryPhase = "briefing";
  private recipePhase: RecipePhase = "memorize";
  private status = "The old remedies are waiting for the memory Aanavee already carries.";

  private getControlsHint(): string {
    return getTrialControlsHint(this.trial, this.game.isMobile());
  }

  private isCompactMobileLayout(): boolean {
    const bounds = this.game.getVisibleBounds();
    return this.game.isMobile() && bounds.right - bounds.left <= 900;
  }

  private isWideMobileLayout(): boolean {
    return this.game.isMobile() && !this.isCompactMobileLayout();
  }

  private getIngredientCardWidth(): number {
    return this.isCompactMobileLayout() ? 150 : this.isWideMobileLayout() ? 156 : 148;
  }

  private getIngredientCardHeight(): number {
    return this.isCompactMobileLayout() ? 90 : this.isWideMobileLayout() ? 96 : 92;
  }

  private getIngredientLabelFontSize(): number {
    return this.isCompactMobileLayout() ? 18 : this.isWideMobileLayout() ? 18 : 18;
  }

  private getIngredientGridXStep(): number {
    return this.isCompactMobileLayout()
      ? this.getIngredientCardWidth() + 16
      : this.isWideMobileLayout()
        ? this.getIngredientCardWidth() + 20
        : 174;
  }

  private getIngredientGridYStep(): number {
    return this.isCompactMobileLayout()
      ? this.getIngredientCardHeight() + 14
      : this.isWideMobileLayout()
        ? this.getIngredientCardHeight() + 16
        : 118;
  }

  private getActionButtonHeight(): number {
    return this.isCompactMobileLayout() ? 58 : this.isWideMobileLayout() ? 60 : 56;
  }

  private getTimerBarHeight(): number {
    return this.isCompactMobileLayout() ? 20 : this.isWideMobileLayout() ? 20 : 18;
  }

  async init(): Promise<void> {
    this.removeChildren();
    this.scoreSystem.reset();
    this.recipeQueue = shuffleArray(RECIPES).sort((left, right) => left.difficulty - right.difficulty).slice(0, 8);
    this.currentRecipeIndex = 0;
    this.currentRecipe = null;
    this.availableIngredientIds = [];
    this.selectedIngredients = [];
    this.ingredientChoices = [];
    this.currentLayout = null;
    this.layoutKey = "";
    this.recipeTimer = 0;
    this.recipeRecallTime = 0;
    this.recipeMemorizeTime = 0;
    this.memorizeTimeRemaining = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.correctCount = 0;
    this.mistakes = 0;
    this.ended = false;
    this.phaseState = "briefing";
    this.recipePhase = "memorize";
    this.status = "The old remedies are waiting for the memory Aanavee already carries.";
    this.hud.setMobile(this.game.isMobile());

    const actionButtonHeight = this.getActionButtonHeight();

    const backdrop = this.createNightBackdrop(0.26);
    this.confirmButton = new PixiButton({
      label: "Restore Remedy",
      width: 190,
      height: actionButtonHeight,
      tint: 0x7c5cbf,
      onClick: () => this.confirmRecipe(),
    });
    this.clearButton = new PixiButton({
      label: "Clear Bowl",
      width: 150,
      height: actionButtonHeight,
      tint: 0xc0392b,
      onClick: () => this.clearSelection(),
    });
    this.selectedText.style = new TextStyle({
      ...bodyStyle,
      fill: 0xf5efe0,
      wordWrapWidth: 660,
    });

    this.addChild(
      backdrop,
      this.workbench,
      this.recipePaper,
      this.phaseBadge,
      this.phaseBadgeText,
      this.recipeTitleText,
      this.recipeDetailText,
      this.phaseHintText,
      this.ingredientLayer,
      this.selectedText,
      this.timerBar,
      this.petals.container,
      this.confirmButton,
      this.clearButton,
      this.hud,
    );

    this.addUpdater(this.petals.update);
    this.addUpdater((deltaMs) => this.updateScene(deltaMs));

    this.recipeTitleText.text = "Memory comes first";
    this.recipeDetailText.text =
      "Simba will walk Aanavee through one easy memory fragment before the live remedies begin.";
    this.selectedText.text = "Restoration Bowl: Empty";
    this.timerBar.clear();
    this.layoutScene(true);
    this.syncInteractionState();
    this.refreshHud();
  }

  async enter(): Promise<void> {
    this.game.hideHubOverlay();
    this.game.clearGuidance();
    void this.runGiftFlow();
  }

  private async runGiftFlow(): Promise<void> {
    await this.game.showGiftPrep({
      eyebrow: `Gift ${this.trial.giftNumber}`,
      title: this.trial.title,
      subtitle: this.trial.subtitle,
      description: this.trial.description,
      simbaLine: "One tiny practice remedy first. Then the real bench is all yours.",
      instructions: this.trial.instructions,
      controlsHint: this.getControlsHint(),
      focusLabel: "Demo first",
      focusText: this.trial.demoObjective,
      primaryLabel: "Start Demo",
    });

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.beginDemo();
  }

  private beginDemo(): void {
    this.phaseState = "demo";
    this.resetRunState();
    this.status = "Practice first. Restore one simple remedy, then the live memories begin.";
    this.loadDemoRecipe();
    this.game.showGuidance({
      objectiveTitle: `${this.trial.title} Demo`,
      objectiveText: "Memorize the practice fragment while it glows, then rebuild it from memory.",
      simbaPrompt: "Read the fragment once, trust yourself, and let the right pieces return.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Practice run",
      tutorialText: "The answer will hide after a moment. Then you restore it from memory.",
    });
    this.refreshHud();
  }

  private async completeDemo(): Promise<void> {
    if (this.phaseState !== "demo") {
      return;
    }

    this.phaseState = "ready";
    this.currentRecipe = null;
    this.recipeTitleText.text = "Memory restored";
    this.recipeDetailText.text = "The live memory fragments are ready when you are.";
    this.selectedText.text = "Restoration Bowl: Empty";
    this.timerBar.clear();
    this.refreshHud();

    await this.game.showGiftPrep({
      eyebrow: "Demo Complete",
      title: this.trial.title,
      subtitle: "The real remedies are ready to wake.",
      description:
        "The practice fragment is restored. The next remedies are the live set, with the shrine record counting each memory you return correctly.",
      simbaLine: "Quietly brilliant. Now give the real remedies that same look.",
      instructions: this.trial.instructions,
      controlsHint: this.getControlsHint(),
      focusLabel: "Live run",
      focusText: "The recipe queue and shrine record begin as soon as you continue.",
      primaryLabel: "Start Gift",
    });

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    this.beginLiveRun();
  }

  private beginLiveRun(): void {
    this.phaseState = "live";
    this.resetRunState();
    this.recipeQueue = shuffleArray(RECIPES)
      .sort((left, right) => left.difficulty - right.difficulty)
      .slice(0, 8);
    this.loadRecipe();
    this.status = "The old remedies are waiting for the memory Aanavee already carries.";
    this.game.showGuidance({
      objectiveTitle: this.trial.objectiveTitle,
      objectiveText: "Memorize each fragment while it glows, then restore the remedy from memory.",
      simbaPrompt: "Read the fragment once, trust yourself, and let the right pieces return.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Live run",
      tutorialText: "Each fragment will hide after a moment. This time the shrine record counts.",
    });
    this.refreshHud();
  }

  private resetRunState(): void {
    this.scoreSystem.reset();
    this.recipeQueue = [];
    this.currentRecipeIndex = 0;
    this.currentRecipe = null;
    this.availableIngredientIds = [];
    this.selectedIngredients = [];
    this.ingredientChoices = [];
    this.recipeTimer = 0;
    this.recipeRecallTime = 0;
    this.recipeMemorizeTime = 0;
    this.memorizeTimeRemaining = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.correctCount = 0;
    this.mistakes = 0;
    this.recipePhase = "memorize";
    this.ingredientLayer.removeChildren();
    this.timerBar.clear();
    this.updateSelectedText();
    this.syncInteractionState();
  }

  private getSceneLayout(): ApothecaryLayout {
    if (!this.game.isMobile()) {
      return {
        recipeX: 70,
        recipeY: 166,
        recipeWidth: 600,
        recipeHeight: 260,
        recipeTextX: 112,
        recipeTitleY: 224,
        recipeDetailY: 280,
        recipeTextWidth: 520,
        timerX: 78,
        timerY: 438,
        timerWidth: 584,
        ingredientX: 770,
        ingredientY: 194,
        ingredientColumns: 3,
        ingredientGapX: this.getIngredientGridXStep(),
        ingredientGapY: this.getIngredientGridYStep(),
        buttonY: 674,
        clearButtonX: 906,
        confirmButtonX: 1080,
        selectedX: 112,
        selectedY: 590,
        selectedWidth: 660,
        tableY: 540,
        shelfX: 770,
        shelfY: 174,
        shelfWidth: 550,
        shelfHeight: 320,
        bowlX: 1020,
        bowlY: 592,
        bowlRadius: 92,
        bowlGlowRadius: 138,
        hintX: 770,
        hintY: 156,
        hintWidth: 550,
        phaseBadgeX: 112,
        phaseBadgeY: 188,
      };
    }

    const bounds = this.game.getVisibleBounds();
    const visibleLeft = bounds.left + 24;
    const visibleRight = bounds.right - 24;
    const visibleWidth = visibleRight - visibleLeft;
    const centerX = (visibleLeft + visibleRight) / 2;

    if (this.isWideMobileLayout()) {
      const leftColumnWidth = Math.min(532, Math.max(468, visibleWidth * 0.4));
      const rightColumnWidth = visibleWidth - leftColumnWidth - 36;
      const recipeX = visibleLeft;
      const shelfX = recipeX + leftColumnWidth + 36;
      const cardWidth = this.getIngredientCardWidth();
      const gapX = this.getIngredientGridXStep() - cardWidth;
      const columns = 3;
      const gridWidth = cardWidth * columns + gapX * (columns - 1);

      return {
        recipeX,
        recipeY: 188,
        recipeWidth: leftColumnWidth,
        recipeHeight: 214,
        recipeTextX: recipeX + 24,
        recipeTitleY: 238,
        recipeDetailY: 280,
        recipeTextWidth: leftColumnWidth - 48,
        timerX: recipeX,
        timerY: 420,
        timerWidth: leftColumnWidth,
        ingredientX: shelfX + Math.max(18, (rightColumnWidth - gridWidth) / 2),
        ingredientY: 268,
        ingredientColumns: columns,
        ingredientGapX: this.getIngredientGridXStep(),
        ingredientGapY: this.getIngredientGridYStep(),
        buttonY: 694,
        clearButtonX: recipeX + 8,
        confirmButtonX: recipeX + 176,
        selectedX: recipeX + 6,
        selectedY: 466,
        selectedWidth: leftColumnWidth - 12,
        tableY: 552,
        shelfX,
        shelfY: 222,
        shelfWidth: rightColumnWidth,
        shelfHeight: 356,
        bowlX: recipeX + leftColumnWidth - 144,
        bowlY: 632,
        bowlRadius: 82,
        bowlGlowRadius: 126,
        hintX: shelfX + 12,
        hintY: 186,
        hintWidth: rightColumnWidth - 24,
        phaseBadgeX: recipeX + 24,
        phaseBadgeY: 206,
      };
    }

    const recipeWidth = Math.min(720, visibleWidth - 8);
    const cardWidth = this.getIngredientCardWidth();
    const gapX = this.getIngredientGridXStep() - cardWidth;
    const columns = 3;
    const gridWidth = cardWidth * columns + gapX * (columns - 1);

    return {
      recipeX: centerX - recipeWidth / 2,
      recipeY: 184,
      recipeWidth,
      recipeHeight: 148,
      recipeTextX: centerX - recipeWidth / 2 + 24,
      recipeTitleY: 232,
      recipeDetailY: 268,
      recipeTextWidth: recipeWidth - 48,
      timerX: centerX - recipeWidth / 2,
      timerY: 348,
      timerWidth: recipeWidth,
      ingredientX: centerX - gridWidth / 2,
      ingredientY: 386,
      ingredientColumns: columns,
      ingredientGapX: this.getIngredientGridXStep(),
      ingredientGapY: this.getIngredientGridYStep(),
      buttonY: 692,
      clearButtonX: centerX - 178,
      confirmButtonX: centerX - 12,
      selectedX: centerX - recipeWidth / 2 + 8,
      selectedY: 754,
      selectedWidth: recipeWidth - 16,
      tableY: 614,
      shelfX: centerX - gridWidth / 2 - 20,
      shelfY: 368,
      shelfWidth: gridWidth + 40,
      shelfHeight:
        this.getIngredientCardHeight() * 3 +
        this.getIngredientGridYStep() * 2 -
        this.getIngredientCardHeight() +
        36,
      bowlX: centerX,
      bowlY: 730,
      bowlRadius: 72,
      bowlGlowRadius: 114,
      hintX: centerX,
      hintY: 0,
      hintWidth: 0,
      phaseBadgeX: centerX - recipeWidth / 2 + 18,
      phaseBadgeY: 202,
    };
  }

  private layoutScene(force = false): void {
    const bounds = this.game.getVisibleBounds();
    const nextLayout = this.getSceneLayout();
    const nextKey = [
      this.game.isMobile() ? "mobile" : "desktop",
      bounds.left.toFixed(1),
      bounds.right.toFixed(1),
      bounds.top.toFixed(1),
      bounds.bottom.toFixed(1),
    ].join("|");

    if (!force && nextKey === this.layoutKey) {
      return;
    }

    this.layoutKey = nextKey;
    this.currentLayout = nextLayout;

    this.drawWorkbench(nextLayout);
    this.recipePaper.clear();
    this.recipePaper.roundRect(
      nextLayout.recipeX,
      nextLayout.recipeY,
      nextLayout.recipeWidth,
      nextLayout.recipeHeight,
      24,
    ).fill({ color: 0xf5efe0, alpha: 0.95 });
    this.recipePaper.roundRect(
      nextLayout.recipeX,
      nextLayout.recipeY,
      nextLayout.recipeWidth,
      nextLayout.recipeHeight,
      24,
    ).stroke({ color: 0xd9cba6, width: 2, alpha: 0.85 });

    this.recipeTitleText.position.set(nextLayout.recipeTextX, nextLayout.recipeTitleY);
    this.recipeDetailText.position.set(nextLayout.recipeTextX, nextLayout.recipeDetailY);
    this.selectedText.position.set(nextLayout.selectedX, nextLayout.selectedY);
    this.phaseHintText.position.set(nextLayout.hintX, nextLayout.hintY);

    this.recipeTitleText.style.fontSize = this.isCompactMobileLayout() ? 22 : this.isWideMobileLayout() ? 24 : 28;
    this.recipeTitleText.style.wordWrapWidth = nextLayout.recipeTextWidth;
    this.recipeDetailText.style.fontSize = this.isCompactMobileLayout() ? 16 : this.isWideMobileLayout() ? 18 : 22;
    this.recipeDetailText.style.wordWrapWidth = nextLayout.recipeTextWidth;
    this.selectedText.style.fontSize = this.isCompactMobileLayout() ? 16 : this.isWideMobileLayout() ? 18 : 22;
    this.selectedText.style.wordWrapWidth = nextLayout.selectedWidth;
    this.phaseHintText.style.fontSize = this.isWideMobileLayout() ? 18 : 20;
    this.phaseHintText.style.wordWrapWidth = nextLayout.hintWidth;

    this.clearButton.position.set(nextLayout.clearButtonX, nextLayout.buttonY);
    this.confirmButton.position.set(nextLayout.confirmButtonX, nextLayout.buttonY);

    if (this.availableIngredientIds.length > 0) {
      this.renderIngredients();
    }

    this.drawTimerBar();
    this.updatePhasePresentation();
  }

  private drawWorkbench(layout: ApothecaryLayout): void {
    this.workbench.removeChildren();

    const table = new Graphics();
    table.rect(0, layout.tableY, 1440, 810 - layout.tableY).fill({ color: 0x2a1d1f, alpha: 0.96 });

    const shelf = new Graphics();
    shelf.roundRect(layout.shelfX, layout.shelfY, layout.shelfWidth, layout.shelfHeight, 22).fill({
      color: 0x201821,
      alpha: 0.82,
    });

    const cardHeight = this.getIngredientCardHeight();
    const plankInset = layout.recipeWidth > 650 ? 36 : 22;
    [0, 1, 2].forEach((row) => {
      const plankY = layout.ingredientY + row * layout.ingredientGapY + row * cardHeight + 26;
      shelf.roundRect(
        layout.shelfX + plankInset,
        plankY,
        layout.shelfWidth - plankInset * 2,
        10,
        6,
      ).fill({
        color: 0x5a4037,
        alpha: 0.92,
      });
    });

    const bowl = new Graphics();
    bowl.circle(layout.bowlX, layout.bowlY, layout.bowlRadius).fill({ color: 0x1f2430, alpha: 0.88 });
    bowl.circle(layout.bowlX, layout.bowlY, Math.max(44, layout.bowlRadius - 16)).stroke({
      color: 0xf5efe0,
      width: 2,
      alpha: 0.72,
    });

    const bowlGlow = new Graphics();
    bowlGlow.circle(layout.bowlX, layout.bowlY, layout.bowlGlowRadius).fill({
      color: 0xf8b4c8,
      alpha: 0.08,
    });

    this.workbench.addChild(table, shelf, bowlGlow, bowl);
  }

  private updateScene(deltaMs: number): void {
    this.layoutScene();

    if (
      this.ended ||
      this.phaseState === "briefing" ||
      this.phaseState === "ready" ||
      !this.currentRecipe
    ) {
      return;
    }

    const deltaSeconds = deltaMs / 1000;
    this.recipeTimer = Math.max(0, this.recipeTimer - deltaSeconds);

    if (this.recipePhase === "memorize") {
      this.memorizeTimeRemaining = Math.max(0, this.memorizeTimeRemaining - deltaSeconds);

      if (this.memorizeTimeRemaining <= 0) {
        this.enterRecallPhase();
      }
    }

    this.updateSelectedText();
    this.updatePhasePresentation();
    this.drawTimerBar();
    this.refreshHud();

    if (this.recipePhase === "recall" && this.recipeTimer <= 0) {
      this.handleMistake("The memory faded before the remedy settled. That's alright. Try again.");
    }
  }

  private loadRecipe(): void {
    if (this.phaseState !== "live") {
      return;
    }

    if (this.currentRecipeIndex >= this.recipeQueue.length) {
      void this.finishTrial();
      return;
    }

    this.applyRecipe(this.recipeQueue[this.currentRecipeIndex], false);
    this.currentRecipeIndex += 1;
  }

  private loadDemoRecipe(): void {
    const recipe =
      RECIPES.find((entry) => entry.id === APOTHECARY_DEMO_RECIPE_ID) ?? RECIPES[0];

    this.applyRecipe(recipe, true);
  }

  private applyRecipe(recipe: RecipeDefinition, demoMode: boolean): void {
    this.currentRecipe = recipe;
    this.selectedIngredients = [];
    this.recipePhase = "memorize";
    this.recipeRecallTime = this.getRecallTime(recipe, demoMode);
    this.recipeMemorizeTime = this.getMemorizeDuration(recipe, demoMode);
    this.memorizeTimeRemaining = this.recipeMemorizeTime;
    this.recipeTimer = this.getRecipeMaxTime(recipe, demoMode);
    this.availableIngredientIds = demoMode
      ? this.createDemoIngredients(recipe)
      : this.createAvailableIngredients(recipe);
    this.layoutScene(true);
    this.updateRecipeCopy();
    this.updateSelectedText();
    this.updatePhasePresentation();
    this.syncInteractionState();
    this.drawTimerBar();
  }

  private createAvailableIngredients(recipe: RecipeDefinition): IngredientId[] {
    const allIds = INGREDIENTS.map((ingredient) => ingredient.id);
    const decoys = shuffleArray(allIds.filter((id) => !recipe.ingredients.includes(id))).slice(
      0,
      Math.min(3 + recipe.difficulty, 7 - recipe.ingredients.length),
    );

    return shuffleArray([...recipe.ingredients, ...decoys]);
  }

  private createDemoIngredients(recipe: RecipeDefinition): IngredientId[] {
    const allIds = INGREDIENTS.map((ingredient) => ingredient.id);
    const decoy = shuffleArray(allIds.filter((id) => !recipe.ingredients.includes(id))).slice(0, 1);
    return shuffleArray([...recipe.ingredients, ...decoy]);
  }

  private renderIngredients(): void {
    if (!this.currentLayout) {
      return;
    }

    const layout = this.currentLayout;
    this.ingredientLayer.removeChildren();
    this.ingredientChoices = [];

    this.availableIngredientIds.forEach((ingredientId, index) => {
      const definition = this.getIngredient(ingredientId);
      const column = index % layout.ingredientColumns;
      const row = Math.floor(index / layout.ingredientColumns);
      const button = this.createIngredientButton(definition);
      button.position.set(
        layout.ingredientX + column * layout.ingredientGapX,
        layout.ingredientY + row * layout.ingredientGapY,
      );
      this.ingredientLayer.addChild(button);
      this.ingredientChoices.push({ definition, node: button });
    });

    this.syncInteractionState();
  }

  private createIngredientButton(definition: IngredientDefinition): Container {
    const container = new Container();
    const card = new Graphics();
    const compactMobile = this.isCompactMobileLayout();
    const cardWidth = this.getIngredientCardWidth();
    const cardHeight = this.getIngredientCardHeight();
    const iconX = cardWidth / 2;
    const iconY = compactMobile ? 26 : this.game.isMobile() ? 34 : 30;
    const label = new Text({
      text: definition.name,
      style: new TextStyle({
        fill: 0xf5efe0,
        fontFamily: "Georgia, serif",
        fontSize: this.getIngredientLabelFontSize(),
        fontWeight: "600",
        wordWrap: true,
        wordWrapWidth: cardWidth - 16,
        align: "center",
      }),
    });

    card.roundRect(0, 0, cardWidth, cardHeight, 18).fill({ color: 0x261a28, alpha: 0.92 });
    card.roundRect(0, 0, cardWidth, cardHeight, 18).stroke({
      color: definition.tint,
      width: 2,
      alpha: 0.8,
    });

    const icon = new Graphics();
    icon.circle(iconX, iconY, compactMobile ? 14 : this.game.isMobile() ? 18 : 16).fill({
      color: definition.tint,
      alpha: 0.95,
    });
    icon.circle(iconX, iconY, compactMobile ? 26 : this.game.isMobile() ? 34 : 30).fill({
      color: definition.tint,
      alpha: 0.18,
    });

    label.anchor.set(0.5, 0);
    label.position.set(cardWidth / 2, compactMobile ? 46 : this.game.isMobile() ? 58 : 52);

    container.eventMode = "static";
    container.cursor = "pointer";
    container.hitArea = new Rectangle(0, 0, cardWidth, cardHeight);
    container.on("pointerdown", () => this.selectIngredient(definition.id));
    container.on("pointerover", () => {
      if (container.cursor === "pointer") {
        container.scale.set(1.03);
      }
    });
    container.on("pointerout", () => {
      this.syncInteractionState();
    });

    container.addChild(card, icon, label);
    return container;
  }

  private selectIngredient(ingredientId: IngredientId): void {
    if (
      !this.currentRecipe ||
      this.ended ||
      this.selectedIngredients.length >= this.currentRecipe.ingredients.length ||
      (this.phaseState !== "demo" && this.phaseState !== "live")
    ) {
      return;
    }

    if (this.recipePhase !== "recall") {
      this.showLockedIngredientFeedback();
      return;
    }

    if (this.selectedIngredients.includes(ingredientId)) {
      this.status = "That ingredient is already in the bowl. Choose the next one or clear the bowl.";
      this.refreshHud();
      return;
    }

    this.selectedIngredients.push(ingredientId);
    this.game.audio.play("apothecary-select");
    this.updateSelectedText();
    this.syncInteractionState();
  }

  private clearSelection(): void {
    if (this.phaseState !== "demo" && this.phaseState !== "live") {
      return;
    }

    if (this.recipePhase !== "recall") {
      this.showLockedIngredientFeedback();
      return;
    }

    if (!this.selectedIngredients.length) {
      return;
    }

    this.selectedIngredients = [];
    this.game.audio.play("apothecary-clear");
    this.updateSelectedText();
    this.syncInteractionState();
  }

  private confirmRecipe(): void {
    if (
      !this.currentRecipe ||
      this.ended ||
      (this.phaseState !== "demo" && this.phaseState !== "live")
    ) {
      return;
    }

    if (this.recipePhase !== "recall") {
      this.showLockedIngredientFeedback();
      return;
    }

    this.game.audio.play("apothecary-confirm");
    const expected = this.currentRecipe.ingredients.join("|");
    const actual = this.selectedIngredients.join("|");

    if (expected === actual) {
      if (this.phaseState === "live") {
        this.correctCount += 1;
        this.streak += 1;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
        this.status = "Correct restoration. The remedy glows like it remembered your hands.";
        this.scoreSystem.add(170 + this.recipeTimer * 34 + this.streak * 20);
        this.loadRecipe();
        this.refreshHud();
        return;
      }

      this.status = "Correct. Practice memory restored.";
      this.game.updateGuidance({
        simbaPrompt: "There. Quietly brilliant.",
        tutorialTitle: "Practice run",
        tutorialText: "You have the order now. The live remedies are next.",
      });
      this.refreshHud();
      void this.completeDemo();
      return;
    }

    this.handleMistake("Those pieces don't belong in that memory. Give it another look.");
  }

  private enterRecallPhase(): void {
    if (!this.currentRecipe || this.recipePhase === "recall") {
      return;
    }

    this.recipePhase = "recall";
    this.status =
      this.phaseState === "demo"
        ? "The practice fragment is hidden now. Restore it from memory."
        : "The fragment is hidden now. Restore the remedy from memory.";
    this.updateRecipeCopy();
    this.updateSelectedText();
    this.updatePhasePresentation();
    this.syncInteractionState();
    this.game.updateGuidance({
      objectiveText:
        this.phaseState === "demo"
          ? "The fragment is hidden now. Restore the practice remedy from memory."
          : "The fragment is hidden now. Restore the remedy in the remembered order.",
      simbaPrompt: "Okay, now trust what stayed with you.",
      tutorialTitle: this.phaseState === "demo" ? "Practice recall" : "Recall phase",
      tutorialText:
        this.phaseState === "demo"
          ? "The answer is hidden now. Rebuild the practice remedy from memory."
          : "The answer is hidden now. Restore the remedy before the timer fades.",
    });
    this.refreshHud();
  }

  private showLockedIngredientFeedback(): void {
    if (this.recipePhase !== "memorize") {
      return;
    }

    this.status = `Memorize first. Recall begins in ${Math.max(
      1,
      Math.ceil(this.memorizeTimeRemaining),
    )}s, then the ingredients unlock.`;
    this.updateSelectedText();
    this.updatePhasePresentation();
    this.refreshHud();
  }

  private updateRecipeCopy(): void {
    if (!this.currentRecipe) {
      return;
    }

    const sequence = this.currentRecipe.ingredients
      .map((ingredientId) => this.getIngredient(ingredientId).name)
      .join("  ->  ");
    const practiceLabel = this.phaseState === "demo" ? "Practice fragment" : "Memory fragment";

    this.recipeTitleText.text = `${practiceLabel}: ${this.currentRecipe.name}`;
    this.recipeDetailText.text =
      this.recipePhase === "memorize"
        ? `${
            this.phaseState === "demo"
              ? "Memorize first. Do not tap the ingredients yet. Recall begins when the fragment fades."
              : "Memorize first. Do not tap the ingredients until Recall begins."
          }\n\nRemembered sequence: ${sequence}`
        : `${
            this.phaseState === "demo" ? "Practice recall." : "Recall phase."
          }\n\nThe sequence is hidden now. Tap the ingredients in order, then press Restore Remedy.`;
  }

  private updatePhasePresentation(): void {
    if (!this.currentLayout || !this.currentRecipe) {
      this.phaseBadge.clear();
      this.phaseBadgeText.text = "";
      this.phaseHintText.visible = false;
      return;
    }

    const badgeHeight = this.isCompactMobileLayout() ? 28 : 30;
    const badgeLabel = this.recipePhase === "memorize" ? "MEMORIZE" : "RECALL";
    const badgeColor = this.recipePhase === "memorize" ? 0xf5c542 : 0x7c5cbf;

    this.phaseBadgeText.text = badgeLabel;
    this.phaseBadgeText.style.fontSize = this.isCompactMobileLayout() ? 13 : 16;
    this.phaseBadgeText.style.fill = this.recipePhase === "memorize" ? 0x2c1810 : 0xf5efe0;
    this.phaseBadgeText.position.set(
      this.currentLayout.phaseBadgeX + 14,
      this.currentLayout.phaseBadgeY + 7,
    );

    const badgeWidth = this.phaseBadgeText.width + 28;
    this.phaseBadge.clear();
    this.phaseBadge
      .roundRect(
        this.currentLayout.phaseBadgeX,
        this.currentLayout.phaseBadgeY,
        badgeWidth,
        badgeHeight,
        badgeHeight / 2,
      )
      .fill({
        color: badgeColor,
        alpha: 0.94,
      });
    this.phaseBadge
      .roundRect(
        this.currentLayout.phaseBadgeX,
        this.currentLayout.phaseBadgeY,
        badgeWidth,
        badgeHeight,
        badgeHeight / 2,
      )
      .stroke({
        color: 0xf5efe0,
        width: 1.5,
        alpha: 0.42,
      });

    const showPhaseHint = this.currentLayout.hintWidth > 0;
    this.phaseHintText.visible = showPhaseHint;

    if (!showPhaseHint) {
      return;
    }

    this.phaseHintText.style.fill = this.recipePhase === "memorize" ? 0xf5c542 : 0xf5efe0;
    this.phaseHintText.text =
      this.recipePhase === "memorize"
        ? `Memorize now. The cards stay sealed until Recall begins in ${Math.max(
            1,
            Math.ceil(this.memorizeTimeRemaining),
          )}s.`
        : "Recall now. Tap the ingredients in order, then press Restore Remedy.";
  }

  private syncInteractionState(): void {
    const sceneActive =
      Boolean(this.currentRecipe) &&
      !this.ended &&
      (this.phaseState === "demo" || this.phaseState === "live");
    const canInteract = sceneActive && this.recipePhase === "recall";

    this.ingredientChoices.forEach(({ definition, node }) => {
      const selected = this.selectedIngredients.includes(definition.id);
      node.eventMode = sceneActive ? "static" : "none";
      node.cursor = canInteract && !selected ? "pointer" : "default";
      node.alpha = canInteract ? (selected ? 0.46 : 1) : 0.58;
      node.scale.set(selected ? 0.98 : 1);
    });

    if (this.confirmButton) {
      this.confirmButton.eventMode = sceneActive ? "static" : "none";
      this.confirmButton.cursor = canInteract ? "pointer" : "default";
      this.confirmButton.alpha = canInteract ? 0.95 : 0.52;
    }

    if (this.clearButton) {
      this.clearButton.eventMode = sceneActive ? "static" : "none";
      this.clearButton.cursor = canInteract ? "pointer" : "default";
      this.clearButton.alpha = canInteract ? 0.95 : 0.52;
    }
  }

  private handleMistake(message: string): void {
    this.status = message;

    if (this.phaseState === "live") {
      this.mistakes += 1;
      this.streak = 0;
      this.loadRecipe();
    } else {
      this.game.updateGuidance({
        simbaPrompt: "No problem. Read it once more and trust what you know.",
      });
      this.loadDemoRecipe();
    }

    this.refreshHud();
  }

  private updateSelectedText(): void {
    if (this.recipePhase === "memorize") {
      this.selectedText.text = `Restoration Bowl: Locked.\nRecall begins in ${Math.max(
        1,
        Math.ceil(this.memorizeTimeRemaining),
      )}s.`;
      return;
    }

    if (!this.selectedIngredients.length) {
      this.selectedText.text = "Restoration Bowl: Empty.\nTap the remembered ingredients in order.";
      return;
    }

    const ingredients = this.selectedIngredients
      .map((ingredientId) => this.getIngredient(ingredientId).name)
      .join("  ->  ");
    const remaining = Math.max(
      0,
      (this.currentRecipe?.ingredients.length ?? 0) - this.selectedIngredients.length,
    );
    const nextStep =
      remaining > 0
        ? `\n${remaining} more ${remaining === 1 ? "ingredient" : "ingredients"} to place.`
        : "\nPress Restore Remedy when the order feels right.";

    this.selectedText.text = `Restoration Bowl: ${ingredients}${nextStep}`;
  }

  private drawTimerBar(): void {
    if (!this.currentRecipe || !this.currentLayout) {
      return;
    }

    const maxTime = this.recipePhase === "memorize" ? this.recipeMemorizeTime : this.recipeRecallTime;
    const remainingTime =
      this.recipePhase === "memorize" ? this.memorizeTimeRemaining : this.recipeTimer;
    const ratio = Math.max(0, remainingTime / Math.max(0.01, maxTime));
    const timerHeight = this.getTimerBarHeight();

    this.timerBar.clear();
    this.timerBar.roundRect(
      this.currentLayout.timerX,
      this.currentLayout.timerY,
      this.currentLayout.timerWidth,
      timerHeight,
      timerHeight / 2,
    ).fill({
      color: 0x8f7f5c,
      alpha: 0.2,
    });
    this.timerBar.roundRect(
      this.currentLayout.timerX,
      this.currentLayout.timerY,
      this.currentLayout.timerWidth * ratio,
      timerHeight,
      timerHeight / 2,
    ).fill({
      color: this.recipePhase === "memorize" ? 0xf5c542 : ratio > 0.33 ? 0x7c5cbf : 0xc0392b,
      alpha: 0.9,
    });
  }

  private refreshHud(): void {
    if (this.phaseState === "demo") {
      this.hud.updateValues({
        title: `${this.trial.title} Demo`,
        subtitle:
          this.recipePhase === "memorize"
            ? "Memorize the fragment before it fades."
            : "Restore the practice remedy from memory.",
        score: 0,
        comboLabel: "Practice only",
        timerLabel: `${this.recipePhase === "memorize" ? "Memorize" : "Recall"}  ${Math.max(
          0,
          Math.ceil(this.recipePhase === "memorize" ? this.memorizeTimeRemaining : this.recipeTimer),
        )}s`,
        status: this.status,
      });
      return;
    }

    if (this.phaseState === "briefing" || this.phaseState === "ready") {
      this.hud.updateValues({
        title: this.trial.title,
        subtitle: "Read the instructions above, then continue when you feel ready.",
        score: 0,
        comboLabel: "Practice unlocks the live run",
        timerLabel: "Paused",
        status: this.status,
      });
      return;
    }

    this.hud.updateValues({
      title: this.trial.title,
      subtitle:
        this.recipePhase === "memorize"
          ? "Memorize the fragment while it glows."
          : "Restore the remedy from memory.",
      score: this.scoreSystem.getScore(),
      comboLabel: `Insight streak  ${this.streak}   Restored  ${this.correctCount}`,
      timerLabel: `${this.recipePhase === "memorize" ? "Memorize" : "Recall"}  ${Math.max(
          0,
          Math.ceil(this.recipePhase === "memorize" ? this.memorizeTimeRemaining : this.recipeTimer),
        )}s`,
      status: this.status,
    });
  }

  private getRecallTime(recipe: RecipeDefinition, demoMode: boolean): number {
    if (demoMode) {
      return Math.max(8, APOTHECARY_DEMO_TIME - this.getMemorizeDuration(recipe, true));
    }

    return Math.max(5.6, 10.2 - recipe.difficulty * 1.1);
  }

  private getMemorizeDuration(recipe: RecipeDefinition, demoMode: boolean): number {
    if (demoMode) {
      return 4.8;
    }

    if (recipe.difficulty <= 1) {
      return 5;
    }

    if (recipe.difficulty === 2) {
      return 4.2;
    }

    return 3.6;
  }

  private getRecipeMaxTime(recipe: RecipeDefinition, demoMode: boolean): number {
    return this.getRecallTime(recipe, demoMode) + this.getMemorizeDuration(recipe, demoMode);
  }

  private getIngredient(ingredientId: IngredientId): IngredientDefinition {
    const ingredient = INGREDIENTS.find((entry) => entry.id === ingredientId);

    if (!ingredient) {
      throw new Error(`Unknown ingredient "${ingredientId}".`);
    }

    return ingredient;
  }

  private async finishTrial(): Promise<void> {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.game.clearGuidance();
    const reveal = GIFT_REVEALS.apothecary;

    const result = {
      trialId: "apothecary" as const,
      title: this.trial.title,
      subtitle: "The last chamber is stirring now. Go see what all this restored light opened.",
      score: this.scoreSystem.getScore(),
      rank: this.scoreSystem.getRank(),
      quality: this.trial.quality,
      giftName: this.trial.giftName,
      giftSummary: reveal.giftSummary,
      giftMeaning: reveal.giftMeaning,
      simbaValueTheme: reveal.simbaValueTheme,
      awakeningSummary: reveal.awakeningSummary,
      simbaLine: reveal.simbaLine,
      awakeningText: reveal.awakeningText,
      simbaReflection: reveal.simbaReflection,
      heroStat: {
        label: this.trial.statLabel,
        value: String(this.correctCount),
      },
      metrics: this.game.createResultMetrics([
        { label: "Correct Mixtures", value: String(this.correctCount) },
        { label: "Best Streak", value: String(this.maxStreak) },
        { label: "Mistakes", value: String(this.mistakes) },
        { label: "Shrine Record", value: formatScore(this.scoreSystem.getScore()) },
      ]),
      ctaLabel: reveal.ctaLabel,
    };

    this.game.recordTrialResult(result, {
      correctMixtures: this.correctCount,
      maxStreak: this.maxStreak,
      mistakes: this.mistakes,
    });

    await this.game.showResults(result);

    if (this.destroyed || this.game.isDestroyed()) {
      return;
    }

    await this.game.returnToHub();
  }
}
