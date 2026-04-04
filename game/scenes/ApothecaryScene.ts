import { Container, Graphics, Text, TextStyle } from "pixi.js";
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

interface IngredientChoice {
  definition: IngredientDefinition;
  node: Container;
}

type ApothecaryPhase = "briefing" | "demo" | "ready" | "live";

const APOTHECARY_DEMO_TIME = 18;
const APOTHECARY_DEMO_RECIPE_ID = "moonpetal-salve";

export class ApothecaryScene extends BaseScene {
  readonly id = "apothecary" as const;

  private readonly trial = TRIAL_DEFINITIONS.apothecary;
  private readonly scoreSystem = new ScoreSystem("apothecary");
  private readonly hud = new PixiHUD(() => this.game.getVisibleBounds());
  private readonly petals = EffectsSystem.createPetalField(1440, 810, 24, 0xf8b4c8);
  private readonly recipePaper = new Graphics();
  private readonly recipeTitleText = new Text({ text: "", style: recipeStyle });
  private readonly recipeDetailText = new Text({ text: "", style: bodyStyle });
  private readonly selectedText = new Text({ text: "", style: bodyStyle });
  private readonly timerBar = new Graphics();
  private readonly ingredientLayer = new Container();

  private recipeQueue: RecipeDefinition[] = [];
  private currentRecipeIndex = 0;
  private currentRecipe: RecipeDefinition | null = null;
  private availableIngredientIds: IngredientId[] = [];
  private selectedIngredients: IngredientId[] = [];
  private ingredientChoices: IngredientChoice[] = [];
  private recipeTimer = 0;
  private streak = 0;
  private maxStreak = 0;
  private correctCount = 0;
  private mistakes = 0;
  private ended = false;
  private phaseState: ApothecaryPhase = "briefing";
  private status = "The old remedies are waiting for the memory Aanavee already carries.";

  private getControlsHint(): string {
    return getTrialControlsHint(this.trial, this.game.isMobile());
  }

  private getIngredientCardWidth(): number {
    return this.game.isMobile() ? 172 : 148;
  }

  private getIngredientCardHeight(): number {
    return this.game.isMobile() ? 108 : 92;
  }

  private getIngredientLabelFontSize(): number {
    return this.game.isMobile() ? 22 : 18;
  }

  private getIngredientGridXStep(): number {
    return this.game.isMobile() ? 182 : 174;
  }

  private getIngredientGridYStep(): number {
    return this.game.isMobile() ? 128 : 118;
  }

  private getActionButtonHeight(): number {
    return this.game.isMobile() ? 64 : 56;
  }

