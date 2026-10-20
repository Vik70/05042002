"use client";

import { useState } from "react";
import { sfx } from "@/lib/sfx";

const COBALT = "#1f4e9c";
const SIZE = 3;
const START_ORDER = [4, 7, 0, 8, 2, 6, 1, 5, 3];

const shuffle = () => {
  const order = Array.from({ length: SIZE * SIZE }, (_, index) => index);
  do {
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
  } while (order.every((tile, index) => tile === index));
  return order;
};

function PanelArt() {
  return (
    <g>
      <rect width="300" height="300" fill="#fbf7ee" />
      <rect x="6" y="6" width="288" height="288" fill="none" stroke={COBALT} strokeWidth="8" />
      <rect x="20" y="20" width="260" height="260" fill="none" stroke={COBALT} strokeWidth="1.5" />
      {[
        [20, 20, 0],
        [280, 20, 90],
        [280, 280, 180],
        [20, 280, 270],
      ].map(([x, y, angle]) => (
        <g key={angle} transform={`translate(${x} ${y}) rotate(${angle})`} fill={COBALT}>
          <path d="M 0 0 Q 26 4 30 30 Q 4 26 0 0 Z" />
          <circle cx="34" cy="34" r="4" fill="#f2b632" />
        </g>
      ))}

      {/* Sun */}
      <g transform="translate(222 76)">
        {Array.from({ length: 12 }, (_, index) => (
          <path key={index} d="M 0 -30 L 5 -44 L -5 -44 Z" fill={COBALT} transform={`rotate(${index * 30})`} />
        ))}
        <circle r="26" fill="#f2b632" stroke={COBALT} strokeWidth="2.5" />
        <circle r="15" fill="none" stroke={COBALT} strokeWidth="1.5" />
      </g>

      {/* Lemon branch and bougainvillea */}
      <path d="M 34 54 C 60 66 84 74 112 96" fill="none" stroke={COBALT} strokeWidth="3" strokeLinecap="round" />
      {[
        [56, 58, -30],
        [80, 86, 30],
        [98, 78, -20],
      ].map(([x, y, angle]) => (
        <ellipse key={`${x}`} cx={x} cy={y} rx="12" ry="5" fill={COBALT} transform={`rotate(${angle} ${x} ${y})`} />
      ))}
      <ellipse cx="70" cy="100" rx="13" ry="10" fill="#f2b632" stroke={COBALT} strokeWidth="2" />
      <ellipse cx="108" cy="110" rx="11" ry="9" fill="#f2b632" stroke={COBALT} strokeWidth="2" />
      {[
        [130, 50],
        [146, 40],
        [140, 64],
        [160, 56],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill="#d94f8a">
          <circle cx="0" cy="-4" r="4" />
          <circle cx="4" cy="2" r="4" />
          <circle cx="-4" cy="2" r="4" />
        </g>
      ))}

      {/* Banner */}
      <rect x="20" y="132" width="260" height="38" fill={COBALT} />
      <text x="150" y="158" textAnchor="middle" fontSize="21" fill="#fbf7ee" letterSpacing="2" style={{ fontFamily: "var(--font-playfair), serif", fontStyle: "italic" }}>
        Málaga ✦ Madrid
      </text>

      {/* Sea, boat and swallows */}
      {[212, 232, 252].map((y, index) => (
        <path
          key={y}
          d={`M 20 ${y} q 13 -10 26 0 t 26 0 t 26 0 t 26 0 t 26 0 t 26 0 t 26 0 t 26 0 t 26 0 t 26 0`}
          fill="none"
          stroke={COBALT}
          strokeWidth={index === 1 ? 3 : 2}
        />
      ))}
      <g transform="translate(96 188)" fill={COBALT}>
        <path d="M 0 16 L 44 16 L 36 26 L 8 26 Z" />
        <path d="M 22 14 L 22 -16 L 40 12 Z" fill="#fbf7ee" stroke={COBALT} strokeWidth="2" />
        <path d="M 19 14 L 19 -8 L 6 12 Z" />
      </g>
      {[
        [208, 196],
        [232, 186],
      ].map(([x, y]) => (
        <path key={x} d={`M ${x} ${y} q 6 -6 12 0 q 6 -6 12 0`} fill="none" stroke={COBALT} strokeWidth="2" />
      ))}
      <path d="M 196 270 q 20 -12 40 0" fill="none" stroke="#d94f8a" strokeWidth="2" />
      <circle cx="40" cy="190" r="6" fill="#d94f8a" />
      <circle cx="54" cy="184" r="4" fill="#f2b632" />
    </g>
  );
}

