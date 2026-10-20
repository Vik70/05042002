"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

const REVEAL_AT = 0.5;

export function ScratchCard({ secret, accent, surface, ink }: { secret: string; accent: string; surface: string; ink: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(0);
  const revealedRef = useRef(false);
  revealedRef.current = revealed;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").trim() || "Georgia";

    const paint = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = wrap.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = "source-over";
      const foil = context.createLinearGradient(0, 0, width, height);
      foil.addColorStop(0, "#d9d4cf");
      foil.addColorStop(0.35, "#f4f1ee");
      foil.addColorStop(0.55, "#bdb6b0");
      foil.addColorStop(1, "#e9e5e1");
      context.fillStyle = foil;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 0.18;
      context.fillStyle = accent;
      for (let x = -height; x < width; x += 18) {
        context.beginPath();
        context.moveTo(x, height);
        context.lineTo(x + height, 0);
        context.lineTo(x + height + 8, 0);
        context.lineTo(x + 8, height);
        context.fill();
      }
      context.globalAlpha = 1;
      context.fillStyle = accent;
      context.font = `600 ${Math.max(18, Math.min(30, width / 14))}px ${fontFamily}, serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("scratch me ✦", width / 2, height / 2);
      context.lineCap = "round";
      context.lineJoin = "round";
    };

    paint();
    const observer = new ResizeObserver(() => {
      if (!revealedRef.current) paint();
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [accent, round]);

  const clearedRatio = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return 0;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let index = 3; index < data.length; index += 4 * 24) {
      total += 1;
      if (data[index] < 40) clear += 1;
    }
    return total ? clear / total : 0;
  };

  const scratch = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || revealed) return;
    const bounds = canvas.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const from = last.current ?? point;
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = Math.max(26, bounds.width / 12);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    last.current = point;

    strokes.current += 1;
    if (strokes.current % 6 === 0 && clearedRatio() > REVEAL_AT) {
      setRevealed(true);
      sfx.sparkle();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={wrapRef} className="relative w-full max-w-lg overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.18)]" style={{ background: surface }}>
        <div className="flex min-h-[200px] items-center justify-center px-8 py-10 text-center">
          <p className="whitespace-pre-line font-hand text-3xl leading-snug" style={{ color: ink }}>
            {secret || "Nothing hidden here yet. Add a secret message in edit mode."}
          </p>
        </div>
        <canvas
          key={round}
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full cursor-pointer touch-none transition-opacity duration-700 ${revealed ? "pointer-events-none opacity-0" : "opacity-100"}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            last.current = null;
            scratch(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 0 && event.pointerType === "mouse") return;
            scratch(event);
          }}
          onPointerUp={() => {
            last.current = null;
          }}
          onPointerCancel={() => {
            last.current = null;
          }}
        />
      </div>
      {revealed ? (
        <button
          type="button"
          onClick={() => {
            setRevealed(false);
            strokes.current = 0;
            setRound((value) => value + 1);
          }}
          className="font-hand text-xl underline-offset-4 hover:underline"
          style={{ color: accent }}
        >
          cover it up again
        </button>
      ) : (
        <p className="font-hand text-xl opacity-70" style={{ color: ink }}>
          Something&apos;s hidden under the foil.
        </p>
      )}
    </div>
  );
}
