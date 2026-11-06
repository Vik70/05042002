import type { Seat, Step } from "@/lib/together/types";

export const PLAYER_NAMES: Record<Seat, string> = {
  vik: "Vik",
  aanavee: "Aanavee",
};

export const otherSeat = (seat: Seat): Seat => (seat === "vik" ? "aanavee" : "vik");

export const REACTIONS = ["❤️", "😂", "🥹", "😘", "✨"];

export const STEPS: Step[] = [
  { kind: "lobby", id: "lobby" },
  {
    kind: "hold",
    id: "first-spark",
    title: "Hold on",
    prompt: "Put your thumb on the flame and keep it there. When you're both holding at the same time, the first candle lights.",
    done: "Month one, lit. The first one is always the scariest.",
  },
  {
    kind: "pick",
    id: "in-sync",
    title: "In sync?",
    prompt: "Six quick ones. Don't overthink it. You each pick on your own, then you see them together.",
    questions: [
      { a: "Night drive to the sea", b: "Golden hour on a hill" },
      { a: "Cook dinner together", b: "Takeaway in bed" },
      { a: "Plan every detail", b: "Wing it completely" },
      { a: "Slow dance in the kitchen", b: "Scream-singing in the car" },
      { a: "Málaga sunshine", b: "Madrid nights" },
      { a: "Big night out", b: "Cosy night in" },
    ],
  },
  {
    kind: "guess",
    id: "know-me",
    title: "How well do you know me?",
    prompt: "Answer for yourself first, then guess what your person picked.",
    questions: [
      {
        prompt: "My perfect lazy Sunday starts with…",
        options: ["A lie-in, obviously", "A big breakfast", "A walk somewhere pretty", "You, still in bed"],
      },
      {
        prompt: "After a rough day, what helps me most?",
        options: ["A long hug", "Food. Lots of it", "Being made to laugh", "A bit of quiet, then you"],
      },
      {
        prompt: "The little thing that makes me smile the most…",
        options: ["A random good-morning text", "You remembering small things", "Being teased", "Plans being made for us"],
      },
      {
        prompt: "If I had to pick one love language…",
        options: ["Words", "Touch", "Time together", "Little gifts & gestures"],
      },
    ],
  },
  {
    kind: "write",
    id: "good-bits",
    title: "The good bits",
    prompt: "Write down one tiny moment from these seven months that still makes you smile.",
    placeholder: "That time we…",
    reveal: "Take turns reading them out loud.",
  },
  {
    kind: "choose",
    id: "smoother",
    title: "Smoother every month",
    prompt: "We did it backwards: the bumpy part came first. Look at where we are now.",
    parts: [
      {
        key: "better",
        label: "One thing we've got so much better at",
        options: [
          "Talking things through",
          "Forgiving faster",
          "Laughing at ourselves",
          "Making time for each other",
          "Saying how we feel",
          "Being patient",
        ],
      },
      {
        key: "more",
        label: "One thing I want more of with you",
        options: ["Dates like tonight", "Spontaneous trips", "Slow mornings", "Silly voice notes", "Dancing", "Deep chats at 2am"],
      },
    ],
    reveal: "Look how far the road has come.",
  },
  {
    kind: "deck",
    id: "spark-questions",
    title: "Spark questions",
    prompt: "Take turns. One of you asks, the other answers out loud. Draw at least three.",
    minimum: 3,
    cards: [
      "What did you notice first about me?",
      "When did you realise this was something real?",
      "What's a tiny thing I do that you secretly love?",
      "Describe our seven months in three words.",
      "What's your favourite photo of us, and why?",
      "What's something you want us to do for the first time?",
      "When have you felt really proud of us?",
      "If tonight were a film scene, what song is playing?",
      "What do you think I'm thinking right now?",
      "Do the face I make when I'm hungry.",
      "Hold eye contact for fifteen seconds. First to laugh loses.",
      "Give me a compliment you've never said out loud.",
      "What's one thing about us you'd never change?",
      "Where do you see us at month twelve?",
      "What's the funniest moment we've had so far?",
      "What made you smile today?",
    ],
  },
  {
    kind: "wish",
    id: "whats-next",
    title: "Dessert: what's next",
    prompt: "Pick up to three things you'd love to do together. If you both pick the same one, it's officially a date.",
    max: 3,
    options: [
      "Another trip abroad",
      "The beach at night, again",
      "A cooking class",
      "Primrose Hill, round two",
      "A cosy cabin weekend",
      "Chase the northern lights",
      "A concert together",
      "A spa day",
      "Learn to dance properly",
      "A picnic with far too much food",
      "A sunrise somewhere new",
      "A road trip with no plan",
    ],
  },
  {
    kind: "finale",
    id: "finale",
    title: "Make a wish",
    prompt: "Seven months, seven sparks. Hold the flame together and make a wish. The same one, ideally.",
  },
  {
    kind: "portrait",
    id: "portrait",
    title: "Blind portraits",
    prompt:
      "Paint each other without looking down at the paper. No peeking, no do-overs. When you're done, snap a photo of your masterpiece. Nobody sees either one until you've both hung yours up.",
  },
];

export const SPARK_COUNT = STEPS.filter((step) => step.kind !== "lobby" && step.kind !== "finale" && step.kind !== "portrait").length;
export const LAST_INDEX = STEPS.length - 1;

/** Bump this to send both phones and the saved game back to the lobby; older rounds are treated as never played. */
export const FIRST_ROUND = 100;
