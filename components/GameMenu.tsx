"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioState } from "@/game/core/AudioManager";

export function GameMenu({
  compact = false,
  audioState,
  onReturnHome,
  onToggleMute,
  onPreviousTrack,
  onNextTrack,
}: {
  compact?: boolean;
  audioState: AudioState;
  onReturnHome: () => void;
  onToggleMute: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menuButtonClassName = compact
    ? "min-h-[36px] px-3 py-1 text-[11px]"
    : "min-h-[44px] px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm";
  const actionButtonClassName =
    "rounded-xl border border-white/10 bg-black/18 px-3 py-2 text-left text-xs text-paper-cream/84 transition hover:bg-white/8 disabled:cursor-default disabled:opacity-45";
  const menuStatus = !audioState.hasPlaylist
    ? "Add MP3s to public/audio/bgmusic and refresh."
    : audioState.muted
      ? "Music is muted right now."
      : audioState.isPlaying
        ? "Now playing"
        : "Tap anywhere or choose a track control to start the music.";

  return (
    <div ref={rootRef} className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`rounded-full border border-white/10 bg-black/35 text-paper-cream/80 backdrop-blur transition hover:bg-white/8 ${menuButtonClassName}`}
        aria-expanded={open}
        aria-label="Open game menu"
      >
        Menu
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(9,9,20,0.92)] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur">
          <div className="rounded-2xl border border-white/8 bg-white/4 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-sakura/78">Music</p>
            <p className="mt-1 truncate text-sm font-semibold text-paper-cream">
              {audioState.currentTrackLabel || "No tracks loaded yet"}
            </p>
            <p className="mt-1 text-xs leading-5 text-paper-cream/62">
              {audioState.hasPlaylist
                ? `${menuStatus} Track ${audioState.currentTrackIndex + 1} of ${audioState.trackCount}.`
                : menuStatus}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPreviousTrack}
              disabled={!audioState.hasPlaylist}
              className={actionButtonClassName}
            >
              Prev Track
            </button>
            <button type="button" onClick={onToggleMute} className={actionButtonClassName}>
              {audioState.muted ? "Unmute Audio" : "Mute Audio"}
            </button>
            <button
              type="button"
              onClick={onNextTrack}
              disabled={!audioState.hasPlaylist}
              className={actionButtonClassName}
            >
              Next Track
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReturnHome();
              }}
              className={actionButtonClassName}
            >
              Return Home
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
