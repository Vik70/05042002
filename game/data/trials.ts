import type { TrialDefinition } from "@/game/types/game";
import { COLORS } from "@/lib/constants";

export const TRIAL_DEFINITIONS: Record<TrialDefinition["id"], TrialDefinition> = {
  marksman: {
    id: "marksman",
    giftNumber: 1,
    giftName: "Precision",
    title: "Gift of Precision",
    subtitle: "Wake the distant lanterns with still hands and a quiet breath.",
    quality: "Precision",
    giftMeaning: "Stillness, focus, and deliberate action",
    simbaValueTheme: "I admire how calm and dependable you are when things matter.",
    awakeningSummary: "You wake distant lights through perfect stillness.",
    description:
      "Simba leads Aanavee to a court of sleeping lights, where calm timing reveals the steadiness that was already hers.",
    accentColor: COLORS.lanternGold,
    ambientColor: COLORS.lanternRed,
    statLabel: "Accuracy",
    controlsHint: "Move the mouse, hold click to focus, then release to fire.",
    controlsHintTouch: "Drag to aim, hold to focus, lift to fire.",
    instructions: [
      "Place the reticle over a sleeping lantern seal before you fire.",
      "Hold long enough for the focus ring to settle into stillness.",
      "Release only when the shot feels calm, deliberate, and true.",
    ],
    demoObjective: "Land 2 practice hits before the real lantern court begins.",
    objectiveTitle: "Wake the distant lights",
    objectiveText: "Hold to focus, then release when the reticle becomes still.",
    tutorialTitle: "First gift",
    tutorialText: "Do not rush the light. Let it answer your calm.",
  },
  rally: {
    id: "rally",
    giftNumber: 2,
    giftName: "Flow",
    title: "Gift of Flow",
    subtitle: "Meet each moon charm at the ring and keep the rhythm moving.",
    quality: "Flow",
    giftMeaning: "Rhythm, grace, and elegant momentum",
    simbaValueTheme: "The way you move through moments, light and sure.",
    awakeningSummary: "Moon charms answer your rhythm, and the shrine begins to dance.",
    description:
      "Moon charms sweep in from the dark toward a glowing ring, asking for light taps and held returns that reveal Aanavee's effortless momentum.",
    accentColor: COLORS.spiritBlue,
    ambientColor: COLORS.spiritPurple,
    statLabel: "Flow Chain",
    controlsHint:
      "Click or press Space when a moon charm reaches the ring. Hold through elongated charms.",
    controlsHintTouch:
      "Tap when a moon charm reaches the ring. Touch and hold through elongated charms.",
    instructions: [
      "Tap when a moon charm reaches the glowing ring.",
      "Hold when an elongated charm crosses the ring and release when it passes through.",
      "Build a chain by staying smooth and rhythmic instead of rushing.",
    ],
    demoObjective: "Clear one practice wave of moon charms before the live flow begins.",
    objectiveTitle: "Keep the moon charms in motion",
    objectiveText: "Tap or hold at the ring and let the rhythm carry you forward.",
    tutorialTitle: "Second gift",
    tutorialText: "You do not have to force it. Meet the rhythm where it arrives.",
  },
  apothecary: {
    id: "apothecary",
    giftNumber: 3,
    giftName: "Insight",
    title: "Gift of Insight",
    subtitle: "Restore the lost remedies by following the memory they still carry.",
    quality: "Insight",
    giftMeaning: "Understanding, memory, and quiet knowing",
    simbaValueTheme: "You always know how to make the right pieces belong together.",
    awakeningSummary: "Lost remedies glow awake under your steady hands.",
    description:
      "At the memory bench, remedy fragments return to life whenever Aanavee trusts the quiet knowing she already has.",
    accentColor: COLORS.sakura,
    ambientColor: COLORS.lanternGold,
    statLabel: "Restored Remedies",
    controlsHint: "Read the memory fragment, click ingredients in order, then restore the remedy.",
    controlsHintTouch: "Read the fragment, tap ingredients in order, then tap Restore.",
    instructions: [
      "Read the memory fragment before touching the ingredients.",
      "Restore each ingredient in the exact order shown.",
      "Confirm the bowl only when the full remembered sequence feels right.",
    ],
    demoObjective: "Restore 1 practice remedy before the live memories begin.",
    objectiveTitle: "Restore each lost remedy",
    objectiveText: "Select the ingredients in the remembered order before the glow fades.",
    tutorialTitle: "Third gift",
    tutorialText: "Read first. Then trust the knowing that rises after.",
  },
  voice: {
    id: "voice",
    giftNumber: 4,
    giftName: "Voice",
    title: "Gift of Voice",
    subtitle: "Answer the shrine in phrases of light and let the last chamber resonate.",
    quality: "Voice",
    giftMeaning: "Expression, warmth, and the courage to be heard",
    simbaValueTheme: "When you speak or sing, every room gets warmer.",
    awakeningSummary: "Your voice wakes the last sleeping light in the shrine.",
    description:
      "In the inner circle, luminous notes arrive in ceremonial phrases, revealing the warmth and presence that make every space feel alive when Aanavee is there.",
    accentColor: COLORS.paperCream,
    ambientColor: COLORS.spiritPurple,
    statLabel: "Longest Phrase",
    controlsHint:
      "Click or press Space when a note reaches the center ring. Hold through sustained notes.",
    controlsHintTouch:
      "Tap when a note reaches the center ring. Touch and hold through sustained notes.",
    instructions: [
      "Answer each note as it reaches the center ring.",
      "Hold sustained notes all the way through their glowing path.",
      "Follow the phrase instead of rushing individual notes.",
    ],
    demoObjective: "Complete one short practice phrase before the live resonance begins.",
    objectiveTitle: "Let the inner shrine resonate",
    objectiveText: "Answer each phrase cleanly and let the final chamber bloom with light.",
    tutorialTitle: "Fourth gift",
    tutorialText: "This one is not about speed. Let each phrase open before you answer it.",
  },
};

export const getTrialControlsHint = (trial: TrialDefinition, isTouch: boolean): string =>
  isTouch ? trial.controlsHintTouch : trial.controlsHint;
