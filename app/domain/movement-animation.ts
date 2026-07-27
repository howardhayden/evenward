import type {
  AvatarConfig,
  JointPose,
  MovementDefinition,
  MovementPhase,
  MovementView,
} from "./types";

export type RigTarget =
  | "body"
  | "head"
  | "left-arm"
  | "right-arm"
  | "left-forearm"
  | "right-forearm"
  | "left-leg"
  | "right-leg"
  | "left-shin"
  | "right-shin"
  | "left-foot"
  | "right-foot";

export const rigTargets: RigTarget[] = [
  "body",
  "head",
  "left-arm",
  "right-arm",
  "left-forearm",
  "right-forearm",
  "left-leg",
  "right-leg",
  "left-shin",
  "right-shin",
  "left-foot",
  "right-foot",
];

function scaleJoints(joints: JointPose, scale: number): JointPose {
  return Object.fromEntries(
    Object.entries(joints).map(([joint, value]) => [joint, (value ?? 0) * scale]),
  ) as JointPose;
}

function seatedCatCowPhase(phase: MovementPhase): MovementPhase {
  const cat = phase.id === "cat";
  const cow = phase.id === "cow";
  return {
    ...phase,
    bodyX: 0,
    bodyY: cat ? 4 : cow ? -2 : 1,
    bodyRotation: 0,
    bodyScaleX: 1,
    bodyScaleY: cat ? 0.96 : cow ? 1.025 : 1,
    joints: {
      head: cat ? 8 : cow ? -7 : 0,
      torso: cat ? -7 : cow ? 8 : 0,
      leftShoulder: cat ? 18 : 8,
      leftElbow: cat ? -42 : -28,
      rightShoulder: cat ? -18 : -8,
      rightElbow: cat ? 42 : 28,
      leftHip: 0,
      rightHip: 0,
      leftKnee: 0,
      rightKnee: 0,
    },
  };
}

export function adaptedMovementPhases(
  definition: MovementDefinition,
  avatar: AvatarConfig,
  view: MovementView = "front",
): MovementPhase[] {
  return definition.phases.map((original) => {
    if (avatar.mobility === "seated" && definition.id === "catCow") {
      return seatedCatCowPhase(original);
    }

    const rangeScale =
      avatar.mobility === "limited"
        ? 0.52
        : avatar.mobility === "balance"
          ? 0.72
          : avatar.mobility === "seated"
            ? 0.62
            : 1;
    const joints = scaleJoints(original.joints, rangeScale);

    if (
      view === "side" &&
      (definition.discipline === "Tai chi" ||
        definition.id === "chairPose" ||
        definition.id === "treePose")
    ) {
      if (joints.leftShoulder !== undefined) {
        joints.leftShoulder = -Math.min(128, Math.abs(joints.leftShoulder) * 1.35);
      }
      if (joints.rightShoulder !== undefined) {
        joints.rightShoulder = -Math.min(128, Math.abs(joints.rightShoulder) * 1.35);
      }
      if (joints.leftElbow !== undefined) {
        joints.leftElbow = Math.abs(joints.leftElbow);
      }
      if (joints.rightElbow !== undefined) {
        joints.rightElbow = Math.abs(joints.rightElbow);
      }
    }

    if (
      view === "side" &&
      ["riseSink", "opening", "jointCircles", "silkReeling", "cloudHands", "mountain", "chairPose"].includes(
        definition.id,
      )
    ) {
      if (joints.leftKnee !== undefined) {
        joints.leftKnee = -Math.abs(joints.leftKnee);
      }
      if (joints.rightKnee !== undefined) {
        joints.rightKnee = -Math.abs(joints.rightKnee);
      }
    }

    if (avatar.mobility === "oneArm") {
      joints.rightShoulder = 0;
      joints.rightElbow = 0;
      joints.rightHand = 0;
    }

    return {
      ...original,
      bodyX: original.bodyX * (avatar.mobility === "seated" ? 0.24 : rangeScale),
      bodyY: original.bodyY * (avatar.mobility === "seated" ? 0.3 : rangeScale),
      bodyRotation:
        avatar.mobility === "seated"
          ? 0
          : (original.bodyRotation ?? 0) * rangeScale,
      bodyScaleX:
        avatar.mobility === "seated"
          ? 1
          : 1 + ((original.bodyScaleX ?? 1) - 1) * rangeScale,
      bodyScaleY:
        avatar.mobility === "seated"
          ? 1
          : 1 + ((original.bodyScaleY ?? 1) - 1) * rangeScale,
      joints,
    };
  });
}

function number(joints: JointPose, key: keyof JointPose) {
  return joints[key] ?? 0;
}

export function rigTransform(phase: MovementPhase, target: RigTarget) {
  const joints = phase.joints;
  switch (target) {
    case "body":
      return `translate(${phase.bodyX.toFixed(2)}px, ${phase.bodyY.toFixed(2)}px) rotate(${((phase.bodyRotation ?? 0) + number(joints, "torso")).toFixed(2)}deg) scale(${(phase.bodyScaleX ?? 1).toFixed(3)}, ${(phase.bodyScaleY ?? 1).toFixed(3)})`;
    case "head":
      return `rotate(${number(joints, "head").toFixed(2)}deg)`;
    case "left-arm":
      return `rotate(${number(joints, "leftShoulder").toFixed(2)}deg)`;
    case "right-arm":
      return `rotate(${number(joints, "rightShoulder").toFixed(2)}deg)`;
    case "left-forearm":
      return `rotate(${number(joints, "leftElbow").toFixed(2)}deg)`;
    case "right-forearm":
      return `rotate(${number(joints, "rightElbow").toFixed(2)}deg)`;
    case "left-leg":
      return `rotate(${(number(joints, "leftHip") + number(joints, "pelvis")).toFixed(2)}deg)`;
    case "right-leg":
      return `rotate(${(number(joints, "rightHip") + number(joints, "pelvis")).toFixed(2)}deg)`;
    case "left-shin":
      return `rotate(${number(joints, "leftKnee").toFixed(2)}deg)`;
    case "right-shin":
      return `rotate(${number(joints, "rightKnee").toFixed(2)}deg)`;
    case "left-foot":
      return `rotate(${number(joints, "leftFoot").toFixed(2)}deg)`;
    case "right-foot":
      return `rotate(${number(joints, "rightFoot").toFixed(2)}deg)`;
  }
}

export function rigAnimationName(
  definition: MovementDefinition,
  avatar: AvatarConfig,
  target: RigTarget,
  view: MovementView = "front",
) {
  return `evenward-${definition.id}-${avatar.mobility}-${view}-${target}`;
}

export function movementAnimationCss(
  definition: MovementDefinition,
  avatar: AvatarConfig,
  view: MovementView = "front",
) {
  const phases = adaptedMovementPhases(definition, avatar, view);
  return rigTargets
    .map((target) => {
      const frames = phases
        .map(
          (current) =>
            `${Math.round(current.progress * 10000) / 100}% { transform: ${rigTransform(current, target)}; }`,
        )
        .join("\n");
      return `@keyframes ${rigAnimationName(definition, avatar, target, view)} {\n${frames}\n}`;
    })
    .join("\n");
}

export function stagedRigTransform(
  definition: MovementDefinition,
  avatar: AvatarConfig,
  target: RigTarget,
  poseIndex: number,
  view: MovementView = "front",
) {
  const phaseIndex = definition.reducedPhaseIndexes[poseIndex] ?? 0;
  const phase =
    adaptedMovementPhases(definition, avatar, view)[phaseIndex] ??
    adaptedMovementPhases(definition, avatar, view)[0];
  return rigTransform(phase, target);
}
