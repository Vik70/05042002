import type { DialogueLine, TrialId } from "@/game/types/game";

export interface GiftRevealCopy {
  giftSummary: string;
  giftMeaning: string;
  simbaValueTheme: string;
  awakeningSummary: string;
  simbaLine: string;
  awakeningText: string;
  simbaReflection: DialogueLine[];
  ctaLabel: string;
}

export const OPENING_DIALOGUE: DialogueLine[] = [
  {
    speaker: "Simba",
    text: "There you are lil beautiful birthday girl :D. Happy birthday <3. ",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "oh yeah...<3 ... that is literally less than 3. I was just being a nerd earlier but... <3",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Anyways, let's get to it. I've been padding circles around this shrine waiting for you to show up.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "It was quiet before, but it likes you already. You can feel that, can't you?",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Come on, lil superstar. Stay close to me and I'll show you where the first gift is waking.",
    portrait: "simba",
  },
];

export const FOLLOW_SIMBA_DIALOGUE: DialogueLine[] = [
  {
    speaker: "Simba",
    text: "That's it. Just like that :D.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "The lantern court wants your steady hands first. At least you should have steady hands cause your a sniper girl. Let's go wake the distant lights.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "you're**, whoops...",
    portrait: "simba",
  },
];

export const HUB_COPY = [
  {
    subtitle: "The shrine is listening for its first waking light and leaning toward Aanavee already.",
    currentObjective: "Follow Simba to the Gift of Precision.",
    simbaPrompt: "The lantern court is waking first. Come on.",
    awakeningText: "Only a faint shimmer moves through the courtyard, waiting for the first gift.",
  },
  {
    subtitle: "The first lights are awake now, and a ribbon of spirit traces the next path through the shrine.",
    currentObjective: "Follow Simba to the Gift of Flow.",
    simbaPrompt: "See? I knew you'd get that, smartie pants. Now the moon charms want their turn.",
    awakeningText: "The lantern court glows warmer, and the air begins moving in soft blue arcs.",
  },
  {
    subtitle: "Petals drift farther now, and the old benches deeper in the shrine begin remembering what they held.",
    currentObjective: "Follow Simba to the Gift of Insight.",
    simbaPrompt: "That soft glow by the memory bench? That's your next stop.",
    awakeningText: "The shrine begins remembering itself, and scattered remedies start to glimmer back into place.",
  },
  {
    subtitle: "Almost everything is awake now. One last chamber waits for Aanavee's own warmth to reach it.",
    currentObjective: "Follow Simba to the Gift of Voice.",
    simbaPrompt: "One last path. The inner chamber wants your voice in it.",
    awakeningText: "The last gate hums softly, waiting for a warmer, fuller light to answer it.",
  },
  {
    subtitle: "Every gift is awake now, and the whole shrine is ready to tell Aanavee what it recognized all along.",
    currentObjective: "Approach the inner shrine and let Simba finish the story.",
    simbaPrompt: "There you are. Look what you woke up.",
    awakeningText: "The whole shrine breathes with warm light, drifting petals, and a steady golden hum.",
  },
] as const;

export const HUB_AMBIENT_LINES: string[][] = [
  [
    "A sleepy lantern flickers when Aanavee gets close.",
    "Simba's tail sways like he already knows the way.",
    "The courtyard feels a little less lonely now.",
  ],
  [
    "That first glow is still hanging in the air.",
    "You're as pretty as these petals I made. Hope you like them... though you're prettier.",
    "One little gift awake, and the whole shrine starts showing off.",
  ],
  [
    "The spirit of the shrine drifts through the trees like it wants a better view.",
    "The memory bench glints as if it just remembered Aanavee's name.",
    "The shrine is getting clingy, in the sweetest possible way.",
  ],
  [
    "A low hum gathers near the inner chamber, like it is waiting for one more note.",
    "The lanterns pulse together now instead of one by one.",
    "Simba keeps glancing toward the last gate with very pleased-cat energy.",
  ],
  [
    "Everything is lit now, like the shrine finally exhaled.",
    "Even the quiet corners are glowing for Aanavee.",
    "Simba looks very pleased with himself. Fair enough.",
  ],
] as const;

