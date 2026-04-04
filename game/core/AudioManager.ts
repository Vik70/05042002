import { Howl, Howler } from "howler";

interface SoundDefinition {
  src: string[];
  loop?: boolean;
  volume?: number;
}

export class AudioManager {
  private sounds = new Map<string, Howl>();
  private musicId: string | null = null;
  private muted = false;

  register(id: string, definition: SoundDefinition): void {
    if (this.sounds.has(id)) {
      return;
    }

    this.sounds.set(
      id,
      new Howl({
        src: definition.src,
        loop: definition.loop ?? false,
        volume: definition.volume ?? 0.7,
      }),
    );
  }

  play(id: string): void {
    if (this.muted) {
      return;
    }

    this.sounds.get(id)?.play();
  }

  stop(id: string): void {
    this.sounds.get(id)?.stop();
  }

  playMusic(id: string): void {
    if (this.musicId === id) {
      return;
    }

    if (this.musicId) {
      this.stop(this.musicId);
    }

    this.musicId = id;
    this.play(id);
  }

  setMuted(value: boolean): void {
    this.muted = value;
    Howler.mute(value);
  }

  isMuted(): boolean {
    return this.muted;
  }

  destroy(): void {
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
  }
}