  private getTimerBarHeight(): number {
    return this.game.isMobile() ? 24 : 18;
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
    this.recipeTimer = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.correctCount = 0;
    this.mistakes = 0;
    this.ended = false;
    this.phaseState = "briefing";
    this.status = "The old remedies are waiting for the memory Aanavee already carries.";
    this.hud.setMobile(this.game.isMobile());

    const actionButtonHeight = this.getActionButtonHeight();

    const backdrop = this.createNightBackdrop(0.26);
    const apothecary = this.createWorkbench();
    const confirmButton = new PixiButton({
      label: "Restore Remedy",
      width: 190,
      height: actionButtonHeight,
      tint: 0x7c5cbf,
      onClick: () => this.confirmRecipe(),
    });
    confirmButton.position.set(1080, this.game.isMobile() ? 668 : 674);

    const clearButton = new PixiButton({
      label: "Clear Bowl",
      width: 150,
      height: actionButtonHeight,
      tint: 0xc0392b,
      onClick: () => this.clearSelection(),
    });
    clearButton.position.set(906, this.game.isMobile() ? 668 : 674);

    this.recipePaper.clear();
    this.recipePaper.roundRect(70, 166, 600, 260, 24).fill({ color: 0xf5efe0, alpha: 0.95 });
    this.recipePaper.roundRect(70, 166, 600, 260, 24).stroke({ color: 0xd9cba6, width: 2, alpha: 0.85 });

    this.recipeTitleText.position.set(112, 208);
    this.recipeDetailText.position.set(112, 264);
    this.selectedText.position.set(112, 590);
    this.selectedText.style = new TextStyle({
      ...bodyStyle,
      fill: 0xf5efe0,
      wordWrapWidth: 660,
    });

    this.addChild(
      backdrop,
      apothecary,
      this.recipePaper,
      this.recipeTitleText,
      this.recipeDetailText,
      this.ingredientLayer,
      this.selectedText,
      this.timerBar,
      this.petals.container,
      confirmButton,
      clearButton,
      this.hud,
    );

    this.addUpdater(this.petals.update);
    this.addUpdater((deltaMs) => this.updateScene(deltaMs));

    this.recipeTitleText.text = "Memory comes first";
    this.recipeDetailText.text =
      "Simba will walk Aanavee through one easy memory fragment before the live remedies begin.";
    this.selectedText.text = "Restoration Bowl: Empty";
    this.timerBar.clear();
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
      objectiveText: this.trial.demoObjective,
      simbaPrompt: "Read the fragment once, trust yourself, and let the right pieces return.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Practice run",
      tutorialText: "Nothing is scored yet. This is only to get comfortable restoring from memory.",
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
      objectiveText: this.trial.objectiveText,
      simbaPrompt: "Read the fragment once, trust yourself, and let the right pieces return.",
      controlsHint: this.getControlsHint(),
      tutorialTitle: "Live run",
      tutorialText: "This time the shrine record counts.",
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
    this.streak = 0;
    this.maxStreak = 0;
    this.correctCount = 0;
    this.mistakes = 0;
    this.ingredientLayer.removeChildren();
    this.timerBar.clear();
    this.updateSelectedText();
  }

  private createWorkbench(): Container {
    const workbench = new Container();

    const table = new Graphics();
    table.rect(0, 540, 1440, 270).fill({ color: 0x2a1d1f, alpha: 0.96 });

    const shelf = new Graphics();
    shelf.roundRect(770, 174, 550, 320, 22).fill({ color: 0x201821, alpha: 0.82 });
    shelf.roundRect(806, 228, 476, 12, 6).fill({ color: 0x5a4037, alpha: 0.92 });
    shelf.roundRect(806, 334, 476, 12, 6).fill({ color: 0x5a4037, alpha: 0.92 });
    shelf.roundRect(806, 438, 476, 12, 6).fill({ color: 0x5a4037, alpha: 0.92 });

    const bowl = new Graphics();
    bowl.circle(1020, 592, 92).fill({ color: 0x1f2430, alpha: 0.9 });
    bowl.circle(1020, 592, 76).stroke({ color: 0xf5efe0, width: 2, alpha: 0.72 });

    const bowlGlow = new Graphics();
    bowlGlow.circle(1020, 592, 138).fill({ color: 0xf8b4c8, alpha: 0.08 });

    workbench.addChild(table, shelf, bowlGlow, bowl);
    return workbench;
  }

