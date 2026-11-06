export const SEATS = ["vik", "aanavee"] as const;

export type Seat = (typeof SEATS)[number];

export type AnswerValue = string | number | boolean | AnswerValue[] | { [key: string]: AnswerValue };

export interface Reaction {
  id: number;
  emoji: string;
}

export interface PlayerDoc {
  round: number;
  at: number;
  deck: number;
  holding: boolean;
  answers: Record<string, AnswerValue>;
  reactions: Reaction[];
  seen: number;
}

export interface SeatsSnapshot {
  seats: Record<Seat, PlayerDoc | null>;
  now: number;
  shared: boolean;
}

export interface ThisOrThat {
  a: string;
  b: string;
}

export interface GuessQuestion {
  prompt: string;
  options: string[];
}

export type Step =
  | { kind: "lobby"; id: "lobby" }
  | { kind: "hold"; id: string; title: string; prompt: string; done: string }
  | { kind: "pick"; id: string; title: string; prompt: string; questions: ThisOrThat[] }
  | { kind: "guess"; id: string; title: string; prompt: string; questions: GuessQuestion[] }
  | { kind: "write"; id: string; title: string; prompt: string; placeholder: string; reveal: string }
  | {
      kind: "choose";
      id: string;
      title: string;
      prompt: string;
      parts: { key: string; label: string; options: string[] }[];
      reveal: string;
    }
  | { kind: "deck"; id: string; title: string; prompt: string; cards: string[]; minimum: number }
  | { kind: "wish"; id: string; title: string; prompt: string; options: string[]; max: number }
  | { kind: "finale"; id: "finale"; title: string; prompt: string };
