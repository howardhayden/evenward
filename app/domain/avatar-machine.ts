import type {
  GuideMood,
  GuidePart,
  GuideReaction,
  MovementDemo,
  MovementView,
} from "./types";

export type AvatarBehaviorMode =
  | "entering"
  | "walking-left"
  | "idle"
  | "transitioning"
  | "demonstrating"
  | "paused"
  | "reduced-motion"
  | "reacting"
  | "returning"
  | "leaving"
  | "walking-right"
  | "hidden";

export type AvatarBehaviorState = {
  mode: AvatarBehaviorMode;
  movement: MovementDemo;
  sourceId: string | null;
  view: MovementView;
  facing: "left" | "right";
  mood: GuideMood;
  reaction: GuideReaction;
  poseIndex: number;
  reducedMotion: boolean;
  resumeMode: "idle" | "demonstrating" | "paused" | "reduced-motion";
};

export type AvatarBehaviorEvent =
  | { type: "WALK_IN" }
  | { type: "ARRIVED" }
  | {
      type: "DEMONSTRATE";
      movement: MovementDemo;
      sourceId: string;
      view: MovementView;
    }
  | { type: "TRANSITIONED" }
  | { type: "SET_VIEW"; view: MovementView }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "REACT"; part: Exclude<GuidePart, "boundary"> }
  | { type: "REACTION_FINISHED" }
  | { type: "RETURN" }
  | { type: "RETURNED" }
  | { type: "LEAVE" }
  | { type: "WALK_OUT" }
  | { type: "LEFT" }
  | { type: "SET_REDUCED_MOTION"; value: boolean }
  | { type: "NEXT_POSE" }
  | { type: "PREVIOUS_POSE" };

export function initialAvatarBehavior(reducedMotion = false): AvatarBehaviorState {
  return {
    mode: "entering",
    movement: "rest",
    sourceId: null,
    view: "side",
    facing: "left",
    mood: "calm",
    reaction: "arriving",
    poseIndex: 0,
    reducedMotion,
    resumeMode: "idle",
  };
}

function demonstrationMode(state: AvatarBehaviorState): AvatarBehaviorMode {
  return state.reducedMotion ? "reduced-motion" : "demonstrating";
}

function reactionForPart(part: Exclude<GuidePart, "boundary">): GuideReaction {
  const reactions: Record<Exclude<GuidePart, "boundary">, GuideReaction> = {
    head: "headPat",
    leftHand: "waveLeft",
    rightHand: "waveRight",
    leftLeg: "stompLeft",
    rightLeg: "stompRight",
  };
  return reactions[part];
}

