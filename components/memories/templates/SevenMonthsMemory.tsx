import Link from "next/link";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { SealedLetter } from "@/components/memories/SealedLetter";
import { BackHome, MemoryPager, Story, memoryHref, type CollectionEntry, type MemoryTemplateProps } from "@/components/memories/shared";
import { Candle, CandleRow } from "@/components/together/Candles";
import { Keepsake } from "@/components/together/Keepsake";
import { SmoothRoad } from "@/components/together/SmoothRoad";
import { asText, formatMemoryDate, formatShortDate } from "@/lib/memories/format";
import { monthWindows } from "@/lib/memories/months";
import { loadSiteContent } from "@/lib/memories/store";
import { summarise } from "@/lib/together/logic";
import { loadSeats } from "@/lib/together/store";

async function MonthTimeline({ collection }: { collection: CollectionEntry[] }) {
  const { home } = await loadSiteContent();
  const months = monthWindows(home.togetherSince, collection);
  if (!months.length) return null;

  return (
    <ol className="mx-auto max-w-xl space-y-2">
      {months.map((month) => (
        <li key={month.number} className="flex items-center gap-5 rounded-[20px] px-3 py-3 transition hover:bg-[#fff1e6]/[0.03]">
          <Candle lit size="sm" height={0.7 + month.number * 0.04} />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-[#ffcf8a]/70">
              month {month.number} · {month.label}
            </p>
            {month.memories.length ? (
              <p className="mt-0.5 font-display text-2xl italic leading-tight">
                {month.memories.map((memory, index) => (
                  <span key={memory.slug}>
                    {index > 0 ? <span className="text-[#fff1e6]/40"> &amp; </span> : null}
                    <Link href={memoryHref(memory.slug)} className="transition hover:text-[#ffcf8a]">
                      {memory.title}
                    </Link>
                  </span>
                ))}
              </p>
            ) : (
              <p className="mt-0.5 font-display text-2xl italic leading-tight text-[#fff1e6]/55">The in-between days</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

async function DinnerKeepsake({ date }: { date: string }) {
  try {
    const { seats } = await loadSeats();
    const summary = summarise(seats);
    if (!summary.started || (!summary.finished && !summary.inSync.total)) return null;
    return (
      <section className="relative z-10 px-5 pt-20">
        <Keepsake summary={summary} dateLabel={formatShortDate(date)} />
      </section>
    );
  } catch {
    return null;
  }
}

export function SevenMonthsMemory({ memory, photos, previous, next, collection }: MemoryTemplateProps) {
  const letter = asText(memory.extras.letter);
  const signoff = asText(memory.extras.signoff, "Always yours");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(120%_60%_at_50%_0%,#4a1a34_0%,#2a0f22_40%,#170a14_100%)] text-[#fff1e6]">
      <section className="relative z-10 flex min-h-[100svh] flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <BackHome className="font-hand text-2xl text-[#fff1e6]/70 transition hover:text-[#ffcf8a]" />
        <div className="relative mx-auto flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[64vmin] w-[64vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,180,107,0.22),transparent_65%)]" />
          <p className="relative font-sans text-xs uppercase tracking-[0.5em] text-[#ffcf8a]/80">{formatShortDate(memory.startDate)}</p>
          <p className="relative bg-[linear-gradient(180deg,#fff6e0,#ffcf8a_55%,#ff9fb5)] bg-clip-text font-display text-[11rem] font-semibold italic leading-none text-transparent drop-shadow-[0_10px_40px_rgba(255,190,110,0.35)] md:text-[16rem]">
            7
          </p>
          <CandleRow lit={7} size="sm" stagger={140} className="relative -mt-2" />
          <h1 className="relative mt-6 font-hand text-5xl md:text-6xl">{memory.title}</h1>
          {memory.subtitle ? <p className="relative mt-3 font-display text-lg italic text-[#fff1e6]/70">{memory.subtitle}</p> : null}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-12">
        <div className="space-y-5 text-center font-display text-xl italic leading-9 text-[#fff1e6]/85 md:text-2xl md:leading-10">
          <Story text={memory.story} />
        </div>
        {memory.song ? <p className="mt-8 text-center font-sans text-xs uppercase tracking-[0.4em] text-[#ffcf8a]/80">♪ {memory.song}</p> : null}
      </section>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-20 text-center">
        <SmoothRoad duration={5200} className="mx-auto h-40 w-full max-w-lg" />
        <p className="mt-4 font-hand text-3xl text-[#ffcf8a]">smoother every month</p>
      </section>

      <section className="relative z-10 px-5 pb-24">
        <p className="mb-6 text-center font-sans text-xs uppercase tracking-[0.5em] text-[#ffcf8a]/70">one candle a month</p>
        <MonthTimeline collection={collection.filter((entry) => entry.slug !== memory.slug)} />
      </section>

      <section className="relative z-10 border-y border-[#ffcf8a]/15 bg-[#2a0f22]/60 px-5 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.5em] text-[#ffcf8a]/70">the game</p>
          <h2 className="mt-3 font-display text-5xl italic">Seven Sparks</h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-[15px] leading-relaxed text-[#fff1e6]/70">
            A game for two phones and one dinner table. Seven little rounds, one for every month. You answer in secret, see each other&apos;s answers at the same moment, and light a candle every time you finish one together.
          </p>
          <Link
            href="/together"
            className="mt-8 inline-block rounded-full bg-[linear-gradient(180deg,#ffdca0,#ffb46b)] px-8 py-4 font-display text-xl font-semibold italic text-[#3a1424] shadow-[0_12px_30px_rgba(255,170,90,0.3)] transition hover:-translate-y-0.5"
          >
            Sit down and play
          </Link>
          <p className="mt-4 font-sans text-xs text-[#fff1e6]/45">Open it on both phones, and each pick your own name.</p>
        </div>
      </section>

      <DinnerKeepsake date={memory.startDate} />

      <section className="relative z-10 px-5 py-20">
        <SealedLetter letter={letter} signoff={signoff} seal="7" />
      </section>

      <section className="relative z-10 px-5 pb-20">
        <h2 className="mb-10 text-center font-hand text-4xl text-[#ffcf8a]">seven months, in pictures</h2>
        <div className="mx-auto max-w-5xl">
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="letter"
            linkClassName="rounded-full border border-[#ffcf8a]/50 px-6 py-2.5 font-display text-lg italic text-[#ffcf8a] transition hover:bg-[#ffcf8a] hover:text-[#2a0f22]"
            emptyText="The pictures are tucked away for now."
            emptyClassName="font-display text-xl italic text-[#fff1e6]/50"
          />
        </div>
        <p className="mt-14 text-center font-sans text-xs uppercase tracking-[0.4em] text-[#fff1e6]/40">{formatMemoryDate(memory.startDate, memory.endDate)}</p>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-8 max-w-4xl"
          linkClassName="flex-1 rounded-[14px] border border-[#ffcf8a]/25 px-5 py-4 font-display text-xl italic text-[#fff1e6] transition hover:border-[#ffcf8a]/70"
        />
      </section>
    </div>
  );
}
