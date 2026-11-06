import { PLAYER_NAMES, STEPS } from "@/lib/together/content";
import { syncLine, type DinnerSummary } from "@/lib/together/logic";
import { SEATS } from "@/lib/together/types";

const chooseStep = STEPS.find((step) => step.kind === "choose");

/** What we said over dinner, shown at the end of the game and on the seven-months page. */
export function Keepsake({ summary, dateLabel }: { summary: DinnerSummary; dateLabel?: string }) {
  const notes = SEATS.filter((seat) => summary.goodBits[seat]);
  const parts = chooseStep?.kind === "choose" ? chooseStep.parts : [];

  return (
    <article className="relative mx-auto w-full max-w-xl rounded-[8px] bg-[#fbf3e6] px-6 py-9 text-[#3a1424] shadow-[0_30px_70px_rgba(0,0,0,0.45)] sm:px-10">
      <span className="paper-texture pointer-events-none absolute inset-0 rounded-[8px]" />
      <div className="relative">
        <p className="text-center font-sans text-[11px] font-semibold uppercase tracking-[0.45em] text-[#b0675a]">
          seven sparks{dateLabel ? ` · ${dateLabel}` : ""}
        </p>
        <h3 className="mt-2 text-center font-display text-4xl font-semibold italic">What we said over dinner</h3>

        {summary.inSync.total ? (
          <div className="mt-7 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-display text-3xl font-semibold italic text-[#c2456b]">
                {summary.inSync.matched}/{summary.inSync.total}
              </p>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] opacity-60">in sync</p>
            </div>
            {SEATS.map((seat) => (
              <div key={seat}>
                <p className="font-display text-3xl font-semibold italic text-[#c2456b]">
                  {summary.readEachOther[seat].right}/{summary.readEachOther[seat].total}
                </p>
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] opacity-60">{PLAYER_NAMES[seat]} knew</p>
              </div>
            ))}
          </div>
        ) : null}
        {summary.inSync.total ? <p className="mt-3 text-center font-hand text-2xl opacity-80">{syncLine(summary.inSync)}</p> : null}

        {notes.length ? (
          <section className="mt-8 space-y-4">
            <p className="text-center font-sans text-[11px] font-semibold uppercase tracking-[0.35em] opacity-55">the good bits</p>
            {notes.map((seat) => (
              <blockquote key={seat} className="border-l-2 border-[#c2456b]/40 pl-4">
                <p className="whitespace-pre-line font-hand text-[1.55rem] leading-[1.25]">{summary.goodBits[seat]}</p>
                <footer className="mt-1 font-sans text-[11px] uppercase tracking-[0.25em] opacity-55">{PLAYER_NAMES[seat]}</footer>
              </blockquote>
            ))}
          </section>
        ) : null}

        {parts.some((part) => SEATS.some((seat) => summary.smoother[seat][part.key])) ? (
          <section className="mt-8 space-y-4">
            {parts.map((part) => (
              <div key={part.key}>
                <p className="text-center font-sans text-[11px] font-semibold uppercase tracking-[0.3em] opacity-55">{part.label.toLowerCase()}</p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-center font-display text-lg italic leading-snug">
                  {SEATS.map((seat) => (
                    <p key={seat}>
                      {summary.smoother[seat][part.key] || "…"}
                      <span className="block font-sans text-[10px] not-italic uppercase tracking-[0.25em] opacity-50">{PLAYER_NAMES[seat]}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {summary.dates.length || summary.wishes.vik.length ? (
          <section className="mt-8 text-center">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.35em] opacity-55">dates we owe each other</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {[...new Set(summary.dates.length ? summary.dates : [...summary.wishes.vik, ...summary.wishes.aanavee])].map((date) => (
                <li key={date} className="rounded-full bg-[#c2456b] px-3.5 py-1.5 font-sans text-sm text-[#fff1e6]">
                  {date}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-9 text-center font-hand text-3xl text-[#c2456b]">Here&apos;s to month eight ♥</p>
      </div>
    </article>
  );
}
