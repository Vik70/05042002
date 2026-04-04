"use client";

import { useEffect, useRef } from "react";
import { GameManager } from "@/game/core/GameManager";

export function GameCanvas({
  onReady,
}: {
  onReady: (manager: GameManager | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const manager = new GameManager();
    let active = true;

    void manager
      .init(hostRef.current)
      .then(() => {
        if (!active) {
          manager.destroy();
          return;
        }

        onReady(manager);
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Failed to initialize game manager.", error);
        }

        manager.destroy();
      });

    return () => {
      active = false;
      onReady(null);
      manager.destroy();
    };
  }, [onReady]);

  return <div ref={hostRef} className="game-canvas-host absolute inset-0" />;
}