export const GIFT_REVEALS: Record<TrialId, GiftRevealCopy> = {
  marksman: {
    giftSummary:
      "Precision rose from the quiet way Aanavee steadies herself before a moment matters.",
    giftMeaning: "Stillness, focus, and deliberate action",
    simbaValueTheme: "I admire how calm and dependable you are when things matter.",
    awakeningSummary: "You wake distant lights through perfect stillness.",
    simbaLine: "Steady hands. Very Sniper Secret Service Agent Aanavee of you to be honest...",
    awakeningText: "The lantern court brightens, and the first sleeping lights answer back.",
    simbaReflection: [
      {
        speaker: "Simba",
        text: "There you are. You didn't chase the light. You let it meet you.",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "That's Precision: stillness, focus, and doing the exact thing the moment needs. Who taught you that fr?",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "I really adore that about you. When things matter, you become so calm and dependable. I feel that, and it means a lot to me x",
        portrait: "simba",
      },
    ],
    ctaLabel: "Let's go see what woke up.",
  },
  rally: {
    giftSummary:
      "Flow appeared in the way Aanavee met each moving charm without forcing it.",
    giftMeaning: "Rhythm, grace, and elegant momentum",
    simbaValueTheme: "The way you move through moments, light and sure.",
    awakeningSummary: "Moon charms answer your rhythm, and the shrine begins to dance.",
    simbaLine: "That one was lovely.",
    awakeningText: "The spirits of the shrine swirls faster, petals lift into the air, and the path ahead glows blue-white.",
    simbaReflection: [
      {
        speaker: "Simba",
        text: "That one was lovely. You didn't fight the motion. You moved with it. ",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "That's Flow: rhythm, grace, and that easy momentum you carry into everything.",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "It's one of my favorite things about you, honestly. You make movement feel gentle instead of rushed.",
        portrait: "simba",
      },
    ],
    ctaLabel: "Come on, superstar.",
  },
  apothecary: {
    giftSummary:
      "Insight woke in the way Aanavee understood what belonged together before the bench even finished asking.",
    giftMeaning: "Understanding, memory, and quiet knowing",
    simbaValueTheme: "You always know how to make the right pieces belong together.",
    awakeningSummary: "Lost remedies glow awake under your steady hands.",
    simbaLine: "Of course you did. You always see it.",
    awakeningText: "The memory bench glows, old paper sigils wake, and the inner shrine doorway begins to open.",
    simbaReflection: [
      {
        speaker: "Simba",
        text: "Of course you did. You always see how the pieces fit, even when they arrive scattered.",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "That's Insight: memory, understanding, and that quiet knowing you trust more than you realise.",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "You restore things, Aanavee. You make confusion feel solvable, and that is such a beautiful gift. I really have a lot to learn from you frfr",
        portrait: "simba",
      },
    ],
    ctaLabel: "Let's hear the rest.",
  },
  voice: {
    giftSummary:
      "Voice rose from the warmth Aanavee brings when she lets herself be fully heard.",
    giftMeaning: "Expression, warmth, and the courage to be heard",
    simbaValueTheme: "When you speak or sing, every room gets warmer.",
    awakeningSummary: "Your voice wakes the last sleeping light in the shrine.",
    simbaLine: "There you are. That's your light.",
    awakeningText: "The whole shrine answers in a bloom of light, and the last chamber begins to sing back.",
    simbaReflection: [
      {
        speaker: "Simba",
        text: "There you are. That's your light, and the whole shrine knew it the second you let it ring.",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "That's Voice: expression, warmth, and the courage to be fully heard. You know, since you showed me you singing in the uber back, I wanna make music with you one day x",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "You bring life to a place just by being present in it. That's not small. That's magic.",
        portrait: "simba",
      },
      {
        speaker: "Simba",
        text: "And when you sing? Oh, superstar. Everything leans closer. Like the way I was leaning closer in the uber back lol x",
        portrait: "simba",
      },
    ],
    ctaLabel: "Let's go home xx. ",
  },
};

export const ENDING_DIALOGUE: DialogueLine[] = [
  {
    speaker: "Simba",
    text: "There you are again. hey :)",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Look at this place now. Brighter, warmer, a little dramatic. Very good work. good job. Excellent.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "I never meant to give you anything new, Aanavee. I only wanted to show you what the shrine saw the moment you arrived.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Precision is the way you center yourself when a moment matters.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Flow is the way you move through moments with grace and momentum. I know this from when we played against each other in a county badminton tournament. You were a force to be reckoned with lol.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Insight is the way you understand what belongs together and quietly restore it. Your line of work really is challenging, but real recognises real, so i know you're killing it :)",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "Voice is the warmth and life you bring to a place when you let yourself be fully heard.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "These were never lessons. They were reflections of who you already are. You say you haven't even shown me your full self, but I feel like i've known this about you since the day we spoke",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "You were never just visiting this shrine, love.",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "You were the reason it woke up. You woke me up :) (because those stupid alarms never work)",
    portrait: "simba",
  },
  {
    speaker: "Simba",
    text: "You were my legendary champion bean girl all along.",
    portrait: "simba",
  },
];

export const CREDITS_MESSAGE =
  "For Aanavee, whose precision, flow, insight, and voice make every place warmer. This little shrine was only ever meant to reflect the gifts that were already hers. I love learning about you, and these are only just a HANDFUL of traits that resonated with me. I'm really lucky to have been able to get you know you so RIDICULOUSLY well in the last couple weeks we've known eachother. I hope that never ends, so that next birthday I can make a way better game :)";
