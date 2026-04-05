import { Howl, Howler } from "howler";

interface SoundDefinition {
  src: string[];
  loop?: boolean;
  volume?: number;
}

export interface PlaylistTrackDefinition {
  id: string;
  src: string;
  label: string;
}

export interface AudioState {
  muted: boolean;
  hasPlaylist: boolean;
  currentTrackId: string | null;
  currentTrackLabel: string;
  currentTrackIndex: number;
  trackCount: number;
  isPlaying: boolean;
}

const MUSIC_VOLUME = 0.24;

export class AudioManager {
  private sounds = new Map<string, Howl>();
  private playlist: PlaylistTrackDefinition[] = [];
  private musicId: string | null = null;
  private currentTrackIndex = -1;
  private muted = false;
  private listeners = new Set<(state: AudioState) => void>();

  register(id: string, definition: SoundDefinition): void {
    if (this.sounds.has(id)) {
      return;
    }

    const sound = new Howl({
      src: definition.src,
      loop: definition.loop ?? false,
      volume: definition.volume ?? 0.7,
      onend: () => {
        if (id === this.musicId && this.isPlaylistTrack(id)) {
          this.nextTrack();
          return;
        }

        if (id === this.musicId) {
          this.emitState();
        }
      },
      onplay: () => {
        if (id === this.musicId) {
          this.emitState();
        }
      },
      onstop: () => {
        if (id === this.musicId) {
          this.emitState();
        }
      },
      onpause: () => {
        if (id === this.musicId) {
          this.emitState();
        }
      },
    });

    this.sounds.set(id, sound);
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

  isPlaying(id: string): boolean {
    return Boolean(this.sounds.get(id)?.playing());
  }

  subscribe(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    const currentTrack = this.playlist[this.currentTrackIndex] ?? null;
    const currentMusic = this.musicId ? this.sounds.get(this.musicId) : null;

    return {
      muted: this.muted,
      hasPlaylist: this.playlist.length > 0,
      currentTrackId: currentTrack?.id ?? this.musicId ?? null,
      currentTrackLabel: currentTrack?.label ?? "",
      currentTrackIndex: this.currentTrackIndex,
      trackCount: this.playlist.length,
      isPlaying: Boolean(currentMusic?.playing()),
    };
  }

  setPlaylist(tracks: PlaylistTrackDefinition[]): void {
    const previousMusicId = this.musicId;
    const previousIndex = this.currentTrackIndex;

    this.playlist = tracks;

    tracks.forEach((track) => {
      this.register(track.id, {
        src: [track.src],
        volume: MUSIC_VOLUME,
      });
    });

    if (!tracks.length) {
      if (previousMusicId) {
        this.stop(previousMusicId);
      }
      this.musicId = null;
      this.currentTrackIndex = -1;
      this.emitState();
      return;
    }

    const retainedIndex = previousMusicId
      ? tracks.findIndex((track) => track.id === previousMusicId)
      : -1;

    if (retainedIndex >= 0) {
      this.currentTrackIndex = retainedIndex;
      this.musicId = tracks[retainedIndex].id;
      this.emitState();
      return;
    }

    if (previousMusicId && previousIndex >= 0) {
      this.stop(previousMusicId);
    }

    this.musicId = null;
    this.currentTrackIndex = 0;
    this.emitState();
  }

  startPlaylist(): void {
    if (!this.playlist.length) {
      return;
    }

    const targetIndex = this.currentTrackIndex >= 0 ? this.currentTrackIndex : 0;
    this.playTrackAtIndex(targetIndex);
  }

  playMusic(id: string): void {
    const sound = this.sounds.get(id);
    if (!sound) {
      return;
    }

    const nextTrackIndex = this.playlist.findIndex((track) => track.id === id);
    if (nextTrackIndex >= 0) {
      this.currentTrackIndex = nextTrackIndex;
    }

    if (this.musicId === id && sound.playing()) {
      this.emitState();
      return;
    }

    if (this.musicId && this.musicId !== id) {
      this.stop(this.musicId);
    }

    this.musicId = id;
    sound.play();
    this.emitState();
  }

  nextTrack(): void {
    if (!this.playlist.length) {
      return;
    }

    const nextIndex =
      this.currentTrackIndex >= 0 ? (this.currentTrackIndex + 1) % this.playlist.length : 0;
    this.playTrackAtIndex(nextIndex, true);
  }

  previousTrack(): void {
    if (!this.playlist.length) {
      return;
    }

    const nextIndex =
      this.currentTrackIndex >= 0
        ? (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length
        : this.playlist.length - 1;
    this.playTrackAtIndex(nextIndex, true);
  }

  toggleMuted(): void {
    this.setMuted(!this.muted);
  }

  setMuted(value: boolean): void {
    if (this.muted === value) {
      return;
    }

    this.muted = value;
    Howler.mute(value);
    this.emitState();
  }

  isMuted(): boolean {
    return this.muted;
  }

  private playTrackAtIndex(index: number, restart = false): void {
    if (!this.playlist.length) {
      return;
    }

    const normalizedIndex =
      ((index % this.playlist.length) + this.playlist.length) % this.playlist.length;
    const nextTrack = this.playlist[normalizedIndex];
    const sound = this.sounds.get(nextTrack.id);

    if (!sound) {
      return;
    }

    if (restart && this.musicId === nextTrack.id) {
      sound.stop();
      this.musicId = null;
    }

    this.currentTrackIndex = normalizedIndex;
    this.playMusic(nextTrack.id);
  }

  private isPlaylistTrack(id: string): boolean {
    return this.playlist.some((track) => track.id === id);
  }

  private emitState(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      listener(state);
    });
  }

  destroy(): void {
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
    this.playlist = [];
    this.musicId = null;
    this.currentTrackIndex = -1;
    this.listeners.clear();
  }
}
