import { movementPractices } from "./content";
import type {
  AvatarConfig,
  FaithAccessory,
  Flow,
  FlowStep,
  GarmentStyle,
  HairStyle,
  Headwear,
  MovementDefinition,
  MovementDemo,
  PeerConfig,
  SkinTone,
  SupportAccessory,
} from "./types";

export function secondsFor(duration: string) {
  const value = Number.parseInt(duration, 10);
  return duration.includes("min") ? value * 60 : value;
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function generatePeers(): PeerConfig[] {
  const hairs: HairStyle[] = ["crop", "wave", "coils", "braid", "long", "bald"];
  const garments: GarmentStyle[] = ["movement", "tunic", "robe", "loose", "athletic"];
  const skins: SkinTone[] = ["porcelain", "light", "medium", "olive", "brown", "deep"];
  const faithLooks: { headwear: Headwear; faithAccessory: FaithAccessory }[] = [
    { headwear: "none", faithAccessory: "none" },
    { headwear: "none", faithAccessory: "cross" },
    { headwear: "none", faithAccessory: "mala" },
    { headwear: "none", faithAccessory: "star" },
    { headwear: "none", faithAccessory: "crescent" },
    { headwear: "hijab", faithAccessory: "none" },
    { headwear: "hijab", faithAccessory: "crescent" },
    { headwear: "dastar", faithAccessory: "none" },
    { headwear: "kippah", faithAccessory: "star" },
    { headwear: "kufi", faithAccessory: "none" },
    { headwear: "veil", faithAccessory: "cross" },
    { headwear: "veil", faithAccessory: "rosary" },
    { headwear: "burqa", faithAccessory: "none" },
  ];

  return Array.from({ length: 3 }, (_, index) => {
    const faithLook = randomItem(faithLooks);
    return {
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      hair: randomItem(hairs),
      garment: randomItem(garments),
      skin: randomItem(skins),
      ...faithLook,
      glasses: Math.random() > 0.58,
      height: 90 + Math.round(Math.random() * 20),
      weight: 82 + Math.round(Math.random() * 36),
    };
  });
}

export function movementAvailable(
  movement: Pick<MovementDefinition, "allowedWithBurqa">,
  avatar: AvatarConfig,
) {
  return avatar.headwear !== "burqa" || movement.allowedWithBurqa;
}

export function availableMovementPractices(avatar: AvatarConfig) {
  return movementPractices.filter((movement) => movementAvailable(movement, avatar));
}

export function adaptMovementLabel(label: string, avatar: AvatarConfig) {
  if (/^(Seated|Supported|Small-range|One-arm|Single cloud hand)/.test(label)) {
    return label;
  }
  if (avatar.mobility === "seated") return `Seated ${label.toLowerCase()}`;
  if (avatar.mobility === "balance") return `Supported ${label.toLowerCase()}`;
  if (avatar.mobility === "limited") return `Small-range ${label.toLowerCase()}`;
  if (avatar.mobility === "oneArm") {
    return label === "Cloud hands" ? "Single cloud hand" : `One-arm ${label.toLowerCase()}`;
  }
  return label;
}

export function supportPhrase(avatar: AvatarConfig) {
  const phrases: Record<SupportAccessory, string> = {
    none:
      avatar.mobility === "seated"
        ? "Use a stable seat."
        : avatar.mobility === "balance"
          ? "Keep one steady contact point."
          : "",
    chair:
      avatar.mobility === "seated"
        ? "Stay supported by the chair."
        : "Keep the chair within easy reach.",
    wheelchair: "Keep the wheelchair stable and work from the seated base.",
    cane: "Keep the cane grounded as a quiet reference point.",
    walker: "Keep both hands or one available hand within the walker frame.",
    rail: "Keep light contact with the wall or rail.",
  };
  return phrases[avatar.support];
}

export function effectiveSupport(avatar: AvatarConfig): SupportAccessory {
  if (avatar.support !== "none") return avatar.support;
  if (avatar.mobility === "seated") return "chair";
  if (avatar.mobility === "balance") return "rail";
  return "none";
}

export function adaptFlow(flow: Flow, avatar: AvatarConfig): Flow {
  if (!flow.steps.some((step) => step.kind === "movement")) return flow;

  const steps = flow.steps
    .filter((step) => {
      if (step.kind !== "movement") return true;
      const movement = movementPractices.find(
        (candidate) => candidate.id === (step.movement ?? movementDemoFor(step.label)),
      );
      return movement ? movementAvailable(movement, avatar) : true;
    })
    .map((step) => ({
      ...step,
      label: step.kind === "movement"
        ? adaptMovementLabel(step.label, avatar)
        : step.label,
    }));
  const seconds = steps.reduce((total, step) => total + secondsFor(step.duration), 0);

  return {
    ...flow,
    duration: `${Math.max(1, Math.ceil(seconds / 60))} min`,
    steps,
  };
}

export function movementFlow(move: MovementDefinition, avatar: AvatarConfig): Flow {
  const title = adaptMovementLabel(move.title, avatar);
  return {
    id: `movement-${move.id}`,
    prompt: move.title,
    mode: move.discipline,
    title,
    duration: "5 min",
    description: `${move.description} ${supportPhrase(avatar)}`.trim(),
    icon: "⌁",
    steps: [
      { id: `${move.id}-base`, label: "Find your base", duration: "45 sec", kind: "sensory" },
      {
        id: `${move.id}-movement`,
        label: title,
        duration: "3 min",
        kind: "movement",
        movement:
          avatar.mobility === "oneArm" && move.id === "cloudHands"
            ? "singleCloud"
            : move.id,
        preferredView: move.preferredView,
      },
      { id: `${move.id}-neutral`, label: "Return to neutral", duration: "75 sec", kind: "breath" },
    ],
  };
}

export function movementDemoFor(label: string): MovementDemo {
  const normalized = label.toLowerCase();
  const match = movementPractices.find((move) =>
    normalized.includes(move.title.toLowerCase())
  );
  if (match) return match.id;
  if (normalized.includes("single cloud")) return "singleCloud";
  if (normalized.includes("golden rooster")) return "goldenRooster";
  if (normalized.includes("repulse monkey")) return "repulseMonkey";
  if (normalized.includes("ward off")) return "wardOff";
  if (normalized.includes("brush knee")) return "brushKnee";
  if (normalized.includes("horse")) return "partHorse";
  if (normalized.includes("silk")) return "silkReeling";
  if (normalized.includes("opening")) return "opening";
  if (normalized.includes("cloud hand")) return "cloudHands";
  if (normalized.includes("joint circle")) return "jointCircles";
  if (normalized.includes("rise") || normalized.includes("settle")) return "riseSink";
  return "rest";
}

export function movementDefinitionFor(demo: MovementDemo) {
  if (demo === "rest" || demo === "singleCloud") return null;
  return movementPractices.find((movement) => movement.id === demo) ?? null;
}

function movementFromLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("single cloud hand")) {
    return movementPractices.find((move) => move.id === "cloudHands") ?? null;
  }
  return movementPractices.find((move) =>
    normalized.includes(move.title.toLowerCase())
  ) ?? null;
}

