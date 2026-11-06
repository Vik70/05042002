"use client";

import { useEffect, useId, useRef, useState } from "react";

const WIDTH = 400;
const HEIGHT = 170;
const POINTS = 56;

const roughAt = (index: number) =>
  Math.sin(index * 2.7) * 0.55 + Math.sin(index * 5.3 + 1.1) * 0.35 + Math.sin(index * 11.9 + 0.4) * 0.25;

const yAt = (x: number, roughness: number) => {
  const index = (x / WIDTH) * (POINTS - 1);
  const low = Math.floor(index);
  const high = Math.min(POINTS - 1, low + 1);
  const mix = index - low;
  const rough = roughAt(low) * (1 - mix) + roughAt(high) * mix;
  const gentle = Math.sin((x / WIDTH) * Math.PI * 1.6 + 0.6) * 18;
  return HEIGHT / 2 + gentle + rough * 58 * roughness;
};

const buildPath = (roughness: number) => {
  const points = Array.from({ length: POINTS }, (_, index) => {
    const x = (index / (POINTS - 1)) * WIDTH;
    return [x, yAt(x, roughness)] as const;
  });
  let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index];
    const [nx, ny] = points[index + 1];
    path += ` Q ${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
  }
  const last = points[points.length - 1];
  return `${path} L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
};

const ease = (value: number) => 1 - Math.pow(1 - value, 3);

/** A jagged line that calms into a gentle road, with a little heart travelling along it. */
export function SmoothRoad({
  start = true,
  duration = 6500,
  settled = false,
  className = "",
}: {
  start?: boolean;
  duration?: number;
  settled?: boolean;
  className?: string;
}) {
  const [progress, setProgress] = useState(settled ? 1 : 0);
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const gradient = `road-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.35 });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (settled || !start || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const began = performance.now();
    const step = (now: number) => {
      const value = Math.min(1, (now - began) / duration);
      setProgress(value);
      if (value < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [start, visible, duration, settled]);

  const roughness = 1 - ease(Math.min(1, progress * 1.15));
  const heartX = 14 + ease(progress) * (WIDTH - 28);
  const heartY = yAt(heartX, roughness);
  const path = buildPath(roughness);

  return (
    <div ref={host} className={className}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ff9fb5" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ffcf8a" />
            <stop offset="100%" stopColor="#fff1d6" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke={`url(#${gradient})`} strokeWidth="12" strokeLinecap="round" opacity="0.16" />
        <path d={path} fill="none" stroke={`url(#${gradient})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(${heartX.toFixed(1)} ${(heartY - 13).toFixed(1)})`}>
          <circle r="14" fill="#ffcf8a" opacity="0.22" />
          <path
            d="M0 7 C -9 1 -9 -6 -4.5 -6.5 C -2.2 -6.8 -0.8 -5.2 0 -4 C 0.8 -5.2 2.2 -6.8 4.5 -6.5 C 9 -6 9 1 0 7 Z"
            fill="#ff7f9b"
            stroke="#fff1e6"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
}
