import type { HomeSettings, MemoryData } from "@/lib/memories/types";

export const DEFAULT_HOME: HomeSettings = {
  title: "Us, so far",
  subtitle: "A little museum of our moments. Every room is a different world.",
  togetherSince: "2026-04-06",
  footer: "More rooms coming soon.",
};

export const BUILT_IN_MEMORIES: MemoryData[] = [
  {
    slug: "four-gifts",
    template: "four-gifts",
    title: "The Four Gifts",
    subtitle: "A moonlit shrine for your birthday",
    startDate: "2026-04-05",
    endDate: "",
    location: "Somewhere moonlit",
    story:
      "For your birthday I built you a little world: a moonlit shrine, a warm-hearted spirit cat called Simba, and four gifts that were always yours. Precision, flow, insight and voice.\n\nThe shrine is still here, exactly as you left it. Your progress is saved, and Simba is waiting whenever you want to wander back in.",
    albumUrl: "",
    song: "",
    hidden: false,
    palette: "dusk",
    extras: {},
  },
  {
    slug: "norwich",
    template: "night-drive",
    title: "Norwich, After Dark",
    subtitle: "Our first time in Norwich",
    startDate: "2026-05-11",
    endDate: "",
    location: "Norwich, then the coast",
    story:
      "Our first time in Norwich. Late at night we got in the car and just drove, all the way out to the beach.\n\nWe watched the stars, listened to the waves crash in the dark, and let the music play. Some nights you know you'll keep forever while they're still happening.",
    albumUrl: "",
    song: "",
    hidden: false,
    palette: "ocean",
    extras: {
      starNotes: [
        "The drive out. Just us, the dark road and the playlist.",
        "The waves, crashing somewhere we could hear but barely see.",
        "Stars everywhere, music playing, you right next to me.",
      ],
      finale: "The sky remembers this one too.",
    },
  },
  {
    slug: "treasure-hunt",
    template: "treasure-hunt",
    title: "The Treasure Hunt",
    subtitle: "My birthday, and the hunt you made for me",
    startDate: "2026-05-23",
    endDate: "",
    location: "A sunny garden",
    story:
      "For my birthday you made the whole day feel like a garden party, and then you handed me a treasure hunt you'd made yourself, clue by clue.\n\nThis time it's your turn to dig.",
    albumUrl: "",
    song: "",
    hidden: false,
    palette: "meadow",
    extras: {
      clues: [
        "Start where the party started. Something sweet is waiting.",
        "Look somewhere green, where the flowers keep secrets.",
        "Sit where we sat. The next clue is closer than you think.",
        "Follow the fairy lights to wherever the light ends.",
        "The last one was never hidden. It was you all along.",
      ],
      finale: "You found every single one. Thank you for making my birthday feel like this.",
    },
  },
  {
    slug: "primrose-hill",
    template: "golden-hour",
    title: "Primrose Hill",
    subtitle: "A summer evening above London",
    startDate: "2026-07-04",
    endDate: "",
    location: "Primrose Hill, London",
    story:
      "A July evening at the top of Primrose Hill, with the whole of London laid out below us and the sun taking its time to set.\n\nThe city looked tiny from up there. Everything that mattered was sitting right next to me.",
    albumUrl: "",
    song: "",
    hidden: false,
    palette: "citrus",
    extras: {
      finale: "Same hill, same light, next summer?",
    },
  },
  {
    slug: "malaga-madrid",
    template: "spain",
    title: "Málaga & Madrid",
    subtitle: "Our first trip abroad together",
    startDate: "2026-09-25",
    endDate: "2026-09-30",
    location: "Málaga, then Madrid",
    story:
      "Our first time travelling abroad together. It started with a wedding by the sea and ended with three days in Madrid that were only ours.",
    albumUrl: "",
    song: "",
    hidden: false,
    palette: "rose",
    extras: {
      malagaStory:
        "First, Málaga, for your family friend's wedding. Sunshine, white walls, the Mediterranean, and getting to stand next to you while two people promised each other forever.",
      madridStory:
        "Then it was just us: three days in Madrid. Wandering the streets, staying out late, and finding out how good we are at being somewhere new together.",
      postcard: "Wish you were here. (You were, the whole time.)",
    },
  },
  {
    slug: "six-months",
    template: "six-months",
    title: "Six Months",
    subtitle: "Half a year of us",
    startDate: "2026-10-06",
    endDate: "",
    location: "Wherever you are",
    story:
      "Six months, and somehow it already holds a birthday shrine, a midnight beach, a treasure hunt, a summer hill and a whole other country.\n\nHere's to the half a year we've had, and every month after.",
    albumUrl: "",
    song: "",
    hidden: false,
    palette: "plum",
    extras: {
      letter:
        "Dear Aanavee,\n\nI wanted somewhere to keep all of it: the big days, and the tiny moments in between. This is that place.\n\nEvery month with you has been my favourite one so far. Here's to the next six, and the six after that.",
      signoff: "Always yours",
      finale: "Six months. Every memory, matched.",
    },
  },
];

export const BUILT_IN_SLUGS = new Set(BUILT_IN_MEMORIES.map((memory) => memory.slug));

export const createKeepsakeBase = (slug: string): MemoryData => ({
  slug,
  template: "keepsake",
  title: "A new memory",
  subtitle: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  location: "",
  story: "",
  albumUrl: "",
  song: "",
  hidden: false,
  palette: "rose",
  extras: {
    secret: "",
  },
});
