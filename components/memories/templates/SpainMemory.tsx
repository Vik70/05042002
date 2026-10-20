import { AzulejoPuzzle } from "@/components/memories/games/AzulejoPuzzle";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { BackHome, MemoryPager, Story, type MemoryTemplateProps } from "@/components/memories/shared";
import { asText, formatMemoryDate, formatShortDate } from "@/lib/memories/format";

function BoardingPass({ title, subtitle, dates, startDate, endDate }: { title: string; subtitle: string; dates: string; startDate: string; endDate: string }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[22px] bg-[#fffaf1] text-[#3a1d10] shadow-[0_30px_70px_rgba(58,29,16,0.25)] md:grid md:grid-cols-[1fr_200px]">
      <div className="p-6 md:p-9">
        <div className="flex items-center justify-between font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1f4e9c]">
          <span>Boarding pass</span>
          <span>Flight US 001</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-3 font-fiesta">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#3a1d10]/50">From</p>
            <p className="text-2xl font-bold sm:text-4xl md:text-5xl">HOME</p>
          </div>
          <span className="mb-3 text-2xl text-[#d9774f]">✈</span>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#3a1d10]/50">Málaga</p>
            <p className="text-2xl font-bold sm:text-4xl md:text-5xl">AGP</p>
          </div>
          <span className="mb-3 text-2xl text-[#d9774f]">→</span>
          <div className="text-right">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#3a1d10]/50">Madrid</p>
            <p className="text-2xl font-bold sm:text-4xl md:text-5xl">MAD</p>
          </div>
        </div>
        <h1 className="mt-8 font-fiesta text-5xl italic leading-[0.95] md:text-7xl">{title}</h1>
        {subtitle ? <p className="mt-3 font-sans text-base text-[#3a1d10]/70">{subtitle}</p> : null}
        <dl className="mt-7 grid grid-cols-3 gap-4 font-sans text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.25em] text-[#3a1d10]/50">Dates</dt>
            <dd className="mt-1 font-semibold">{dates}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.25em] text-[#3a1d10]/50">Passengers</dt>
            <dd className="mt-1 font-semibold">2</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.25em] text-[#3a1d10]/50">Seats</dt>
            <dd className="mt-1 font-semibold">Together</dd>
          </div>
        </dl>
      </div>
      <div className="relative flex flex-row items-center justify-between gap-4 border-t-2 border-dashed border-[#3a1d10]/20 bg-[#1f4e9c] p-6 text-[#fbf7ee] md:flex-col md:items-start md:border-l-2 md:border-t-0">
        <span className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-[#f7efe1] md:block" />
        <span className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-[#f7efe1] md:block" />
        <div className="font-sans">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Depart</p>
          <p className="font-fiesta text-3xl">{formatShortDate(startDate)}</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-white/60">Return</p>
          <p className="font-fiesta text-3xl">{formatShortDate(endDate || startDate)}</p>
        </div>
        <div className="flex h-14 w-40 items-stretch gap-[2px] md:w-full" aria-hidden="true">
          {Array.from({ length: 34 }, (_, index) => (
            <span key={index} className="bg-white/85" style={{ width: [1, 3, 1, 2, 4, 1][index % 6] }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SpainMemory({ memory, photos, previous, next }: MemoryTemplateProps) {
  const dates = formatMemoryDate(memory.startDate, memory.endDate);
  const malaga = asText(memory.extras.malagaStory);
  const madrid = asText(memory.extras.madridStory);
  const postcard = asText(memory.extras.postcard, "Wish you were here.");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7efe1] text-[#3a1d10]">
      <section className="relative px-5 pb-20 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ffd678] opacity-60 blur-3xl" />
        <BackHome className="relative font-fiesta text-lg italic text-[#3a1d10]/70 transition hover:text-[#1f4e9c]" />
        <div className="relative mt-10 md:mt-16">
          <BoardingPass title={memory.title} subtitle={memory.subtitle} dates={dates} startDate={memory.startDate} endDate={memory.endDate} />
        </div>
        <div className="relative mx-auto mt-14 max-w-2xl space-y-5 text-center font-fiesta text-2xl italic leading-relaxed text-[#3a1d10]/85 md:text-3xl">
          <Story text={memory.story} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-5 py-20 md:py-28">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full" aria-hidden="true">
          <path d="M0 30 Q 75 0 150 30 T 300 30 T 450 30 T 600 30 T 750 30 T 900 30 T 1050 30 T 1200 30 L 1200 60 L 0 60 Z" fill="#cfe6f2" />
        </svg>
        <div className="pointer-events-none absolute -left-10 top-10 flex flex-col gap-2 opacity-80" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="block h-6 w-6 rounded-full bg-[#d94f8a]" style={{ marginLeft: `${(index % 3) * 18}px`, opacity: 0.4 + (index % 3) * 0.2 }} />
          ))}
        </div>
        <div className="relative mx-auto max-w-2xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.4em] text-[#d94f8a]">Capítulo uno</p>
          <h2 className="mt-3 font-fiesta text-6xl text-[#1f4e9c] md:text-7xl">Málaga</h2>
          <p className="mt-2 font-sans text-sm uppercase tracking-[0.3em] text-[#1f4e9c]/60">a wedding by the sea</p>
          <div className="mt-8 space-y-5 font-sans text-lg leading-8 text-[#3a1d10]/85">
            <Story text={malaga} />
          </div>
        </div>
      </section>

      <section className="relative bg-[#eaf3f8] px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-sans text-xs font-semibold uppercase tracking-[0.4em] text-[#1f4e9c]/70">the game</p>
          <h2 className="mb-10 mt-3 text-center font-fiesta text-5xl italic text-[#1f4e9c]">Mend the azulejo</h2>
          <AzulejoPuzzle postcard={postcard} dateLabel={dates} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#b8432f] px-5 py-20 text-[#fbeedd] md:py-28">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-30" aria-hidden="true">
          <path
            d="M0 120 L0 70 L80 70 L80 40 L120 40 L120 70 L200 70 L200 30 Q 240 0 280 30 L280 70 L360 70 L360 50 L420 50 L420 20 L440 0 L460 20 L460 50 L520 50 L520 70 L620 70 L620 40 Q 650 20 680 40 L680 70 L760 70 L760 30 L820 30 L820 70 L900 70 L900 45 L960 45 L960 70 L1040 70 L1040 35 Q 1080 10 1120 35 L1120 70 L1200 70 L1200 120 Z"
            fill="#4a140c"
          />
        </svg>
        <div className="relative mx-auto max-w-2xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.4em] text-[#e9b44c]">Capítulo dos</p>
          <h2 className="mt-3 font-fiesta text-6xl md:text-7xl">Madrid</h2>
          <p className="mt-2 font-sans text-sm uppercase tracking-[0.3em] text-[#e9b44c]/80">three days, just us</p>
          <div className="mt-8 space-y-5 font-sans text-lg leading-8 text-[#fbeedd]/90">
            <Story text={madrid} />
          </div>
          {memory.song ? <p className="mt-10 font-fiesta text-xl italic text-[#e9b44c]">♪ {memory.song}</p> : null}
        </div>
      </section>

      <section className="relative px-5 py-20">
        <h2 className="mb-10 text-center font-fiesta text-5xl italic text-[#1f4e9c]">Postales</h2>
        <div className="mx-auto max-w-5xl">
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="postcard"
            linkClassName="rounded-full bg-[#1f4e9c] px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#173d7a]"
            emptyText="The postcards are still in the post."
            emptyClassName="font-fiesta text-2xl italic text-[#3a1d10]/60"
          />
        </div>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-16 max-w-4xl"
          linkClassName="flex-1 rounded-[14px] border border-[#3a1d10]/15 bg-[#fffaf1] px-5 py-4 font-fiesta text-xl text-[#3a1d10] transition hover:border-[#1f4e9c]/50"
        />
      </section>
    </div>
  );
}
