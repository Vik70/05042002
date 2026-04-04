import type { DialogueLine, DialogueState } from "@/game/types/game";

const createDefaultState = (): DialogueState => ({
  visible: false,
  lines: [],
  index: 0,
  canSkip: true,
});

export class DialogueSystem {
  private state: DialogueState = createDefaultState();
  private resolver: (() => void) | null = null;

  constructor(private readonly onChange: (state: DialogueState) => void) {}

  getState(): DialogueState {
    return this.state;
  }

  present(lines: DialogueLine[], canSkip = true): Promise<void> {
    if (this.resolver) {
      this.complete();
    }

    this.state = {
      visible: true,
      lines,
      index: 0,
      canSkip,
    };
    this.onChange(this.state);

    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  advance(): void {
    if (!this.state.visible) {
      return;
    }

    if (this.state.index < this.state.lines.length - 1) {
      this.state = {
        ...this.state,
        index: this.state.index + 1,
      };
      this.onChange(this.state);
      return;
    }

    this.complete();
  }

  skip(): void {
    if (!this.state.visible || !this.state.canSkip) {
      return;
    }

    this.complete();
  }

  private complete(): void {
    const resolve = this.resolver;
    this.resolver = null;
    this.state = createDefaultState();
    this.onChange(this.state);
    resolve?.();
  }
}
