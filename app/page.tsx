import { cookies } from "next/headers";
import { EditorDock } from "@/components/editor/EditorDock";
import { HomeCollection } from "@/components/home/HomeCollection";
import { SevenMonthsWelcome, WELCOME_COOKIE } from "@/components/home/SevenMonthsWelcome";
import { daysSince, formatShortDate } from "@/lib/memories/format";
import { monthWindows } from "@/lib/memories/months";
import { loadSiteContent } from "@/lib/memories/store";

export const dynamic = "force-dynamic";

const addMonthsIso = (iso: string, months: number) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + months, day)).toISOString().slice(0, 10);
};

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ home, memories, storage }, params, cookieStore] = await Promise.all([loadSiteContent(), searchParams, cookies()]);
  const showWelcome = params.intro !== undefined || !cookieStore.has(WELCOME_COOKIE);
  const visible = memories.filter((memory) => !memory.hidden);
  const introKey = typeof params.intro === "string" ? params.intro : "first";

  return (
    <>
      <HomeCollection home={home} memories={memories} replayKey={Date.now().toString(36)} />
      <EditorDock target={{ kind: "home", home, memories }} storageMessage={storage.state === "error" ? storage.message : undefined} />
      {showWelcome && /^\d{4}-\d{2}-\d{2}$/.test(home.togetherSince) ? (
        <SevenMonthsWelcome
          key={introKey}
          months={monthWindows(home.togetherSince, visible)}
          days={daysSince(home.togetherSince)}
          range={`${formatShortDate(home.togetherSince)} → ${formatShortDate(addMonthsIso(home.togetherSince, 7))}`}
        />
      ) : null}
    </>
  );
}