export function AzulejoPuzzle({ postcard, dateLabel }: { postcard: string; dateLabel: string }) {
  const [order, setOrder] = useState(START_ORDER);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const solved = order.every((tile, index) => tile === index);

  const choose = (slot: number) => {
    if (solved) return;
    if (selected === null) {
      setSelected(slot);
      sfx.click();
      return;
    }
    if (selected === slot) {
      setSelected(null);
      return;
    }
    const nextOrder = [...order];
    [nextOrder[selected], nextOrder[slot]] = [nextOrder[slot], nextOrder[selected]];
    setOrder(nextOrder);
    setSelected(null);
    setMoves((value) => value + 1);
    if (nextOrder.every((tile, index) => tile === index)) {
      sfx.chime([587.33, 739.99, 880, 1174.66]);
    } else {
      sfx.pop();
    }
  };

  const reset = () => {
    setOrder(shuffle());
    setSelected(null);
    setMoves(0);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={`grid w-full max-w-[420px] grid-cols-3 rounded-[6px] bg-[#e9dcc5] p-1.5 shadow-[0_24px_50px_rgba(31,78,156,0.25)] transition-[gap] duration-700 ${solved ? "gap-0" : "gap-1.5"}`}>
        {order.map((tile, slot) => {
          const col = tile % SIZE;
          const row = Math.floor(tile / SIZE);
          return (
            <button
              key={tile}
              type="button"
              onClick={() => choose(slot)}
              aria-label={`Tile ${slot + 1}`}
              className={`relative aspect-square overflow-hidden transition duration-200 ${selected === slot ? "z-10 scale-[1.06] shadow-[0_0_0_3px_#f2b632,0_10px_20px_rgba(0,0,0,0.25)]" : "hover:brightness-105"} ${solved ? "cursor-default" : ""}`}
            >
              <svg viewBox={`${col * 100} ${row * 100} 100 100`} className="block h-full w-full" aria-hidden="true">
                <PanelArt />
              </svg>
              {!solved ? <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(31,78,156,0.18),inset_0_0_12px_rgba(255,255,255,0.4)]" /> : null}
            </button>
          );
        })}
      </div>

      {solved ? (
        <div className="w-full max-w-xl animate-pop-in">
          <div className="relative grid grid-cols-1 gap-6 rounded-[6px] bg-[#fffaf1] p-6 shadow-[0_18px_40px_rgba(58,29,16,0.2)] sm:grid-cols-[1.4fr_1fr] md:p-8">
            <p className="font-hand text-[1.7rem] leading-snug text-[#3a1d10] sm:border-r sm:border-dashed sm:border-[#3a1d10]/25 sm:pr-6">{postcard}</p>
            <div className="flex flex-col items-end justify-between gap-6">
              <div className="relative">
                <div className="grid h-20 w-16 rotate-3 place-items-center border-[3px] border-dotted border-[#d9774f] bg-[#f2b632] p-1">
                  <div className="grid h-full w-full place-items-center bg-[#1f4e9c] text-2xl text-[#fbf7ee]">✦</div>
                </div>
                <span className="absolute -left-12 top-5 grid h-16 w-16 rotate-[-14deg] place-items-center rounded-full border-2 border-[#c2453a]/60 text-center font-sans text-[9px] font-semibold uppercase leading-tight tracking-widest text-[#c2453a]/70">
                  correos
                  <br />
                  España
                </span>
              </div>
              <div className="w-full space-y-3 font-hand text-xl text-[#3a1d10]/70">
                <p className="border-b border-[#3a1d10]/25 pb-1">to: Aanavee</p>
                <p className="border-b border-[#3a1d10]/25 pb-1">{dateLabel}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center font-sans text-sm text-[#3a1d10]/60">
            mended in {moves} {moves === 1 ? "swap" : "swaps"} ·{" "}
            <button type="button" onClick={reset} className="underline underline-offset-4 hover:text-[#1f4e9c]">
              break it again
            </button>
          </p>
        </div>
      ) : (
        <p className="max-w-md text-center font-sans text-sm leading-6 text-[#3a1d10]/70">
          The tiles fell off the wall. Tap two tiles to swap them until the panel is whole again. Something is written on the back.
        </p>
      )}
    </div>
  );
}
