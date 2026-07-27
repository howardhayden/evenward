import type {
  AvatarConfig,
  BoardTheme,
  ChoiceId,
  Flow,
  SceneName,
  SavedChess,
  ThemeName,
  ViewId,
} from "./types";
export { movementPractices } from "./movement-catalog";

export const scenesByTheme: Record<ThemeName, SceneName[]> = {
  forest: ["leaves", "rain"],
  sea: ["waves", "rain", "sky"],
  sunrise: ["rain", "waves", "sky", "leaves"],
};

export const sceneLabels: Record<SceneName, string> = {
  leaves: "Swaying leaves",
  rain: "Soft rain",
  waves: "Rippling waves",
  sky: "Clouds & stars",
};

export const flows: Array<Flow & { id: ChoiceId }> = [
  {
    id: "settle",
    prompt: "Slow things down",
    mode: "Settle",
    title: "Settle softly",
    duration: "8 min",
    description: "Reduce demand without forcing quiet.",
    icon: "≈",
    steps: [
      { id: "settle-orient", label: "Orient to the room", duration: "90 sec", kind: "sensory" },
      { id: "settle-exhale", label: "Let the exhale finish", duration: "3 min", kind: "breath" },
      { id: "settle-pattern", label: "Count a simple pattern", duration: "3 min", kind: "pattern" },
    ],
  },
  {
    id: "alert",
    prompt: "Invite some energy",
    mode: "Settle + Move",
    title: "Wake gently",
    duration: "8 min",
    description: "Invite energy through light, range, and attention.",
    icon: "↟",
    steps: [
      { id: "alert-light", label: "Find three light sources", duration: "60 sec", kind: "sensory" },
      {
        id: "alert-rise",
        label: "Rise and sink",
        duration: "4 min",
        kind: "movement",
        movement: "riseSink",
        preferredView: "side",
      },
      { id: "alert-board", label: "Scan the calm board", duration: "3 min", kind: "focus" },
    ],
  },
  {
    id: "focus",
    prompt: "Gather attention",
    mode: "Focus",
    title: "Stay with the position",
    duration: "10 min",
    description: "Hold one bounded position at a time, without a clock.",
    icon: "◎",
    steps: [
      { id: "focus-surface", label: "Orient to one surface", duration: "60 sec", kind: "sensory" },
      { id: "focus-position", label: "Play the current position", duration: "6 min", kind: "focus" },
      { id: "focus-pattern", label: "Name one pattern", duration: "3 min", kind: "pattern" },
    ],
  },
  {
    id: "move",
    prompt: "Ease through tension",
    mode: "Move",
    title: "Move through tension",
    duration: "12 min",
    description: "Use structured movement before asking for stillness.",
    icon: "⌁",
    steps: [
      { id: "move-support", label: "Feel your points of support", duration: "90 sec", kind: "sensory" },
      {
        id: "move-circles",
        label: "Joint circles",
        duration: "4 min",
        kind: "movement",
        movement: "jointCircles",
        preferredView: "front",
      },
      {
        id: "move-clouds",
        label: "Cloud hands",
        duration: "5 min",
        kind: "movement",
        movement: "cloudHands",
        preferredView: "front",
      },
    ],
  },
  {
    id: "unsure",
    prompt: "Start by noticing",
    mode: "Notice",
    title: "Begin with observation",
    duration: "5 min",
    description: "Gather information without deciding what it means.",
    icon: "?",
    steps: [
      { id: "unsure-orient", label: "Orient to the room", duration: "90 sec", kind: "sensory" },
      { id: "unsure-sensation", label: "Name the nearest sensation", duration: "2 min", kind: "sensory" },
      { id: "unsure-direction", label: "Choose one next direction", duration: "90 sec", kind: "literacy" },
    ],
  },
];

export const literacyNotes = [
  {
    title: "Orienting is not distraction",
    category: "Settle · 2 min",
    body:
      "Letting your eyes and attention register the room can reduce the demand to monitor everything at once. It is information gathering, not a test of calm.",
  },
  {
    title: "Why movement can precede stillness",
    category: "Move · 3 min",
    body:
      "Stillness is not always the most accessible starting point. Slow, predictable movement can give attention a structure before you ask it to become quiet.",
  },
  {
    title: "Chess as bounded attention",
    category: "Focus · 3 min",
    body:
      "A position offers a finite field of relationships. The practice is noticing, wandering, and returning. Evenward leaves the clock out of it.",
  },
  {
    title: "Access changes the form, not the practice",
    category: "Move · 3 min",
    body:
      "A stable chair, wheelchair, cane, walker, wall, or rail can change the form of a weight shift. Evenward keeps the movement library present while adapting the name, support cue, range, and demonstration.",
  },
  {
    title: "A pattern is not a diagnosis",
    category: "Patterns · 2 min",
    body:
      "Observations can support thoughtful choices. They cannot establish why a response occurred and should remain open to context.",
  },
] as const;

export const defaultAvatar: AvatarConfig = {
  hair: "wave",
  garment: "movement",
  skin: "medium",
  headwear: "none",
  faithAccessory: "none",
  glasses: true,
  height: 100,
  weight: 100,
  mobility: "standing",
  support: "none",
  lowVision: false,
  hearingSupport: false,
  reducedMotion: false,
  playbackSpeed: "standard",
  solidSurfaces: false,
};

export const defaultChess: SavedChess = {
  pgn: "",
  boardTheme: "afloat",
  completed: 0,
  finishedRecorded: false,
};

export const navItems: { id: ViewId; label: string; mark: string }[] = [
  { id: "today", label: "Today", mark: "✦" },
  { id: "practice", label: "Practice", mark: "⌁" },
  { id: "chess", label: "Chess", mark: "◇" },
  { id: "patterns", label: "Patterns", mark: "⌘" },
  { id: "understand", label: "Learn", mark: "≡" },
];

export const boardThemes: { id: BoardTheme; name: string; note: string }[] = [
  { id: "afloat", name: "Sea", note: "afloat" },
  { id: "forest", name: "Forest", note: "moss stone" },
  { id: "desert", name: "Desert", note: "sandstone" },
  { id: "sky", name: "Sky", note: "cloud stone" },
  { id: "space", name: "Space", note: "moon rock" },
  { id: "ocean", name: "Ocean", note: "underwater" },
  { id: "ice", name: "Ice", note: "frosted stone" },
];

export function isChoiceId(value: string): value is ChoiceId {
  return flows.some((flow) => flow.id === value);
}
