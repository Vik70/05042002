import { ScratchCard } from "@/components/memories/games/ScratchCard";
import { PhotoGallery } from "@/components/memories/PhotoGallery";
import { BackHome, MemoryPager, Story, type MemoryTemplateProps } from "@/components/memories/shared";
import { asText, formatMemoryDate } from "@/lib/memories/format";
import { PALETTES } from "@/lib/memories/templates";

export function KeepsakeMemory({ memory, photos, previous, next }: MemoryTemplateProps) {
  const palette = PALETTES[memory.palette];
  const secret = asText(memory.extras.secret);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: palette.background, color: palette.ink }}>
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: palette.accent }} />
      <div className="pointer-events-none absolute -left-40 top-[60vh] h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl" style={{ background: palette.surface }} />

      <section className="relative px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <BackHome className="font-hand text-2xl opacity-75 transition hover:opacity-100" />
        <div className="mx-auto max-w-3xl pb-14 pt-16 text-center md:pt-24">
          <p className="inline-flex rounded-full px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.3em]" style={{ background: palette.surface, color: palette.accent }}>
            {formatMemoryDate(memory.startDate, memory.endDate)}
          </p>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1] tracking-tight md:text-7xl">{memory.title}</h1>
          {memory.subtitle ? <p className="mt-4 font-hand text-3xl opacity-80">{memory.subtitle}</p> : null}
          {memory.location ? <p className="mt-3 font-sans text-xs uppercase tracking-[0.35em] opacity-60">{memory.location}</p> : null}
        </div>
      </section>

      {memory.story ? (
        <section className="relative mx-auto max-w-2xl px-5 pb-16">
          <div className="rounded-[28px] px-7 py-9 shadow-[0_20px_50px_rgba(0,0,0,0.12)] md:px-12" style={{ background: palette.surface }}>
            <div className="space-y-5 font-display text-lg leading-8 md:text-xl md:leading-9">
              <Story text={memory.story} />
            </div>
            {memory.song ? (
              <p className="mt-6 font-sans text-xs uppercase tracking-[0.35em]" style={{ color: palette.accent }}>
                ♪ {memory.song}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="relative px-5 pb-20">
        <p className="mb-6 text-center font-sans text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: palette.accent }}>
          the game · scratch to reveal
        </p>
        <ScratchCard secret={secret} accent={palette.accent} surface={palette.surface} ink={palette.ink} />
      </section>

      <section className="relative px-5 pb-20">
        <div className="mx-auto max-w-5xl">
          <PhotoGallery
            photos={photos}
            albumUrl={memory.albumUrl}
            variant="keepsake"
            linkClassName="rounded-full border border-current px-6 py-2.5 font-sans text-sm font-semibold transition hover:bg-white/20"
            emptyText="Add a Google Photos album in edit mode to fill this space."
            emptyClassName="font-hand text-2xl opacity-60"
          />
        </div>
        <MemoryPager
          previous={previous}
          next={next}
          className="mx-auto mt-16 max-w-4xl"
          linkClassName="flex-1 rounded-[18px] bg-white/25 px-5 py-4 font-display text-lg backdrop-blur transition hover:bg-white/40"
        />
      </section>
    </div>
  );
}
