import Link from "next/link";
import { MemoryMatchGame } from "@/components/memories/games/MemoryMatchGame";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { SealedLetter } from "@/components/memories/SealedLetter";
import { BackHome, MemoryPager, Story, memoryHref, seeded, type MemoryTemplateProps } from "@/components/memories/shared";
import { asText, formatMemoryDate, formatShortDate } from "@/lib/memories/format";

const LEAF_COLOURS = ["#c2454f", "#e8b86b", "#b4532a", "#8e3b5c", "#d98a3d"];

function FallingLeaves() {
  const random = seeded(1006);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => {
        const left = random() * 100;
        const duration = 14 + random() * 12;
        const delay = -random() * 26;
        const size = 14 + random() * 14;
        const drift = (random() - 0.3) * 160;
        return (
          <svg
            key={index}
            viewBox="0 0 20 20"
            className="absolute top-0"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              animation: `leafFall ${duration}s linear ${delay}s infinite`,
              ["--drift" as string]: `${drift}px`,
            }}
          >
            <path d="M10 1 C 16 5 18 12 10 19 C 2 12 4 5 10 1 Z M10 4 L10 18" fill={LEAF_COLOURS[index % LEAF_COLOURS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth="0.6" />
          </svg>
        );
      })}
    </div>
  );
}

function Candle({ className }: { className: string }) {
  return (
    <div className={`pointer-events-none flex flex-col items-center ${className}`} aria-hidden="true">
      <span className="block h-7 w-4 origin-bottom rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-[radial-gradient(circle_at_50%_70%,#fff6d8,#ffc861_45%,#ff8a3d_80%)] shadow-[0_0_40px_14px_rgba(255,190,100,0.35)] [animation:flicker_2.6s_ease-in-out_infinite]" />
      <span className="mt-0.5 block h-1.5 w-0.5 bg-[#2a0f1c]" />
      <span className="block h-24 w-8 rounded-t-[3px] bg-[linear-gradient(90deg,#efe2cf,#fbf3e6_45%,#d9c8b0)]" />
    </div>
  );
}

export function SixMonthsMemory({ memory, photos, previous, next, collection }: MemoryTemplateProps) {
  const letter = asText(memory.extras.letter);
  const signoff = asText(memory.extras.signoff, "Always yours");
  const finale = asText(memory.extras.finale, "Every memory, matched.");
  const earlier = collection.filter((entry) => entry.slug !== memory.slug && entry.startDate <= memory.startDate);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#2a0f1c_0%,#3a1424_40%,#4a1a2c_100%)] text-[#fbeee4]">
      <FallingLeaves />

      <section className="relative z-10 flex min-h-[100svh] flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <BackHome className="font-hand text-2xl text-[#fbeee4]/70 transition hover:text-[#e8b86b]" />
        <div className="relative mx-auto flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,184,107,0.22),transparent_65%)]" />
          <p className="relative font-sans text-xs uppercase tracking-[0.5em] text-[#e8b86b]/80">{formatShortDate(memory.startDate)}</p>
          <p className="relative bg-[linear-gradient(180deg,#fff1d0,#e8b86b_55%,#b07a35)] bg-clip-text font-display text-[11rem] font-semibold italic leading-none text-transparent drop-shadow-[0_10px_40px_rgba(232,184,107,0.35)] md:text-[16rem]">
            6
          </p>
          <h1 className="relative -mt-4 font-hand text-5xl text-[#fbeee4] md:text-6xl">{memory.title}</h1>
          {memory.subtitle ? <p className="relative mt-4 font-display text-lg italic text-[#fbeee4]/70">{memory.subtitle}</p> : null}
          <Candle className="absolute -left-2 bottom-10 hidden sm:flex" />
          <Candle className="absolute -right-2 bottom-16 hidden scale-90 sm:flex" />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-20">
        <div className="space-y-5 text-center font-display text-xl italic leading-9 text-[#fbeee4]/85 md:text-2xl md:leading-10">
          <Story text={memory.story} />
        </div>
        {memory.song ? <p className="mt-8 text-center font-sans text-xs uppercase tracking-[0.4em] text-[#e8b86b]/80">♪ {memory.song}</p> : null}
      </section>

      {earlier.length ? (
        <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
          <p className="mb-6 text-center font-sans text-xs uppercase tracking-[0.5em] text-[#e8b86b]/70">so far</p>
          <ol className="relative border-l border-[#e8b86b]/30 pl-6">
            {earlier.map((entry) => (
              <li key={entry.slug} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[29px] top-2 h-2.5 w-2.5 rounded-full bg-[#e8b86b] shadow-[0_0_10px_rgba(232,184,107,0.8)]" />
                <Link href={memoryHref(entry.slug)} className="group block">
                  <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#fbeee4]/50">{formatShortDate(entry.startDate)}</span>
                  <span className="block font-display text-2xl italic text-[#fbeee4] transition group-hover:text-[#e8b86b]">{entry.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="relative z-10 px-5 pb-24">
        <SealedLetter letter={letter} signoff={signoff} />
      </section>

      <section className="relative z-10 border-y border-[#e8b86b]/15 bg-[#2a0f1c]/60 px-5 py-20 backdrop-blur-sm">
        <p className="text-center font-sans text-xs uppercase tracking-[0.5em] text-[#e8b86b]/70">the game</p>
        <h2 className="mb-10 mt-3 text-center font-display text-5xl italic">Memory match</h2>
        <MemoryMatchGame collection={collection} currentSlug={memory.slug} finale={finale} />
      </section>

      <section className="relative z-10 px-5 py-20">
        <h2 className="mb-10 text-center font-hand text-4xl text-[#e8b86b]">half a year, in pictures</h2>
        <div className="mx-auto max-w-5xl">
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="letter"
            linkClassName="rounded-full border border-[#e8b86b]/50 px-6 py-2.5 font-display text-lg italic text-[#e8b86b] transition hover:bg-[#e8b86b] hover:text-[#2a0f1c]"
            emptyText="The pictures are tucked away for now."
            emptyClassName="font-display text-xl italic text-[#fbeee4]/50"
          />
        </div>
        <p className="mt-14 text-center font-sans text-xs uppercase tracking-[0.4em] text-[#fbeee4]/40">{formatMemoryDate(memory.startDate, memory.endDate)}</p>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-8 max-w-4xl"
          linkClassName="flex-1 rounded-[14px] border border-[#e8b86b]/25 px-5 py-4 font-display text-xl italic text-[#fbeee4] transition hover:border-[#e8b86b]/70"
        />
      </section>
    </div>
  );
}
