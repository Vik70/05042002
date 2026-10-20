import { TreasureDigGame } from "@/components/memories/games/TreasureDigGame";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { BackHome, MemoryPager, Story, type MemoryTemplateProps } from "@/components/memories/shared";
import { asList, asText, formatMemoryDate, formatShortDate } from "@/lib/memories/format";

const FLAGS = ["#e2574c", "#f4b942", "#5a8a3a", "#f19cbb", "#6fb0c8"];

function Bunting({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className={`pointer-events-none h-16 w-full md:h-20 ${className ?? ""}`} aria-hidden="true">
      <path d="M0 8 Q 300 60 600 8 Q 900 60 1200 8" fill="none" stroke="#5b4326" strokeWidth="2" />
      {Array.from({ length: 24 }, (_, index) => {
        const x = 8 + index * 49;
        const t = ((x + 16) % 600) / 600;
        const y = (1 - t) * (1 - t) * 8 + 2 * t * (1 - t) * 60 + t * t * 8;
        return (
          <g key={index} style={{ transformOrigin: `${x + 16}px ${y}px`, animation: `sway ${3 + (index % 3)}s ease-in-out ${index * 0.15}s infinite` }}>
            <path d={`M ${x} ${y} L ${x + 32} ${y} L ${x + 16} ${y + 38} Z`} fill={FLAGS[index % FLAGS.length]} />
          </g>
        );
      })}
    </svg>
  );
}

function FairyLights() {
  return (
    <div className="pointer-events-none flex justify-between px-4" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span
          key={index}
          className="block h-2.5 w-2.5 rounded-full bg-[#ffe8a3]"
          style={{
            marginTop: `${Math.abs(Math.sin(index * 0.7)) * 14}px`,
            boxShadow: "0 0 12px 3px rgba(255,220,130,0.6)",
            animation: `twinkle ${2 + (index % 3)}s ease-in-out ${index * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function TreasureHuntMemory({ memory, photos, previous, next }: MemoryTemplateProps) {
  const clues = asList(memory.extras.clues);
  const finale = asText(memory.extras.finale, "You found every single one.");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff8e7] text-[#2f3d1f]">
      <div className="absolute inset-x-0 top-0 h-[70vh] bg-[repeating-linear-gradient(0deg,rgba(226,87,76,0.07)_0_22px,transparent_22px_44px),repeating-linear-gradient(90deg,rgba(226,87,76,0.07)_0_22px,transparent_22px_44px)]" />

      <header className="relative">
        <Bunting />
        <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))]">
          <BackHome className="rounded-full bg-[#fffaf0]/90 px-4 py-2 font-hand text-xl text-[#5b4326] shadow-sm transition hover:bg-white" />
        </div>
      </header>

      <section className="relative mx-auto max-w-4xl px-5 pb-12 pt-10 text-center md:pt-16">
        <p className="inline-block rotate-[-3deg] rounded-sm bg-[#e2574c] px-4 py-1 font-hand text-2xl text-white shadow-md">
          {formatShortDate(memory.startDate)}
        </p>
        <h1 className="mt-6 font-display text-6xl font-semibold leading-[0.95] tracking-tight text-[#2f3d1f] md:text-8xl">
          {memory.title}
        </h1>
        <svg viewBox="0 0 300 20" className="mx-auto mt-2 h-4 w-64 text-[#f4b942]" aria-hidden="true">
          <path d="M5 12 C 60 2 120 20 180 9 S 270 6 295 12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
        {memory.subtitle ? <p className="mt-5 font-hand text-3xl text-[#5b4326] md:text-4xl">{memory.subtitle}</p> : null}
        <p className="mt-3 font-sans text-xs uppercase tracking-[0.35em] text-[#5a8a3a]">✿ {memory.location}</p>
      </section>

      <FairyLights />

      <section className="relative mx-auto max-w-2xl px-5 py-12">
        <div className="relative rotate-[0.6deg] rounded-[10px] bg-white px-7 py-9 shadow-[0_20px_50px_rgba(70,50,20,0.15)] md:px-12">
          <span className="absolute -top-4 left-1/2 h-8 w-28 -translate-x-1/2 rotate-[-3deg] bg-[#f9e0a0cc]" />
          <p className="mb-4 text-center font-display text-sm uppercase tracking-[0.3em] text-[#e2574c]">you&apos;re invited</p>
          <div className="space-y-4 font-display text-lg leading-8 text-[#3d4a2c] md:text-xl md:leading-9">
            <Story text={memory.story} />
          </div>
          {memory.song ? (
            <p className="mt-6 text-center font-hand text-2xl text-[#5a8a3a]">on the playlist: {memory.song}</p>
          ) : null}
        </div>
      </section>

      <section className="relative bg-[#e5f0cf] px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-display text-sm uppercase tracking-[0.3em] text-[#5a8a3a]">the game</p>
          <h2 className="mb-8 mt-2 text-center font-display text-4xl font-semibold md:text-5xl">Hot or cold?</h2>
          <TreasureDigGame clues={clues} finale={finale} />
        </div>
      </section>

      <section className="relative px-5 py-16">
        <h2 className="mb-10 text-center font-hand text-4xl text-[#5b4326]">the party, in pictures</h2>
        <div className="mx-auto max-w-5xl">
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="scrapbook"
            linkClassName="rounded-full bg-[#e2574c] px-6 py-2.5 font-hand text-2xl text-white shadow transition hover:scale-105"
            emptyText="Photos are still being stuck in…"
            emptyClassName="font-hand text-2xl text-[#5b4326]/60"
          />
        </div>
        <p className="mt-12 text-center font-sans text-xs uppercase tracking-[0.3em] text-[#5b4326]/50">{formatMemoryDate(memory.startDate, memory.endDate)}</p>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-8 max-w-4xl"
          linkClassName="flex-1 rounded-2xl bg-white px-5 py-4 font-display text-lg text-[#2f3d1f] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        />
      </section>
    </div>
  );
}
