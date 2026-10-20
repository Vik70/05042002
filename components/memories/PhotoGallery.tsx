"use client";

import { useEffect, useRef, useState } from "react";
import { photoUrl } from "@/lib/memories/format";
import type { AlbumPhoto } from "@/lib/memories/types";

export type GalleryVariant = "moonlit" | "film" | "scrapbook" | "polaroid" | "postcard" | "letter" | "keepsake";

const INITIAL_COUNT = 24;
const TILTS = [-2.4, 1.6, -1.1, 2.2, -1.8, 0.9, 2.6, -0.6];
const TAPES = ["#f6c6c1cc", "#c9e3d1cc", "#f9e0a0cc", "#c8d8f0cc"];

function Lightbox({
  photos,
  index,
  onClose,
  onMove,
}: {
  photos: AlbumPhoto[];
  index: number;
  onClose: () => void;
  onMove: (delta: number) => void;
}) {
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onMove(1);
      if (event.key === "ArrowLeft") onMove(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onMove]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const photo = photos[index];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 font-sans"
      onClick={onClose}
      onPointerDown={(event) => {
        startX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (startX.current === null) return;
        const delta = event.clientX - startX.current;
        startX.current = null;
        if (Math.abs(delta) > 50) {
          event.stopPropagation();
          onMove(delta < 0 ? 1 : -1);
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photo.src}
        src={photoUrl(photo, 2000)}
        alt=""
        referrerPolicy="no-referrer"
        className="max-h-full max-w-full animate-[fadeUp_0.35s_ease-out] rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
      <button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); onMove(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20">
        ‹
      </button>
      <button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); onMove(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20">
        ›
      </button>
      <p className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] text-sm text-white/70">
        {index + 1} / {photos.length}
      </p>
      <button type="button" onClick={onClose} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
        Close
      </button>
    </div>
  );
}

function Photo({ photo, variant, index, onOpen }: { photo: AlbumPhoto; variant: GalleryVariant; index: number; onOpen: () => void }) {
  const tilt = TILTS[index % TILTS.length];
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl(photo, 900)}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      width={photo.width}
      height={photo.height}
      className="block h-auto w-full"
    />
  );

  switch (variant) {
    case "film":
      return (
        <button type="button" onClick={onOpen} className="h-full shrink-0 snap-center overflow-hidden rounded-[3px] bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(photo, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-auto object-cover saturate-[0.85]" />
        </button>
      );
    case "scrapbook":
      return (
        <button type="button" onClick={onOpen} className="relative mb-6 block w-full break-inside-avoid bg-white p-2 shadow-[0_8px_20px_rgba(60,50,20,0.18)] transition hover:z-10 hover:scale-[1.03]" style={{ transform: `rotate(${tilt}deg)` }}>
          <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-4deg]" style={{ background: TAPES[index % TAPES.length] }} />
          {image}
        </button>
      );
    case "polaroid":
      return (
        <button type="button" onClick={onOpen} className="mb-6 block w-full break-inside-avoid bg-[#fdfbf6] p-3 pb-12 shadow-[0_10px_30px_rgba(80,30,10,0.25)] transition hover:z-10 hover:scale-[1.03]" style={{ transform: `rotate(${tilt * 0.8}deg)` }}>
          {image}
        </button>
      );
    case "postcard":
      return (
        <button type="button" onClick={onOpen} className="mb-5 block w-full break-inside-avoid rounded-[4px] bg-[#fffaf1] p-2 shadow-[0_6px_18px_rgba(58,29,16,0.18)] outline-2 -outline-offset-[6px] outline-dashed outline-[#1f4e9c]/30 transition hover:scale-[1.02]">
          {image}
        </button>
      );
    case "letter":
      return (
        <button type="button" onClick={onOpen} className="mb-5 block w-full break-inside-avoid border border-[#e8b86b]/50 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:scale-[1.02]">
          <span className="block sepia-[0.18]">{image}</span>
        </button>
      );
    case "keepsake":
      return (
        <button type="button" onClick={onOpen} className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:scale-[1.02]">
          {image}
        </button>
      );
    default:
      return (
        <button type="button" onClick={onOpen} className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-[#f5c542]/30 shadow-[0_0_40px_rgba(245,197,66,0.12)] transition hover:scale-[1.02]">
          {image}
        </button>
      );
  }
}

export function PhotoGallery({
  photos,
  albumUrl,
  variant,
  linkClassName,
  emptyText = "Photos coming soon.",
  emptyClassName = "text-sm opacity-60",
}: {
  photos: AlbumPhoto[];
  albumUrl: string;
  variant: GalleryVariant;
  linkClassName: string;
  emptyText?: string;
  emptyClassName?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll || variant === "film" ? photos : photos.slice(0, INITIAL_COUNT);

  const albumLink = albumUrl ? (
    <a href={albumUrl} target="_blank" rel="noreferrer" className={linkClassName}>
      Open the full album ↗
    </a>
  ) : null;

  if (photos.length === 0) {
    return <div className="flex flex-col items-center gap-4 text-center">{albumLink ?? <p className={emptyClassName}>{emptyText}</p>}</div>;
  }

  const items = visible.map((photo, index) => (
    <Photo key={photo.src} photo={photo} variant={variant} index={index} onOpen={() => setOpen(index)} />
  ));

  return (
    <div className="flex flex-col items-center gap-6">
      {variant === "film" ? (
        <div className="relative w-full bg-[#0b0b0f] py-6">
          <div className="pointer-events-none absolute inset-x-0 top-1.5 h-3 bg-[repeating-linear-gradient(90deg,transparent_0_10px,#f5f0e6_10px_20px,transparent_20px_30px)] opacity-70" />
          <div className="no-scrollbar flex h-56 snap-x snap-mandatory gap-2 overflow-x-auto px-6 md:h-72">{items}</div>
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 h-3 bg-[repeating-linear-gradient(90deg,transparent_0_10px,#f5f0e6_10px_20px,transparent_20px_30px)] opacity-70" />
        </div>
      ) : (
        <div className={`w-full ${variant === "polaroid" || variant === "scrapbook" ? "columns-2 gap-5 md:columns-3 md:gap-8" : "columns-2 gap-4 md:columns-3"}`}>
          {items}
        </div>
      )}

      {!showAll && variant !== "film" && photos.length > INITIAL_COUNT ? (
        <button type="button" onClick={() => setShowAll(true)} className={linkClassName}>
          Show all {photos.length} photos
        </button>
      ) : null}
      {albumLink}

      {open !== null ? (
        <Lightbox
          photos={visible}
          index={open}
          onClose={() => setOpen(null)}
          onMove={(delta) => setOpen((current) => (current === null ? null : (current + delta + visible.length) % visible.length))}
        />
      ) : null}
    </div>
  );
}
