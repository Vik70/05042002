import clsx from "clsx";
import type { FadeState } from "@/game/types/game";

export function SceneFade({ fade }: { fade: FadeState }) {
  return (
    <div
      className={clsx(
        "pointer-events-none absolute inset-0 transition-opacity duration-500",
        fade.visible ? (fade.mode === "out" ? "opacity-100" : "opacity-0") : "opacity-0",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,197,66,0.12),transparent_35%),linear-gradient(180deg,rgba(15,14,28,0.25),rgba(6,6,12,0.88))]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,180,200,0.06),transparent_18%,transparent_82%,rgba(110,198,255,0.05))]" />
    </div>
  );
}
