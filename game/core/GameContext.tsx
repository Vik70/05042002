"use client";

import { createContext, useContext } from "react";
import type { GameManager } from "@/game/core/GameManager";

export const GameContext = createContext<GameManager | null>(null);

export const useGameManager = (): GameManager => {
  const manager = useContext(GameContext);

  if (!manager) {
    throw new Error("GameManager is not available.");
  }

  return manager;
};