export function avatarBehaviorReducer(
  state: AvatarBehaviorState,
  event: AvatarBehaviorEvent,
): AvatarBehaviorState {
  switch (event.type) {
    case "WALK_IN":
      if (state.mode !== "entering") return state;
      return { ...state, mode: "walking-left", facing: "left", reaction: "arriving" };
    case "ARRIVED":
      if (state.mode !== "entering" && state.mode !== "walking-left") return state;
      return {
        ...state,
        mode: "idle",
        movement: "rest",
        sourceId: null,
        view: "front",
        facing: "right",
        reaction: "idle",
        resumeMode: "idle",
      };
    case "DEMONSTRATE":
      if (
        state.mode === "leaving" ||
        state.mode === "walking-right" ||
        state.mode === "hidden"
      ) {
        return state;
      }
      return {
        ...state,
        mode: "transitioning",
        movement: event.movement,
        sourceId: event.sourceId,
        view: event.view,
        facing: "right",
        reaction: "idle",
        mood: "calm",
        poseIndex: 0,
        resumeMode: state.reducedMotion ? "reduced-motion" : "demonstrating",
      };
    case "TRANSITIONED":
      if (state.mode !== "transitioning") return state;
      return {
        ...state,
        mode: demonstrationMode(state),
        resumeMode: state.reducedMotion ? "reduced-motion" : "demonstrating",
      };
    case "SET_VIEW":
      return state.movement === "rest" ? state : { ...state, view: event.view };
    case "PAUSE":
      if (
        state.mode !== "demonstrating" &&
        state.mode !== "reduced-motion" &&
        state.mode !== "transitioning"
      ) {
        return state;
      }
      return {
        ...state,
        mode: "paused",
        resumeMode: state.reducedMotion ? "reduced-motion" : "demonstrating",
      };
    case "RESUME":
      if (state.mode !== "paused") return state;
      return {
        ...state,
        mode: demonstrationMode(state),
        resumeMode: state.reducedMotion ? "reduced-motion" : "demonstrating",
      };
    case "REACT": {
      if (
        state.mode === "leaving" ||
        state.mode === "walking-right" ||
        state.mode === "hidden"
      ) {
        return state;
      }
      const resumeMode =
        state.mode === "paused"
          ? "paused"
          : state.movement === "rest"
            ? "idle"
            : state.reducedMotion
              ? "reduced-motion"
              : "demonstrating";
      return {
        ...state,
        mode: "reacting",
        reaction: reactionForPart(event.part),
        mood: event.part === "head" ? "pleased" : "happy",
        resumeMode,
      };
    }
    case "REACTION_FINISHED":
      if (state.mode !== "reacting") return state;
      return {
        ...state,
        mode: state.resumeMode,
        reaction: "idle",
        mood: "calm",
      };
    case "RETURN":
      if (state.mode === "hidden" || state.mode === "walking-right") return state;
      return {
        ...state,
        mode: "returning",
        movement: "rest",
        sourceId: null,
        reaction: "idle",
        mood: "calm",
        poseIndex: 0,
        resumeMode: "idle",
      };
    case "RETURNED":
      if (state.mode !== "returning") return state;
      return { ...state, mode: "idle", view: "front", facing: "right" };
    case "LEAVE":
      if (state.mode === "hidden" || state.mode === "walking-right") return state;
      return {
        ...state,
        mode: "leaving",
        movement: "rest",
        sourceId: null,
        view: "side",
        facing: "right",
        reaction: "boundary",
        mood: "calm",
        poseIndex: 0,
        resumeMode: "idle",
      };
    case "WALK_OUT":
      if (state.mode !== "leaving") return state;
      return { ...state, mode: "walking-right", view: "side", facing: "right" };
    case "LEFT":
      if (state.mode !== "leaving" && state.mode !== "walking-right") return state;
      return { ...state, mode: "hidden", reaction: "idle" };
    case "SET_REDUCED_MOTION": {
      const next = {
        ...state,
        reducedMotion: event.value,
        resumeMode:
          state.movement === "rest"
            ? "idle" as const
            : event.value
              ? "reduced-motion" as const
              : "demonstrating" as const,
      };
      if (state.mode === "demonstrating" && event.value) {
        return { ...next, mode: "reduced-motion", resumeMode: "reduced-motion" };
      }
      if (state.mode === "reduced-motion" && !event.value) {
        return { ...next, mode: "demonstrating", resumeMode: "demonstrating" };
      }
      return next;
    }
    case "NEXT_POSE":
      return state.mode === "reduced-motion"
        ? { ...state, poseIndex: (state.poseIndex + 1) % 3 }
        : state;
    case "PREVIOUS_POSE":
      return state.mode === "reduced-motion"
        ? { ...state, poseIndex: (state.poseIndex + 2) % 3 }
        : state;
  }
}

export function avatarStateAnnouncement(state: AvatarBehaviorState) {
  if (state.mode === "hidden") return "The guide has left the screen.";
  if (state.mode === "paused") return "Movement demonstration paused.";
  if (state.mode === "reduced-motion") {
    return `Staged movement pose ${state.poseIndex + 1} of 3.`;
  }
  if (state.mode === "demonstrating") return "Movement demonstration repeating.";
  if (state.mode === "walking-left") return "The guide is entering.";
  if (state.mode === "walking-right") return "The guide is leaving.";
  return "";
}
