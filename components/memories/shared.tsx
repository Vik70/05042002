import type { Route } from "next";
import Link from "next/link";
import { toParagraphs } from "@/lib/memories/format";
import type { AlbumPhoto, MemoryRecord } from "@/lib/memories/types";

export interface CollectionEntry {
  slug: string;
  title: string;
  startDate: string;
  template: MemoryRecord["template"];
}

export interface MemoryTemplateProps {
  memory: MemoryRecord;
  photos: AlbumPhoto[];
  previous: MemoryRecord | null;
  next: MemoryRecord | null;
  collection: CollectionEntry[];
}

export const memoryHref = (slug: string) => `/memories/${slug}` as Route;

export function Story({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {toParagraphs(text).map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph}
        </p>
      ))}
    </>
  );
}

export function BackHome({ className }: { className: string }) {
  return (
    <Link href="/" className={className}>
      <span aria-hidden="true">←</span> Us, so far
    </Link>
  );
}

export function MemoryPager({
  previous,
  next,
  className,
  linkClassName,
}: {
  previous: MemoryRecord | null;
  next: MemoryRecord | null;
  className?: string;
  linkClassName: string;
}) {
  return (
    <nav className={`flex flex-col items-stretch justify-between gap-3 sm:flex-row ${className ?? ""}`}>
      {previous ? (
        <Link href={memoryHref(previous.slug)} className={linkClassName}>
          <span className="block text-[11px] uppercase tracking-[0.25em] opacity-60">Before this</span>
          {previous.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={memoryHref(next.slug)} className={`${linkClassName} sm:text-right`}>
          <span className="block text-[11px] uppercase tracking-[0.25em] opacity-60">After this</span>
          {next.title}
        </Link>
      ) : (
        <Link href="/" className={`${linkClassName} sm:text-right`}>
          <span className="block text-[11px] uppercase tracking-[0.25em] opacity-60">That&apos;s all, for now</span>
          Back to every memory
        </Link>
      )}
    </nav>
  );
}

// Deterministic randomness keeps server and client renders identical.
export const seeded = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};
