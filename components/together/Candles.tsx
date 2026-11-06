import type { ReactNode } from "react";

const HEIGHTS = [0.78, 0.92, 0.84, 1, 0.88, 0.95, 0.8];

export function Candle({
  lit,
  height = 1,
  size = "md",
  next = false,
  delay = 0,
}: {
  lit: boolean;
  height?: number;
  size?: "sm" | "md" | "lg";
  next?: boolean;
  delay?: number;
}) {
  const scale = size === "sm" ? 0.55 : size === "lg" ? 1.25 : 1;
  return (
    <span className="relative flex flex-col items-center" style={{ width: 22 * scale }} aria-hidden="true">
      <span className="relative block" style={{ height: 30 * scale, width: 16 * scale }}>
        {lit ? (
          <span
            className="absolute inset-x-0 bottom-0 block origin-bottom rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-[radial-gradient(circle_at_50%_72%,#fffbe8,#ffd27a_42%,#ff8f4a_78%)] shadow-[0_0_28px_10px_rgba(255,190,110,0.38)] [animation:flameIn_0.7s_cubic-bezier(0.2,0.9,0.3,1.3)_both,flicker_2.4s_ease-in-out_0.7s_infinite]"
            style={{ height: 26 * scale, animationDelay: `${delay}ms, ${delay + 700}ms` }}
          />
        ) : next ? (
          <span
            className="absolute inset-x-[30%] bottom-0 block rounded-full bg-[#ffd27a]/40 blur-[2px] [animation:twinkle_1.6s_ease-in-out_infinite]"
            style={{ height: 8 * scale }}
          />
        ) : null}
      </span>
      <span className="block bg-[#2a1220]" style={{ height: 5 * scale, width: 2 }} />
      <span
        className="block rounded-t-[3px] bg-[linear-gradient(90deg,#e9d8c4,#fff6ea_45%,#d6c0a6)] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.12)]"
        style={{ width: 14 * scale, height: 46 * scale * height }}
      />
    </span>
  );
}

export function CandleRow({
  lit,
  size = "md",
  showNext = false,
  labels,
  stagger = 0,
  className = "",
}: {
  lit: number;
  size?: "sm" | "md" | "lg";
  showNext?: boolean;
  labels?: ReactNode[];
  stagger?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-center ${size === "sm" ? "gap-2.5" : "gap-4 sm:gap-6"} ${className}`}>
      {HEIGHTS.map((height, index) => (
        <div key={index} className="flex flex-col items-center">
          <Candle lit={index < lit} next={showNext && index === lit} height={height} size={size} delay={index * stagger} />
          {labels?.[index] !== undefined ? <div className="mt-2 text-center">{labels[index]}</div> : null}
        </div>
      ))}
    </div>
  );
}
