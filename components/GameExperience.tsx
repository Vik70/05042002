"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditsPanel } from "@/components/CreditsPanel";
import { DialogueBox } from "@/components/DialogueBox";
import { GameCanvas } from "@/components/GameCanvas";
import { GiftPrepOverlay } from "@/components/GiftPrepOverlay";
import { HubOverlay } from "@/components/HubOverlay";
import { ObjectiveBanner } from "@/components/ObjectiveBanner";
import { ResultsCard } from "@/components/ResultsCard";
import { SceneFade } from "@/components/SceneFade";
import { TutorialPrompt } from "@/components/TutorialPrompt";
import { GameContext } from "@/game/core/GameContext";
import type { GameManager } from "@/game/core/GameManager";
import type { UIState } from "@/game/types/game";
import { useIsPortraitViewport, useIsTouchDevice } from "@/lib/hooks";

const ACTIVE_GAME_SCENES = new Set(["followSimba", "marksman", "rally", "apothecary", "voice"]);
const LANDSCAPE_HINT_STORAGE_KEY = "aanavee-landscape-hint-seen";

export function GameExperience() {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const topChromeRef = useRef<HTMLDivElement | null>(null);
  const shouldLockCanvasTouchRef = useRef(false);
  const [manager, setManager] = useState<GameManager | null>(null);
  const [uiState, setUiState] = useState<UIState | null>(null);
  const [topChromeHeight, setTopChromeHeight] = useState(0);
  const [showLandscapeHint, setShowLandscapeHint] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const isTouchDevice = useIsTouchDevice();
  const isPortraitViewport = useIsPortraitViewport();

  const handleReady = useCallback((nextManager: GameManager | null) => {
    setManager(nextManager);
    setUiState(nextManager?.getUiState() ?? null);
  }, []);

  useEffect(() => {
    if (!manager) {
      return;
    }

    setUiState(manager.getUiState());
    return manager.subscribeUi((nextState) => {
      setUiState(nextState);
    });
  }, [manager]);

  useEffect(() => {
    const shell = shellRef.current;
    const canvasHost = shell?.querySelector<HTMLElement>(".game-canvas-host");

    if (!canvasHost) {
      return;
    }

    const handleTouchMove = (event: TouchEvent) => {
      // Only lock the canvas during live gameplay so hub and modal overlays can scroll normally.
      if (shouldLockCanvasTouchRef.current && event.cancelable) {
        event.preventDefault();
      }
    };

    canvasHost.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      canvasHost.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    const topChrome = topChromeRef.current;

    if (!topChrome) {
      return;
    }

    const updateHeight = () => {
      setTopChromeHeight(Math.ceil(topChrome.getBoundingClientRect().height));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(topChrome);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  const activeGameScene = uiState ? ACTIVE_GAME_SCENES.has(uiState.sceneId) : false;
  const hasBlockingOverlay = Boolean(
    uiState?.dialogue.visible ||
      uiState?.giftPrep.visible ||
      uiState?.results.visible ||
      uiState?.credits.visible,
  );
  const shouldLockCanvasTouch = activeGameScene && !hasBlockingOverlay;
  const showPortraitGameplayLayout =
    Boolean(uiState) &&
    isPortraitViewport &&
    shouldLockCanvasTouch;
  const showCompactLandscapeLayout =
    Boolean(uiState) &&
    !isPortraitViewport &&
    shouldLockCanvasTouch &&
    viewportHeight > 0 &&
    viewportHeight <= 500;

  useEffect(() => {
    shouldLockCanvasTouchRef.current = shouldLockCanvasTouch;
  }, [shouldLockCanvasTouch]);

  useEffect(() => {
    if (!isTouchDevice || !isPortraitViewport || !shouldLockCanvasTouch) {
      setShowLandscapeHint(false);
      return;
    }

    try {
      if (window.localStorage.getItem(LANDSCAPE_HINT_STORAGE_KEY)) {
        return;
      }

      window.localStorage.setItem(LANDSCAPE_HINT_STORAGE_KEY, "seen");
      setShowLandscapeHint(true);

      const timeout = window.setTimeout(() => {
        setShowLandscapeHint(false);
      }, 3000);

      return () => {
        window.clearTimeout(timeout);
      };
    } catch {
      setShowLandscapeHint(true);

      const timeout = window.setTimeout(() => {
        setShowLandscapeHint(false);
      }, 3000);

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [isPortraitViewport, isTouchDevice, shouldLockCanvasTouch]);

  return (
    <GameContext.Provider value={manager}>
      <main className="flex min-h-screen items-center justify-center px-0 md:px-6 md:py-6">
        <div
          ref={shellRef}
          className="game-shell relative overflow-hidden overscroll-none bg-black/8 shadow-[0_30px_100px_rgba(0,0,0,0.28)] md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_40px_120px_rgba(0,0,0,0.32)]"
        >
          <GameCanvas onReady={handleReady} />

          <div
            ref={topChromeRef}
            className="pointer-events-none absolute inset-x-0 top-0 z-40 pl-safe pr-safe pt-safe"
          >
            <div className="pointer-events-auto flex items-center justify-between gap-3 p-3 md:p-4">
              <button
                type="button"
                onClick={() => {
                  manager?.destroy();
                  router.push("/");
                }}
                className="min-h-[44px] rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-paper-cream/80 backdrop-blur transition hover:bg-white/8 md:px-4 md:py-2 md:text-sm"
              >
                Return Home
              </button>
            </div>
          </div>

          {!uiState ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/18 px-6 text-center text-sm text-paper-cream/80 md:text-base">
              Simba is waking the shrine...
            </div>
          ) : (
            <>
              <SceneFade fade={uiState.fade} />
              {!showCompactLandscapeLayout ? (
                <>
                  <ObjectiveBanner
                    guidance={uiState.guidance}
                    portraitLayout={showPortraitGameplayLayout}
                    topOffsetPx={topChromeHeight}
                  />
                  <TutorialPrompt
                    guidance={uiState.guidance}
                    portraitLayout={showPortraitGameplayLayout}
                  />
                </>
              ) : null}

              {showLandscapeHint ? (
                <div
                  className="pointer-events-none absolute inset-x-0 z-40 flex justify-center px-4"
                  style={{
                    top: showPortraitGameplayLayout
                      ? "calc(var(--canvas-top, 0px) + 12px)"
                      : "calc(env(safe-area-inset-top, 0px) + 72px)",
                  }}
                >
                  <div className="flex items-center gap-3 rounded-full border border-white/12 bg-black/50 px-4 py-2 text-xs text-paper-cream/82 shadow-[0_14px_32px_rgba(0,0,0,0.32)] backdrop-blur">
                    <div className="relative h-5 w-6">
                      <span className="absolute left-1 top-0 h-4 w-3 rounded-[5px] border border-paper-cream/55" />
                      <span className="absolute right-0 top-1 h-3 w-3 rounded-full border border-paper-cream/40" />
                    </div>
                    <span>Rotate for the fullest shrine view.</span>
                  </div>
                </div>
              ) : null}

              <HubOverlay
                hub={uiState.hub}
                onSelectTrial={(trialId) => manager?.startGift(trialId)}
                onOpenEnding={() => manager?.openEnding()}
              />

              {uiState.dialogue.visible && manager ? (
                <DialogueBox
                  line={uiState.dialogue.lines[uiState.dialogue.index]}
                  index={uiState.dialogue.index}
                  total={uiState.dialogue.lines.length}
                  canSkip={uiState.dialogue.canSkip}
                  onAdvance={() => manager.advanceDialogue()}
                  onSkip={() => manager.skipDialogue()}
                />
              ) : null}

              {uiState.giftPrep.visible && manager ? (
                <GiftPrepOverlay
                  prep={uiState.giftPrep}
                  onContinue={() => manager.dismissGiftPrep()}
                />
              ) : null}

              {uiState.results.visible && uiState.results.result && manager ? (
                <ResultsCard
                  result={uiState.results.result}
                  onContinue={() => manager.dismissResults()}
                />
              ) : null}

              {uiState.credits.visible && manager ? (
                <CreditsPanel
                  title={uiState.credits.title}
                  message={uiState.credits.message}
                  reflection={uiState.credits.reflection}
                  onClose={() => manager.dismissCredits()}
                />
              ) : null}
            </>
          )}
        </div>
      </main>
    </GameContext.Provider>
  );
}