  private updateScene(deltaMs: number): void {
    if (
      this.ended ||
      this.phaseState === "briefing" ||
      this.phaseState === "ready" ||
      !this.currentRecipe
    ) {
      return;
    }

    this.recipeTimer -= deltaMs / 1000;
    this.drawTimerBar();
    this.refreshHud();

    if (this.recipeTimer <= 0) {
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
    this.recipeTimer = demoMode ? APOTHECARY_DEMO_TIME : this.getRecipeMaxTime(recipe, false);
    this.availableIngredientIds = demoMode
      ? this.createDemoIngredients(recipe)
      : this.createAvailableIngredients(recipe);
    this.renderIngredients();
    this.recipeTitleText.text = `Memory Fragment: ${recipe.name}`;
    this.recipeDetailText.text = `${demoMode ? "Practice fragment" : "Restore this remedy from memory."}\n\nRemembered sequence: ${recipe.ingredients
      .map((ingredientId) => this.getIngredient(ingredientId).name)
      .join("  ->  ")}`;
    this.updateSelectedText();
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
    this.ingredientLayer.removeChildren();
    this.ingredientChoices = [];

    this.availableIngredientIds.forEach((ingredientId, index) => {
      const definition = this.getIngredient(ingredientId);
      const column = index % 3;
      const row = Math.floor(index / 3);
      const button = this.createIngredientButton(definition);
      button.position.set(
        770 + column * this.getIngredientGridXStep(),
        194 + row * this.getIngredientGridYStep(),
      );
      this.ingredientLayer.addChild(button);
      this.ingredientChoices.push({ definition, node: button });
    });
  }

  private createIngredientButton(definition: IngredientDefinition): Container {
    const container = new Container();
    const card = new Graphics();
    const cardWidth = this.getIngredientCardWidth();
    const cardHeight = this.getIngredientCardHeight();
    const iconX = cardWidth / 2;
    const iconY = this.game.isMobile() ? 34 : 30;
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
    icon.circle(iconX, iconY, this.game.isMobile() ? 18 : 16).fill({ color: definition.tint, alpha: 0.95 });
    icon.circle(iconX, iconY, this.game.isMobile() ? 34 : 30).fill({ color: definition.tint, alpha: 0.18 });

    label.anchor.set(0.5, 0);
    label.position.set(cardWidth / 2, this.game.isMobile() ? 58 : 52);

    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointertap", () => this.selectIngredient(definition.id));
    container.on("pointerover", () => {
      container.scale.set(1.03);
    });
    container.on("pointerout", () => {
      container.scale.set(1);
    });

    container.addChild(card, icon, label);
    return container;
  }

  private selectIngredient(ingredientId: IngredientId): void {
    if (
      !this.currentRecipe ||
      this.ended ||
      (this.phaseState !== "demo" && this.phaseState !== "live")
    ) {
      return;
    }

    this.selectedIngredients.push(ingredientId);
    this.updateSelectedText();
  }

  private clearSelection(): void {
    if (this.phaseState !== "demo" && this.phaseState !== "live") {
      return;
    }

    this.selectedIngredients = [];
    this.updateSelectedText();
  }

  private confirmRecipe(): void {
    if (
      !this.currentRecipe ||
      this.ended ||
      (this.phaseState !== "demo" && this.phaseState !== "live")
    ) {
      return;
    }

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
    this.selectedText.text = this.selectedIngredients.length
      ? `Restoration Bowl: ${this.selectedIngredients
          .map((ingredientId) => this.getIngredient(ingredientId).name)
          .join("  ->  ")}`
      : "Restoration Bowl: Empty";
  }

  private drawTimerBar(): void {
    if (!this.currentRecipe) {
      return;
    }

    const maxTime = this.getRecipeMaxTime(this.currentRecipe, this.phaseState === "demo");
    const ratio = Math.max(0, this.recipeTimer / maxTime);
    const timerHeight = this.getTimerBarHeight();
    const timerY = this.game.isMobile() ? 435 : 438;

    this.timerBar.clear();
    this.timerBar.roundRect(78, timerY, 584, timerHeight, timerHeight / 2).fill({
      color: 0x8f7f5c,
      alpha: 0.2,
    });
    this.timerBar.roundRect(78, timerY, 584 * ratio, timerHeight, timerHeight / 2).fill({
      color: ratio > 0.33 ? 0x7c5cbf : 0xc0392b,
      alpha: 0.9,
    });
  }

  private refreshHud(): void {
    if (this.phaseState === "demo") {
      this.hud.updateValues({
        title: `${this.trial.title} Demo`,
        subtitle: this.trial.demoObjective,
        score: 0,
        comboLabel: "Practice only",
        timerLabel: `Recipe  ${Math.max(0, Math.ceil(this.recipeTimer))}s`,
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
      subtitle: this.trial.objectiveText,
      score: this.scoreSystem.getScore(),
      comboLabel: `Insight streak  ${this.streak}   Restored  ${this.correctCount}`,
      timerLabel: `Recipe  ${Math.max(0, Math.ceil(this.recipeTimer))}s`,
      status: this.status,
    });
  }

  private getRecipeMaxTime(recipe: RecipeDefinition, demoMode: boolean): number {
    if (demoMode) {
      return APOTHECARY_DEMO_TIME;
    }

    return Math.max(5.6, 10.2 - recipe.difficulty * 1.1);
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
