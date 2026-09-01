export type ThemeName = "forest" | "sea" | "sunrise";
export type ThemeMode = "light" | "dark";
export type SceneName = "leaves" | "rain" | "waves" | "sky";
export type ChoiceId = "settle" | "alert" | "focus" | "move" | "unsure";
export type ViewId =
  | "today"
  | "practice"
  | "care"
  | "chess"
  | "patterns"
  | "understand";
export type OutcomeId = "settled" | "alert" | "focused" | "neutral";
export type HairStyle = "crop" | "wave" | "coils" | "braid" | "long" | "bald";
export type GarmentStyle = "movement" | "tunic" | "robe" | "loose" | "athletic";
export type SkinTone = "porcelain" | "light" | "medium" | "olive" | "brown" | "deep";
export type Headwear =
  | "none"
  | "hijab"
  | "dastar"
  | "kippah"
  | "kufi"
  | "veil"
  | "burqa";
export type FaithAccessory =
  | "none"
  | "cross"
  | "rosary"
  | "mala"
  | "star"
  | "crescent";
export type MobilityMode = "standing" | "seated" | "balance" | "limited" | "oneArm";
export type SupportAccessory =
  | "none"
  | "chair"
  | "wheelchair"
  | "cane"
  | "walker"
  | "rail";
export type BoardTheme =
  | "afloat"
  | "forest"
  | "desert"
  | "sky"
  | "space"
  | "ocean"
  | "ice";

export type MovementDemo =
  | "rest"
  | "riseSink"
  | "jointCircles"
  | "opening"
  | "silkReeling"
  | "cloudHands"
  | "singleCloud"
  | "partHorse"
  | "brushKnee"
  | "wardOff"
  | "repulseMonkey"
  | "goldenRooster"
  | "whiteCrane"
  | "sparrowTail"
  | "fairLady"
  | "snakeDown"
  | "mountain"
  | "catCow"
  | "chairPose"
  | "warriorTwo"
  | "treePose"
  | "toeTap"
  | "heelDrop"
  | "shuffle"
  | "flap"
  | "stepBallChange"
  | "jazzSquare"
  | "stepTouch"
  | "pasDeBourree"
  | "pivotTurn"
  | "kickBallChange"
  | "tripleStep"
  | "rockStep"
  | "lindyBasic"
  | "charleston"
  | "tuckTurn";

export type MovementView = "front" | "side";
export type MovementDiscipline = "Tai chi" | "Yoga" | "Tap" | "Jazz" | "Swing";
export type GuideMood = "calm" | "happy" | "pleased";
export type GuideReaction =
  | "arriving"
  | "idle"
  | "waveLeft"
  | "waveRight"
  | "headPat"
  | "stompLeft"
  | "stompRight"
  | "boundary";
export type GuidePart =
  | "head"
  | "leftHand"
  | "rightHand"
  | "leftLeg"
  | "rightLeg"
  | "boundary";
export type Daypart = "morning" | "afternoon" | "evening" | "night";
export type PlaybackSpeed = "standard" | "slow";

export type AvatarConfig = {
  hair: HairStyle;
  garment: GarmentStyle;
  skin: SkinTone;
  headwear: Headwear;
  faithAccessory: FaithAccessory;
  glasses: boolean;
  height: number;
  weight: number;
  mobility: MobilityMode;
  support: SupportAccessory;
  lowVision: boolean;
  hearingSupport: boolean;
  reducedMotion: boolean;
  playbackSpeed: PlaybackSpeed;
  solidSurfaces: boolean;
};

export type FlowStep = {
  id: string;
  label: string;
  duration: string;
  kind: "sensory" | "breath" | "movement" | "focus" | "pattern" | "literacy";
  movement?: MovementDemo;
  preferredView?: MovementView;
};

export type Flow = {
  id: ChoiceId | `movement-${string}`;
  prompt: string;
  mode: string;
  title: string;
  duration: string;
  description: string;
  icon: string;
  steps: FlowStep[];
};

export type JointPose = Partial<{
  head: number;
  neck: number;
  torso: number;
  pelvis: number;
  leftShoulder: number;
  leftElbow: number;
  leftHand: number;
  rightShoulder: number;
  rightElbow: number;
  rightHand: number;
  leftHip: number;
  leftKnee: number;
  leftFoot: number;
  rightHip: number;
  rightKnee: number;
  rightFoot: number;
}>;

export type MovementPhase = {
  id: string;
  label: string;
  progress: number;
  bodyX: number;
  bodyY: number;
  bodyRotation?: number;
  bodyScaleX?: number;
  bodyScaleY?: number;
  weightSide: "left" | "center" | "right";
  joints: JointPose;
};

export type MotionFamily =
  | "still"
  | "rise"
  | "circle"
  | "cloud"
  | "form"
  | "balance"
  | "spine"
  | "footwork"
  | "travel"
  | "swing";

export type MovementDefinition = {
  id: Exclude<MovementDemo, "rest" | "singleCloud">;
  title: string;
  discipline: MovementDiscipline;
  description: string;
  preferredView: MovementView;
  startingPose: string;
  position: "standing" | "quadruped";
  motionFamily: MotionFamily;
  durationMs: number;
  easing: string;
  repeats: true;
  phases: MovementPhase[];
  instruction: string;
  howTo: [string, string, string, ...string[]];
  accessibility: string;
  reducedMotionSteps: [string, string, string];
  reducedPhaseIndexes: [number, number, number];
  cautions: string[];
  allowedWithBurqa: boolean;
};

export type MovementPractice = MovementDefinition;

export type PeerConfig = {
  id: string;
  hair: HairStyle;
  garment: GarmentStyle;
  skin: SkinTone;
  headwear: Headwear;
  faithAccessory: FaithAccessory;
  glasses: boolean;
  height: number;
  weight: number;
};

export type VisitNote = {
  flowTitle: string;
  outcome: OutcomeId;
};

export type SavedChess = {
  pgn: string;
  boardTheme: BoardTheme;
  completed: number;
  finishedRecorded: boolean;
};

export type AppearancePreferences = {
  theme: ThemeName;
  mode: ThemeMode;
  scene: SceneName;
  avatar: AvatarConfig;
};
