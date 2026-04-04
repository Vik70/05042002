export class ComboSystem {
  private combo = 0;
  private maxCombo = 0;

  constructor(private readonly stepSize = 3, private readonly maxMultiplier = 4) {}

  reset(): void {
    this.combo = 0;
    this.maxCombo = 0;
  }

  registerSuccess(): number {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    return this.combo;
  }

  registerFailure(): void {
    this.combo = 0;
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getMultiplier(): number {
    return Math.min(1 + Math.floor(this.combo / this.stepSize), this.maxMultiplier);
  }
}
