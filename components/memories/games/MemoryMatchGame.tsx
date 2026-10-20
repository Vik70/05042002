"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { seeded, type CollectionEntry } from "@/components/memories/shared";
import type { TemplateId } from "@/lib/memories/types";
import { sfx } from "@/lib/sfx";

type IconId = TemplateId | "heart";

function Icon({ id }: { id: IconId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "four-gifts":
      return (
        <g {...common}>
          <rect x="12" y="22" width="24" height="18" rx="2" />
          <path d="M10 16 h28 v6 h-28 z M24 16 v24 M24 16 c-4 -8 -12 -6 -8 0 M24 16 c4 -8 12 -6 8 0" />
        </g>
      );
    case "night-drive":
      return (
        <g {...common}>
          <path d="M28 10 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 z" />
          <path d="M12 12 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5 z" />
        </g>
      );
    case "treasure-hunt":
      return (
        <g {...common}>
          <path d="M10 22 q14 -12 28 0 v16 h-28 z M10 26 h28" />
          <rect x="21" y="24" width="6" height="6" rx="1" />
        </g>
      );
    case "golden-hour":
      return (
        <g {...common}>
          <circle cx="24" cy="26" r="8" />
          <path d="M6 38 q18 -14 36 0 M24 10 v4 M12 16 l3 3 M36 16 l-3 3" />
        </g>
      );
    case "spain":
      return (
        <g {...common}>
          <path d="M8 28 l32 -12 l-6 6 l-4 16 l-6 -8 l-8 4 l2 -6 z" />
        </g>
      );
    case "keepsake":
      return (
        <g {...common}>
          <path d="M24 8 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 z" />
        </g>
      );
    default:
      return (
        <g {...common}>
          <path d="M24 38 C 8 28 8 14 17 13 C 21 12.5 23 15 24 17 C 25 15 27 12.5 31 13 C 40 14 40 28 24 38 Z" />
        </g>
      );
  }
}

interface Card {
  id: number;
  pair: number;
}

const shuffleWith = (random: () => number, count: number): Card[] => {
  const cards = Array.from({ length: count * 2 }, (_, index) => ({ id: index, pair: Math.floor(index / 2) }));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
};

export function MemoryMatchGame({ collection, currentSlug, finale }: { collection: CollectionEntry[]; currentSlug: string; finale: string }) {
  const pairs = useMemo(() => {
    const memories = collection
      .filter((entry) => entry.slug !== currentSlug)
      .slice(0, 5)
      .map((entry) => ({ icon: entry.template as IconId, label: entry.title }));
    return [...memories, { icon: "heart" as IconId, label: "Us" }];
  }, [collection, currentSlug]);

  const [cards, setCards] = useState<Card[]>(() => shuffleWith(seeded(610), pairs.length));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lastMatch, setLastMatch] = useState<string>("");
  const [turns, setTurns] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setCards(shuffleWith(seeded(610), pairs.length));
    setOpen([]);
    setMatched([]);
  }, [pairs.length]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const complete = matched.length === pairs.length;

  const flip = (card: Card) => {
    if (open.length >= 2 || open.includes(card.id) || matched.includes(card.pair)) return;
    sfx.click();
    const nextOpen = [...open, card.id];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    setTurns((value) => value + 1);
    const [first, second] = nextOpen.map((id) => cards.find((entry) => entry.id === id)!);
    if (first.pair === second.pair) {
      timer.current = window.setTimeout(() => {
        const nextMatched = [...matched, first.pair];
        setMatched(nextMatched);
        setOpen([]);
        setLastMatch(pairs[first.pair].label);
        if (nextMatched.length === pairs.length) {
          sfx.chime([392, 493.88, 587.33, 783.99, 987.77]);
        } else {
          sfx.sparkle();
        }
      }, 450);
    } else {
      timer.current = window.setTimeout(() => setOpen([]), 900);
    }
  };

  const replay = () => {
    setCards(shuffleWith(Math.random, pairs.length));
    setOpen([]);
    setMatched([]);
    setLastMatch("");
    setTurns(0);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid w-full max-w-[520px] grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const faceUp = open.includes(card.id) || matched.includes(card.pair);
          const isMatched = matched.includes(card.pair);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card)}
              aria-label={faceUp ? pairs[card.pair].label : "Hidden card"}
              className="aspect-[3/4] [perspective:800px]"
            >
              <span
                className="relative block h-full w-full transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: faceUp ? "rotateY(180deg)" : "none" }}
              >
                <span
                  className="absolute inset-0 grid place-items-center rounded-[14px] border border-[#e8b86b]/40 bg-[radial-gradient(circle_at_50%_40%,#6b2a33,#3a1424)] shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="font-display text-4xl font-semibold italic text-[#e8b86b]/80">6</span>
                  <span className="absolute inset-2 rounded-[10px] border border-[#e8b86b]/25" />
                </span>
                <span
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[14px] bg-[#fbeee4] px-1 text-[#8e3b5c] shadow-[0_10px_24px_rgba(0,0,0,0.35)] ${isMatched ? "ring-2 ring-[#e8b86b]" : ""}`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <svg viewBox="0 0 48 48" className="h-1/2 w-1/2" aria-hidden="true">
                    <Icon id={pairs[card.pair].icon} />
                  </svg>
                  <span className="line-clamp-2 px-1 text-center font-hand text-[15px] leading-tight text-[#4a1a2c] sm:text-lg">{pairs[card.pair].label}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {complete ? (
        <div className="animate-fade-up text-center">
          <p className="font-display text-3xl italic text-[#e8b86b] md:text-4xl">{finale}</p>
          <p className="mt-3 font-sans text-sm text-[#fbeee4]/60">
            {turns} turns ·{" "}
            <button type="button" onClick={replay} className="underline underline-offset-4 hover:text-[#e8b86b]">
              shuffle again
            </button>
          </p>
        </div>
      ) : (
        <p className="min-h-[2rem] text-center font-hand text-2xl text-[#fbeee4]/80">
          {lastMatch ? `✦ ${lastMatch}` : "Find each memory's twin."}
        </p>
      )}
    </div>
  );
}
