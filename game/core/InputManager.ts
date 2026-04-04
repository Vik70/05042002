export class InputManager {
  private keys = new Set<string>();

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.keys.clear();
  }

  isPressed(code: string): boolean {
    return this.keys.has(code);
  }
}