function seatedDirections(move: MovementDefinition): string[] {
  if (move.id === "catCow") {
    return [
      "Sit toward the front of a stable chair with both feet planted and the hands resting on the thighs.",
      "Press gently into the thighs, tuck the chin a little, and round the middle back.",
      "Tip the pelvis forward, lengthen the breastbone ahead, and lift the gaze slightly.",
      "Return to an upright seated spine before repeating.",
    ];
  }
  if (move.motionFamily === "footwork") {
    return [
      "Sit toward the front of a stable seat with both feet placed beneath the knees.",
      ...move.howTo.slice(1).map((step) =>
        step
          .replace(/transfer weight (fully )?onto/gi, "press the floor with")
          .replace(/shift weight (briefly )?to/gi, "press briefly through")
          .replace(/replace weight onto/gi, "press through")
      ),
    ];
  }
  if (move.motionFamily === "travel" || move.motionFamily === "swing") {
    return [
      "Sit toward the front of a stable seat with both feet free to mark the floor.",
      ...move.howTo.slice(0, 3).map((step) =>
        step
          .replace(/^Step /, "Mark ")
          .replace(/^Rock /, "Reach ")
          .replace(/transfer weight/gi, "shift foot pressure")
          .replace(/weight/gi, "pressure")
      ),
      "Keep both sitting bones supported while the feet repeat the named pattern.",
    ];
  }
  return [
    "Sit tall with both feet planted and both sitting bones supported.",
    ...move.howTo.slice(1).map((step) =>
      step
        .replace(/transfer weight/gi, "shift the torso")
        .replace(/shift (all |most of )?the weight/gi, "turn the torso")
        .replace(/stand on one leg/gi, "keep both sitting bones supported")
        .replace(/place the .*?heel/gi, "slide the foot")
        .replace(/step /gi, "slide or tap ")
    ),
  ];
}

export function movementHowTo(
  move: MovementDefinition,
  avatar: AvatarConfig,
): string[] {
  if (avatar.mobility === "seated") return seatedDirections(move);
  const directions = [...move.howTo];
  if (avatar.mobility === "limited") {
    directions.unshift(
      "Use a deliberately small version of every direction shown; the sequence stays the same.",
    );
  }
  if (avatar.mobility === "balance") {
    directions.unshift(
      `Set the selected ${effectiveSupport(avatar)} before beginning and keep contact whenever the demonstration does.`,
    );
  }
  if (avatar.mobility === "oneArm") {
    directions.unshift(
      "Follow the demonstrated pathway with the visible arm; keep the other shoulder quiet.",
    );
  }
  return directions;
}

export function movementStartingPose(
  move: MovementDefinition,
  avatar: AvatarConfig,
) {
  if (avatar.mobility === "seated") {
    return move.id === "catCow"
      ? "Sit toward the front of a stable chair with feet planted and hands on the thighs."
      : "Sit tall in the selected seat with both feet placed securely.";
  }
  return `${move.startingPose} ${supportPhrase(avatar)}`.trim();
}

export function movementDescription(label: string, avatar: AvatarConfig) {
  const move = movementFromLabel(label);
  if (!move) return "Follow the named pathway through a comfortable range.";
  return `${move.description} ${supportPhrase(avatar)}`.trim();
}

export function nextMovement(
  currentId: string | null,
  available: MovementDefinition[],
) {
  if (!available.length) return null;
  const index = available.findIndex((movement) => movement.id === currentId);
  return available[index < 0 ? 0 : (index + 1) % available.length];
}

export function isMovementStep(step: FlowStep | undefined): step is FlowStep & {
  movement: MovementDemo;
} {
  return Boolean(step && step.kind === "movement" && step.movement);
}
