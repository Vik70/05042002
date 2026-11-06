export interface MonthWindow {
  number: number;
  label: string;
  memories: { slug: string; title: string }[];
}

const addMonths = (iso: string, months: number): string => {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
};

const monthName = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

/** Splits our time together into monthly windows; anything from before day one belongs to month one. */
export const monthWindows = (
  togetherSince: string,
  memories: { slug: string; title: string; startDate: string }[],
  count = 7,
): MonthWindow[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(togetherSince)) return [];
  return Array.from({ length: count }, (_, index) => {
    const start = addMonths(togetherSince, index);
    const end = addMonths(togetherSince, index + 1);
    return {
      number: index + 1,
      label: monthName.format(new Date(`${start}T00:00:00Z`)),
      memories: memories
        .filter(
          (memory) =>
            (index === 0 || memory.startDate >= start) && (memory.startDate < end || (index === count - 1 && memory.startDate === end)),
        )
        .map(({ slug, title }) => ({ slug, title })),
    };
  });
};
