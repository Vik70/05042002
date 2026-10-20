import { SkylineSnapGame } from "@/components/memories/games/SkylineSnapGame";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { BackHome, MemoryPager, Story, type MemoryTemplateProps } from "@/components/memories/shared";
import { asText, formatFilmStamp, formatMemoryDate } from "@/lib/memories/format";

function HillHero() {
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[55vh] w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hill-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b3a3a" />
          <stop offset="1" stopColor="#2f1a24" />
        </linearGradient>
      </defs>
      <path d="M0 300 L 60 290 L 70 270 L 90 285 L 140 280 L 150 250 L 170 278 L 260 282 L 300 292 L 380 286 L 1200 300 L 1200 400 L 0 400 Z" fill="#a8565a" opacity="0.45" />
      <path d="M -50 400 C 200 230 460 170 640 180 C 820 190 1000 260 1250 400 Z" fill="url(#hill-grass)" />
      <g fill="#2f1a24" transform="translate(612 150)">
        <circle cx="0" cy="0" r="7" />
        <path d="M -8 8 Q 0 2 8 8 L 10 32 L -10 32 Z" />
        <circle cx="24" cy="2" r="6.5" />
        <path d="M 16 10 Q 24 4 32 10 L 34 32 L 14 32 Z" />
        <path d="M 6 18 Q 12 14 18 18" stroke="#2f1a24" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function GoldenHourMemory({ memory, photos, previous, next }: MemoryTemplateProps) {
  const finale = asText(memory.extras.finale, "Same hill, same light, next summer?");
  const stamp = formatFilmStamp(memory.startDate);

  return (
    <div className="film-grain relative min-h-screen overflow-hidden bg-[#fbe6cf] text-[#3b1610]">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(180deg,#f7b267_0%,#f4845f_38%,#f27059_58%,#c8547a_82%,#6d3b6b_100%)]">
        <div className="pointer-events-none absolute -left-20 top-10 h-[60vh] w-[40vw] rotate-12 rounded-full bg-[#ffd29a] opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-1/3 h-[40vh] w-[22vw] rounded-full bg-[#ff6b3d] opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-48 w-48 -translate-x-1/2 rounded-full bg-[#fff1c9] shadow-[0_0_120px_60px_rgba(255,214,150,0.55)]" />
        <HillHero />

        <div className="relative z-10 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <BackHome className="font-film text-xl italic text-[#3b1610]/80 transition hover:text-[#3b1610]" />
        </div>
        <div className="relative z-10 mx-auto mt-[12vh] max-w-3xl px-6 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.5em] text-[#3b1610]/70">{memory.location}</p>
          <h1 className="mt-4 font-film text-6xl italic leading-[0.95] text-[#2b0f0b] md:text-8xl">{memory.title}</h1>
          {memory.subtitle ? <p className="mt-5 font-film text-2xl text-[#3b1610]/80 md:text-3xl">{memory.subtitle}</p> : null}
        </div>
        <span className="absolute bottom-24 right-6 z-10 font-lcd md:bottom-8 md:right-28 text-3xl text-[#ff9d3b] [text-shadow:0_0_8px_rgba(255,140,40,0.9)]">{stamp}</span>
      </section>

      <section className="relative mx-auto max-w-2xl px-6 py-20 md:py-28">
        <div className="space-y-6 font-film text-2xl leading-[1.55] text-[#3b1610] md:text-[1.75rem] [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-3 [&>p:first-child]:first-letter:text-7xl [&>p:first-child]:first-letter:leading-[0.8]">
          <Story text={memory.story} />
        </div>
        {memory.song ? (
          <p className="mt-10 text-center font-sans text-xs uppercase tracking-[0.4em] text-[#a8565a]">♪ {memory.song}</p>
        ) : null}
      </section>

      <section className="relative bg-[linear-gradient(180deg,#fbe6cf,#f6cfa8)] px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-sans text-xs uppercase tracking-[0.5em] text-[#a8565a]">the game</p>
          <h2 className="mb-10 mt-3 text-center font-film text-5xl italic md:text-6xl">Snap the skyline</h2>
          <SkylineSnapGame photos={photos} finale={finale} stamp={stamp} />
        </div>
      </section>

      <section className="relative px-5 py-20">
        <h2 className="mb-12 text-center font-film text-4xl italic">the roll</h2>
        <div className="mx-auto max-w-5xl">
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="polaroid"
            linkClassName="rounded-full border border-[#3b1610]/30 px-6 py-2.5 font-film text-xl italic text-[#3b1610] transition hover:bg-[#3b1610] hover:text-[#fbe6cf]"
            emptyText="This roll is still being developed."
            emptyClassName="font-film text-2xl italic text-[#3b1610]/60"
          />
        </div>
        <p className="mt-14 text-center font-sans text-xs uppercase tracking-[0.4em] text-[#3b1610]/50">{formatMemoryDate(memory.startDate, memory.endDate)}</p>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-8 max-w-4xl"
          linkClassName="flex-1 border-t border-[#3b1610]/20 px-2 py-5 font-film text-2xl italic text-[#3b1610] transition hover:text-[#c8547a]"
        />
      </section>
    </div>
  );
}
