import clsx from "clsx";
import type { Rank } from "@/game/types/game";

const rankStyles: Record<Rank, string> = {
  bronze: "border-orange-300/30 bg-orange-300/15 text-orange-100",
  silver: "border-slate-200/30 bg-slate-200/10 text-slate-100",
  gold: "border-yellow-300/40 bg-yellow-300/20 text-yellow-100",
  spirit: "border-sky-300/40 bg-sky-300/15 text-sky-100",
  mythic: "border-fuchsia-300/40 bg-fuchsia-300/15 text-fuchsia-100",
};

export function RankBadge({
  rank,
  className,
}: {
  rank: Rank;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-[0.22em]",
        rankStyles[rank],
        className,
      )}
    >
      {rank}
    </span>
  );
}
