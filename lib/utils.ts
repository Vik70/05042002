export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, amount: number): number =>
  start + (end - start) * amount;

export const randomRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const randomInt = (min: number, max: number): number =>
  Math.floor(randomRange(min, max + 1));

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const formatScore = (value: number): string =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

export const formatPercent = (value: number): string =>
  `${Math.round(value)}%`;

export const pickRandom = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

export const shuffleArray = <T>(items: T[]): T[] => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
};
