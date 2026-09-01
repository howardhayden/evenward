/**
 * Pre-production, in-memory semantic model for the footwear-care reference route.
 *
 * This module deliberately owns no clock, pointer input, persistence, rendering,
 * shader state, or physical-outcome claim. Callers provide explicit semantic
 * events and consume one immutable revision at a time.
 */

export const CARE_STATUSES = Object.freeze([
  "checking",
  "ready",
  "active",
  "paused",
  "complete",
  "unavailable",
  "cancelled",
] as const);

export const CARE_STAGES = Object.freeze([
  "compatibility",
  "prepare",
  "apply",
  "work",
  "water",
  "set",
  "finish",
  "complete",
] as const);

export const CARE_SHOES = Object.freeze(["left", "right"] as const);
export const CARE_REGIONS = Object.freeze(["toe", "heel"] as const);
export const CARE_TARGETS = Object.freeze([
  "left-toe",
  "left-heel",
  "right-toe",
  "right-heel",
] as const);
export const CARE_TOOLS = Object.freeze([
  "cotton-cloth",
  "water-drop",
  "lustreur-glove",
] as const);
export const CARE_CONTACTS = Object.freeze(["clear", "approach", "contact", "release"] as const);
export const CARE_MOTION_MODES = Object.freeze(["normal", "reduced", "still"] as const);
export const CARE_COMPATIBILITY_PROFILE = "saphir-amiral-gloss" as const;

export type CareStatus = (typeof CARE_STATUSES)[number];
export type CareStage = (typeof CARE_STAGES)[number];
export type CareShoe = (typeof CARE_SHOES)[number];
export type CareRegion = (typeof CARE_REGIONS)[number];
export type CareTarget = (typeof CARE_TARGETS)[number];
export type CareTool = (typeof CARE_TOOLS)[number];
export type CareContact = (typeof CARE_CONTACTS)[number];
export type CareMotionMode = (typeof CARE_MOTION_MODES)[number];
export type CompatibilityProfile = typeof CARE_COMPATIBILITY_PROFILE;

export type CareAmount = Readonly<Record<CareTarget, number>>;

export type CareState = Readonly<{
  revision: number;
  runId: string;
  status: CareStatus;
  stage: CareStage;
  shoe: CareShoe;
  region: CareRegion;
  targetLocked: boolean;
  tool: CareTool;
  contact: CareContact;
  cycleRecordedThisPass: boolean;
  careAmount: CareAmount;
  requestedMotion: CareMotionMode;
  presentedMotion: CareMotionMode;
  message: string;
  error: string | null;
}>;

export type CompatibilityConfirmations = Readonly<{
  blackSmoothFinishedLeather: boolean;
  productLabelPermitsWaxGlazing: boolean;
  hiddenAreaTestCompleted: boolean;
  productProfile: CompatibilityProfile;
}>;

export type PreparationConfirmations = Readonly<{
  lacesAndDebrisCleared: boolean;
  leatherDry: boolean;
}>;

export const CARE_UNAVAILABLE_REASONS = Object.freeze([
  "unknown-material",
  "suede",
  "nubuck",
  "patent-leather",
  "shell-cordovan",
  "exotic-leather",
  "oiled-leather",
  "damaged-finish",
  "synthetic-material",
  "incompatible-product",
  "maker-does-not-permit-wax-glazing",
] as const);

export type CareUnavailableReason = (typeof CARE_UNAVAILABLE_REASONS)[number];

type RevisionedEvent = Readonly<{
  expectedRevision: number;
  expectedRunId: string;
}>;

export type CareEvent =
  | (RevisionedEvent & Readonly<{
      type: "CONFIRM_COMPATIBILITY";
      confirmations: CompatibilityConfirmations;
    }>)
  | (RevisionedEvent & Readonly<{
      type: "DECLARE_UNAVAILABLE";
      reason: CareUnavailableReason;
    }>)
  | (RevisionedEvent & Readonly<{
      type: "CONFIRM_PREPARATION";
      confirmations: PreparationConfirmations;
    }>)
  | (RevisionedEvent & Readonly<{ type: "PLACE_THIN_AMOUNT" }>)
  | (RevisionedEvent & Readonly<{ type: "APPROACH" }>)
  | (RevisionedEvent & Readonly<{ type: "BEGIN_CONTACT" }>)
  | (RevisionedEvent & Readonly<{ type: "RELEASE" }>)
  | (RevisionedEvent & Readonly<{
      type: "RECORD_CONTACT_CYCLE";
    }>)
  | (RevisionedEvent & Readonly<{
      type: "CHOOSE_WATER";
      productLabelPermitsOneDrop: true;
      resistanceFelt: true;
    }>)
  | (RevisionedEvent & Readonly<{
      type: "CONTINUE_WITH_ONE_WATER_DROP";
      productLabelPermitsOneDrop: true;
    }>)
  | (RevisionedEvent & Readonly<{ type: "CHOOSE_SET" }>)
  | (RevisionedEvent & Readonly<{
      type: "CONFIRM_WAIT_COMPLETE";
      productDirectedWaitCompleted: true;
    }>)
  | (RevisionedEvent & Readonly<{ type: "FINISH_PASS_RELEASED" }>)
  | (RevisionedEvent & Readonly<{ type: "SELECT_SHOE"; shoe: CareShoe }>)
  | (RevisionedEvent & Readonly<{ type: "SELECT_REGION"; region: CareRegion }>)
  | (RevisionedEvent & Readonly<{
      type: "SET_MOTION_MODE";
      mode: CareMotionMode;
    }>)
  | (RevisionedEvent & Readonly<{ type: "BACK" }>)
  | (RevisionedEvent & Readonly<{ type: "PAUSE" }>)
  | (RevisionedEvent & Readonly<{ type: "RESUME" }>)
  | (RevisionedEvent & Readonly<{ type: "CONTACT_LOST" }>)
  | (RevisionedEvent & Readonly<{ type: "CANCEL" }>)
  | (RevisionedEvent & Readonly<{
      type: "RESTART";
      runId: string;
      motion?: CareMotionMode;
    }>);

export type CareEffect =
  | "compatibility-confirmed"
  | "run-unavailable"
  | "preparation-confirmed"
  | "stage-changed"
  | "contact-approached"
  | "approach-withdrawn"
  | "contact-began"
  | "contact-released"
  | "modeled-care-progressed"
  | "target-changed"
  | "motion-mode-changed"
  | "run-paused"
  | "run-resumed"
  | "contact-lost"
  | "run-cancelled"
  | "run-restarted"
  | "safe-boundary-restored"
  | "modeled-sequence-complete";

export const CARE_REJECTION_CODES = Object.freeze([
  "INVALID_STATE",
  "INVALID_EVENT",
  "STALE_REVISION",
  "STALE_RUN",
  "INVALID_TRANSITION",
  "TERMINAL_STATE",
  "CONFIRMATION_REQUIRED",
  "RELEASE_REQUIRED",
  "CONTACT_REQUIRED",
  "CARE_AMOUNT_INVALID",
  "CARE_AMOUNT_DECREASE",
  "TOOL_INCOMPATIBLE",
  "NO_CHANGE",
] as const);

export type CareRejectionCode = (typeof CARE_REJECTION_CODES)[number];

export type CareRejection = Readonly<{
  code: CareRejectionCode;
  message: string;
}>;

export type CareTransitionResult =
  | Readonly<{
      accepted: true;
      state: CareState;
      effects: readonly CareEffect[];
    }>
  | Readonly<{
      accepted: false;
      state: CareState;
      rejection: CareRejection;
    }>;

export type CareAction =
  | "confirm-compatibility"
  | "declare-unavailable"
  | "confirm-preparation"
  | "place-thin-amount"
  | "approach"
  | "begin-contact"
  | "release"
  | "record-contact-cycle"
  | "choose-water"
  | "continue-with-one-water-drop"
  | "choose-set"
  | "confirm-wait-complete"
  | "finish-pass-and-release"
  | "back"
  | "pause"
  | "resume"
  | "cancel"
  | "restart";

export type CareOperativeCopy = Readonly<{
  title: string;
  instruction: string;
  recovery: string;
  modeledStateNotice: string;
  nextActions: readonly CareAction[];
}>;

export type CarePublicSnapshot = Readonly<{
  revision: number;
  runId: string;
  status: CareStatus;
  stage: CareStage;
  shoe: CareShoe;
  region: CareRegion;
  target: CareTarget;
  targetLocked: boolean;
  tool: CareTool;
  contact: CareContact;
  cycleRecordedThisPass: boolean;
  careAmount: CareAmount;
  selectedCareAmount: number;
  requestedMotion: CareMotionMode;
  presentedMotion: CareMotionMode;
  availability: "checking" | "available" | "unavailable";
  message: string;
  error: string | null;
  operativeCopy: CareOperativeCopy;
}>;

type CareStatePatch = Partial<Omit<CareState, "revision" | "careAmount">> &
  Readonly<{ careAmount?: CareAmount }>;

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ISSUED_CARE_STATES = new WeakSet<object>();

const ZERO_CARE_AMOUNT: CareAmount = Object.freeze({
  "left-toe": 0,
  "left-heel": 0,
  "right-toe": 0,
  "right-heel": 0,
});

const CARE_STATE_KEYS = Object.freeze([
  "revision",
  "runId",
  "status",
  "stage",
  "shoe",
  "region",
  "targetLocked",
  "tool",
  "contact",
  "cycleRecordedThisPass",
  "careAmount",
  "requestedMotion",
  "presentedMotion",
  "message",
  "error",
] as const);

const UNAVAILABLE_COPY: Readonly<Record<CareUnavailableReason, string>> = Object.freeze({
  "unknown-material":
    "The footwear material is unknown. Stop here and check the maker's material information.",
  suede:
    "This sequence does not support suede. Stop here and follow the maker's care directions.",
  nubuck:
    "This sequence does not support nubuck. Stop here and follow the maker's care directions.",
  "patent-leather":
    "This sequence does not support patent leather. Stop here and follow the maker's care directions.",
  "shell-cordovan":
    "This sequence does not support shell cordovan. Stop here and follow the maker's care directions.",
  "exotic-leather":
    "This sequence does not support exotic leather. Stop here and follow the maker's care directions.",
  "oiled-leather":
    "This sequence does not support oiled leather. Stop here and follow the maker's care directions.",
  "damaged-finish":
    "The finish is damaged. Stop here and seek product-specific or professional guidance before applying anything.",
  "synthetic-material":
    "This sequence does not support synthetic material. Stop here and follow the maker's care directions.",
  "incompatible-product":
    "The selected product is not the registered compatibility profile. Stop here and follow that product's current label.",
  "maker-does-not-permit-wax-glazing":
    "The maker does not permit wax glazing for this footwear. Do not use this sequence.",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function captureOwnDataRecord(value: unknown): Record<string, unknown> | null {
  try {
    if (!isRecord(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const captured: Record<string, unknown> = Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return null;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      captured[key] = descriptor.value;
    }
    return captured;
  } catch {
    return null;
  }
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isSafeRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value >= 0;
}

function isValidRunId(value: unknown): value is string {
  return typeof value === "string" && RUN_ID_PATTERN.test(value);
}

function isNormalizedAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function hasExactKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

type CareEventFieldDescriptor = Readonly<{
  required: readonly string[];
  optional?: readonly string[];
}>;

const EVENT_FIELDS: Readonly<Record<string, CareEventFieldDescriptor>> = Object.freeze({
  CONFIRM_COMPATIBILITY: { required: ["confirmations"] },
  DECLARE_UNAVAILABLE: { required: ["reason"] },
  CONFIRM_PREPARATION: { required: ["confirmations"] },
  PLACE_THIN_AMOUNT: { required: [] },
  APPROACH: { required: [] },
  BEGIN_CONTACT: { required: [] },
  RELEASE: { required: [] },
  RECORD_CONTACT_CYCLE: { required: [] },
  CHOOSE_WATER: { required: ["productLabelPermitsOneDrop", "resistanceFelt"] },
  CONTINUE_WITH_ONE_WATER_DROP: { required: ["productLabelPermitsOneDrop"] },
  CHOOSE_SET: { required: [] },
  CONFIRM_WAIT_COMPLETE: { required: ["productDirectedWaitCompleted"] },
  FINISH_PASS_RELEASED: { required: [] },
  SELECT_SHOE: { required: ["shoe"] },
  SELECT_REGION: { required: ["region"] },
  SET_MOTION_MODE: { required: ["mode"] },
  BACK: { required: [] },
  PAUSE: { required: [] },
  RESUME: { required: [] },
  CONTACT_LOST: { required: [] },
  CANCEL: { required: [] },
  RESTART: { required: ["runId"], optional: ["motion"] },
} satisfies Record<CareEvent["type"], CareEventFieldDescriptor>);

export const CARE_EVENT_TYPES = Object.freeze(
  Object.keys(EVENT_FIELDS) as CareEvent["type"][],
);

function eventHasExactFields(event: Record<string, unknown>): boolean {
  const descriptor =
    typeof event.type === "string" ? EVENT_FIELDS[event.type] : undefined;
  if (!descriptor) return false;
  const base = ["type", "expectedRevision", "expectedRunId"];
  const required = [...base, ...descriptor.required];
  const allowed = new Set([...required, ...(descriptor.optional ?? [])]);
  const actual = Reflect.ownKeys(event);
  return (
    required.every(
      (field) =>
        Object.hasOwn(event, field) &&
        Object.prototype.propertyIsEnumerable.call(event, field),
    ) &&
    actual.every(
      (field) =>
        typeof field === "string" &&
        allowed.has(field) &&
        Object.prototype.propertyIsEnumerable.call(event, field),
    )
  );
}

function cloneCareAmount(value: CareAmount): CareAmount {
  return Object.freeze({
    "left-toe": value["left-toe"],
    "left-heel": value["left-heel"],
    "right-toe": value["right-toe"],
    "right-heel": value["right-heel"],
  });
}

function expectedToolForStage(stage: CareStage): CareTool {
  if (stage === "water") return "water-drop";
  if (stage === "finish" || stage === "complete") return "lustreur-glove";
  return "cotton-cloth";
}

function activeStatusForStage(stage: CareStage): CareStatus {
  if (stage === "compatibility") return "checking";
  if (stage === "prepare") return "ready";
  if (stage === "complete") return "complete";
  return "active";
}

function initialMessage(shoe: CareShoe, region: CareRegion): string {
  return `Before care begins, confirm black smooth finished leather, the current Saphir Amiral Gloss label permits wax glazing, and an inconspicuous-area test is complete. The selected target is the ${shoe} ${region}.`;
}

function stageMessage(state: Pick<CareState, "stage" | "shoe" | "region" | "tool" | "contact">): string {
  const target = `${state.shoe} ${state.region}`;
  switch (state.stage) {
    case "compatibility":
      return initialMessage(state.shoe, state.region);
    case "prepare":
      return "Remove or secure the laces, remove loose debris, and confirm that the leather is dry before continuing.";
    case "apply":
      return `Use a cotton cloth to place a thin amount of Saphir Amiral Gloss on the ${target}. Follow its current label and warnings.`;
    case "work":
      if (state.contact === "approach") {
        return `For the confirmed Saphir Amiral Gloss profile, move the cotton cloth toward the ${target} only while its current label and warnings still permit this use. Do not record modeled progress until contact is established and a contact cycle is explicitly completed.`;
      }
      if (state.contact === "contact") {
        return `For the confirmed Saphir Amiral Gloss profile, the cotton cloth is in contact with the ${target}. Follow its current label and warnings: use small circles with light pressure, then explicitly record one modeled contact cycle or release.`;
      }
      return `For the confirmed Saphir Amiral Gloss profile, follow its current label and warnings while working the ${target} with a cotton cloth in small circles and light pressure. Recorded care is only a modeled demonstration value, not a measurement of the physical shoe.`;
    case "water":
      return `For the confirmed Saphir Amiral Gloss profile, use one drop of clean water only after resistance is felt and only when its current label and warnings permit it. Otherwise, return to work or choose Set.`;
    case "set":
      return "For the confirmed Saphir Amiral Gloss profile, the reviewed label directs a 30-minute final dry without brushing. Keep every cloth and brush clear, verify that the current physical label still gives that direction, and confirm only after its product-directed wait is complete.";
    case "finish":
      if (state.contact === "approach") {
        return `After the confirmed product-directed dry, move the Saphir Lustreur Glove named by the current label toward the ${target}. Do not use a brush.`;
      }
      if (state.contact === "contact") {
        return `After the confirmed product-directed dry, lightly polish the ${target} with the Saphir Lustreur Glove named by the current label. Do not brush or add another worked wax layer; then use Finish pass and release.`;
      }
      return `Follow the confirmed Saphir Amiral Gloss profile's current label and warnings for a light, non-brush pass with its named Saphir Lustreur Glove on the ${target}. Completion is available only when that pass is explicitly released.`;
    case "complete":
      return "The modeled sequence reached its final release boundary. This state reports only that the modeled steps ended at release; it makes no statement about the physical shoe or its optical appearance.";
  }
}

function freezeState(state: CareState): CareState {
  const issued = Object.freeze({
    ...state,
    careAmount: cloneCareAmount(state.careAmount),
  });
  ISSUED_CARE_STATES.add(issued);
  return issued;
}

export function careTarget(shoe: CareShoe, region: CareRegion): CareTarget {
  if (!isOneOf(shoe, CARE_SHOES) || !isOneOf(region, CARE_REGIONS)) {
    throw new TypeError("Care target requires a registered shoe and rigid care region.");
  }
  return `${shoe}-${region}` as CareTarget;
}

export function nextCareRunId(currentRunId: string, currentRevision: number): string {
  if (!isValidRunId(currentRunId) || !isSafeRevision(currentRevision)) {
    throw new TypeError("A next care run requires a valid current run and revision.");
  }
  if (currentRevision === Number.MAX_SAFE_INTEGER) {
    throw new RangeError("The care revision cannot be incremented safely.");
  }
  const nextRevision = currentRevision + 1;
  const primary = `care-a:${nextRevision}`;
  return primary === currentRunId ? `care-b:${nextRevision}` : primary;
}

export function createInitialCareState(
  runId: string,
  motion: CareMotionMode = "normal",
): CareState {
  if (!isValidRunId(runId)) {
    throw new TypeError("runId must be 1–128 safe identifier characters.");
  }
  if (!isOneOf(motion, CARE_MOTION_MODES)) {
    throw new TypeError("motion must be normal, reduced, or still.");
  }
  return freezeState({
    revision: 0,
    runId,
    status: "checking",
    stage: "compatibility",
    shoe: "left",
    region: "toe",
    targetLocked: false,
    tool: "cotton-cloth",
    contact: "clear",
    cycleRecordedThisPass: false,
    careAmount: ZERO_CARE_AMOUNT,
    requestedMotion: motion,
    presentedMotion: motion,
    message: initialMessage("left", "toe"),
    error: null,
  });
}

function invalidStateReason(state: unknown): string | null {
  try {
    if (!isRecord(state) || !hasExactKeys(state, CARE_STATE_KEYS)) {
    return "Care state must contain exactly the canonical semantic fields.";
    }
    if (!ISSUED_CARE_STATES.has(state)) {
    return "Care state must be an opaque value issued by this reducer; reconstructed structural objects are rejected.";
    }
  if (!isSafeRevision(state.revision) || state.revision === Number.MAX_SAFE_INTEGER) {
    return "Care revision must be a safe, incrementable non-negative integer.";
  }
  if (!isValidRunId(state.runId)) return "Care runId is invalid.";
  if (!isOneOf(state.status, CARE_STATUSES)) return "Care status is invalid.";
  if (!isOneOf(state.stage, CARE_STAGES)) return "Care stage is invalid.";
  if (!isOneOf(state.shoe, CARE_SHOES)) return "Care shoe is invalid.";
  if (!isOneOf(state.region, CARE_REGIONS)) return "Care region is invalid.";
  if (typeof state.targetLocked !== "boolean") return "Care target lock must be boolean.";
  if (!isOneOf(state.tool, CARE_TOOLS)) return "Care tool is invalid.";
  if (!isOneOf(state.contact, CARE_CONTACTS)) return "Care contact is invalid.";
  if (typeof state.cycleRecordedThisPass !== "boolean") {
    return "Current-pass contact-cycle proof must be boolean.";
  }
  if (!isOneOf(state.requestedMotion, CARE_MOTION_MODES)) return "Requested motion is invalid.";
  if (!isOneOf(state.presentedMotion, CARE_MOTION_MODES)) return "Presented motion is invalid.";
  if (state.requestedMotion !== state.presentedMotion) {
    return "This synchronous care model cannot expose different requested and presented motion modes.";
  }
  if (typeof state.message !== "string" || state.message.length === 0) {
    return "Care message must be a non-empty string.";
  }
  if (state.error !== null && typeof state.error !== "string") {
    return "Care error must be a string or null.";
  }
  if (!isRecord(state.careAmount) || !hasExactKeys(state.careAmount, CARE_TARGETS)) {
    return "Care amount must contain exactly the four rigid shoe-region targets.";
  }
  const careAmounts = state.careAmount as Record<CareTarget, unknown>;
  for (const target of CARE_TARGETS) {
    if (!isNormalizedAmount(careAmounts[target])) {
      return `Care amount for ${target} must be finite and within [0,1].`;
    }
  }
  if (
    CARE_TARGETS.some((target) => (careAmounts[target] as number) > 0) &&
    !state.targetLocked
  ) {
    return "Positive modeled progress requires a locked target.";
  }
  if (
    (state.status === "active" || state.status === "complete") &&
    !state.targetLocked
  ) {
    return "Active and complete care states require a locked target.";
  }
  const selectedAmount = careAmounts[careTarget(state.shoe, state.region)] as number;
  if (state.cycleRecordedThisPass && selectedAmount <= 0) {
    return "Current-pass contact-cycle proof requires positive modeled progress on the locked target.";
  }
  if (
    state.cycleRecordedThisPass &&
    (state.stage === "compatibility" ||
      state.stage === "prepare" ||
      state.stage === "apply" ||
      state.status === "unavailable" ||
      state.status === "cancelled")
  ) {
    return "Current-pass contact-cycle proof is incompatible with this stage or status.";
  }
  if (
    /\b(?:guarantee(?:d|s)?|restor(?:e|ed|es|ation)|protect(?:ed|s|ion)?|undamaged|inspection[- ]ready|hot|heated|warm|lukewarm|boiling|wake the polish)\b/i.test(
      state.message,
    )
  ) {
    return "Care message contains a forbidden physical-outcome or temperature claim.";
  }
  if (state.tool !== expectedToolForStage(state.stage)) {
    return `Tool ${state.tool} is incompatible with stage ${state.stage}.`;
  }
  if (state.stage === "complete" && state.status !== "complete") {
    return "The complete stage requires complete status.";
  }
  if (state.status === "complete" && state.stage !== "complete") {
    return "Complete status requires the complete stage.";
  }
  if (
    state.status === "complete" &&
    (state.contact !== "release" ||
      !state.cycleRecordedThisPass ||
      selectedAmount <= 0)
  ) {
    return "Complete status requires final release, current-pass proof, and positive modeled progress on the locked target.";
  }
  if (
    state.status === "cancelled" &&
    (state.cycleRecordedThisPass || CARE_TARGETS.some((target) => careAmounts[target] !== 0))
  ) {
    return "Cancelled status requires cleared cycle proof and modeled values.";
  }
  if (state.status === "checking" && state.stage !== "compatibility") {
    return "Checking status is limited to compatibility.";
  }
  if (state.status === "ready" && state.stage !== "prepare") {
    return "Ready status is limited to preparation.";
  }
  if (
    state.status === "active" &&
    !(["apply", "work", "water", "set", "finish"] as CareStage[]).includes(state.stage)
  ) {
    return "Active status requires an active procedure stage.";
  }
  if (state.status === "unavailable" && state.stage !== "compatibility") {
    return "Unavailable status must remain at compatibility.";
  }
  if (
    (state.status === "paused" || state.status === "cancelled" || state.status === "unavailable") &&
    (state.contact === "approach" || state.contact === "contact")
  ) {
    return `${state.status} state cannot retain active contact.`;
  }
  if (
    (state.contact === "approach" || state.contact === "contact") &&
    !(state.status === "active" && (state.stage === "work" || state.stage === "finish"))
  ) {
    return "Approach or contact is limited to active work or finish stages.";
  }
    return null;
  } catch {
    return "Care state could not be inspected as an own-data semantic record.";
  }
}

function rejection(
  state: CareState,
  code: CareRejectionCode,
  message: string,
): CareTransitionResult {
  return Object.freeze({
    accepted: false,
    state,
    rejection: Object.freeze({ code, message }),
  });
}

function accepted(
  state: CareState,
  patch: CareStatePatch,
  effects: readonly CareEffect[],
): CareTransitionResult {
  const draft = {
    ...state,
    ...patch,
    revision: state.revision + 1,
    careAmount: patch.careAmount ?? state.careAmount,
  } as CareState;
  const next = freezeState({
    ...draft,
    message: patch.message ?? stageMessage(draft),
    error: patch.error === undefined ? null : patch.error,
  });
  const reason = invalidStateReason(next);
  if (reason !== null) {
    return rejection(state, "INVALID_STATE", `Transition would create invalid state: ${reason}`);
  }
  return Object.freeze({
    accepted: true,
    state: next,
    effects: Object.freeze([...effects]),
  });
}

function requiresRelease(state: CareState): CareTransitionResult | null {
  return state.contact === "approach" || state.contact === "contact"
    ? rejection(
        state,
        "RELEASE_REQUIRED",
        "Release contact in a separate accepted transition before changing stage, target, tool, mode, pause, cancel, or restart.",
      )
    : null;
}

function isTerminal(state: CareState): boolean {
  return (
    state.status === "complete" ||
    state.status === "unavailable" ||
    state.status === "cancelled"
  );
}

function validateCompatibility(value: unknown): value is CompatibilityConfirmations {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "blackSmoothFinishedLeather",
      "productLabelPermitsWaxGlazing",
      "hiddenAreaTestCompleted",
      "productProfile",
    ]) &&
    typeof value.blackSmoothFinishedLeather === "boolean" &&
    typeof value.productLabelPermitsWaxGlazing === "boolean" &&
    typeof value.hiddenAreaTestCompleted === "boolean" &&
    value.productProfile === CARE_COMPATIBILITY_PROFILE
  );
}

function validatePreparation(value: unknown): value is PreparationConfirmations {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["lacesAndDebrisCleared", "leatherDry"]) &&
    typeof value.lacesAndDebrisCleared === "boolean" &&
    typeof value.leatherDry === "boolean"
  );
}

function transitionTarget(
  state: CareState,
  shoe: CareShoe,
  region: CareRegion,
): CareTransitionResult {
  const releaseFailure = requiresRelease(state);
  if (releaseFailure) return releaseFailure;
  if (state.status === "paused") {
    return rejection(state, "INVALID_TRANSITION", "Resume before changing the selected target.");
  }
  if (isTerminal(state)) {
    return rejection(state, "TERMINAL_STATE", "Restart before changing a terminal care run.");
  }
  if (state.shoe === shoe && state.region === region) {
    return rejection(state, "NO_CHANGE", "The requested care target is already selected.");
  }
  const targetMayChange =
    !state.targetLocked &&
    ((state.stage === "compatibility" && state.status === "checking") ||
      (state.stage === "prepare" && state.status === "ready"));
  if (!targetMayChange) {
    return rejection(
      state,
      "INVALID_TRANSITION",
      "The target is locked after preparation begins. Cancel or complete this reference run, then Restart to choose another target; existing modeled values do not authorize another target.",
    );
  }
  const stage = state.stage;
  return accepted(
    state,
    {
      shoe,
      region,
      stage,
      status: activeStatusForStage(stage),
      tool: expectedToolForStage(stage),
      contact: state.contact === "release" ? "release" : "clear",
      cycleRecordedThisPass: false,
      message: `Selected ${shoe} ${region}. ${stageMessage({
        stage,
        shoe,
        region,
        tool: expectedToolForStage(stage),
        contact: "clear",
      })}`,
    },
    ["target-changed"],
  );
}

export function reduceCareState(
  state: CareState,
  eventInput: CareEvent | unknown,
): CareTransitionResult {
  const stateReason = invalidStateReason(state);
  if (stateReason !== null) return rejection(state, "INVALID_STATE", stateReason);
  const safeEvent = captureOwnDataRecord(eventInput);
  if (
    safeEvent === null ||
    typeof safeEvent.type !== "string" ||
    !isSafeRevision(safeEvent.expectedRevision) ||
    !isValidRunId(safeEvent.expectedRunId)
  ) {
    return rejection(
      state,
      "INVALID_EVENT",
      "Care events require a registered type, a safe non-negative expectedRevision, and the current expectedRunId.",
    );
  }
  if (safeEvent.expectedRunId !== state.runId) {
    return rejection(
      state,
      "STALE_RUN",
      "This event belongs to another care run. Use the current run controls and try again.",
    );
  }
  if (safeEvent.expectedRevision !== state.revision) {
    return rejection(
      state,
      "STALE_REVISION",
      `Expected revision ${safeEvent.expectedRevision}; current revision is ${state.revision}.`,
    );
  }
  if (!eventHasExactFields(safeEvent)) {
    return rejection(
      state,
      "INVALID_EVENT",
      "The care event fields do not exactly match the registered event schema.",
    );
  }

  if (
    safeEvent.type === "CONFIRM_COMPATIBILITY" ||
    safeEvent.type === "CONFIRM_PREPARATION"
  ) {
    const confirmations = captureOwnDataRecord(safeEvent.confirmations);
    if (confirmations === null) {
      return rejection(
        state,
        "INVALID_EVENT",
        "Care confirmation payloads require own enumerable data fields without accessors.",
      );
    }
    safeEvent.confirmations = confirmations;
  }
  const event = safeEvent as unknown as CareEvent;

  switch (event.type) {
    case "CONFIRM_COMPATIBILITY": {
      if (state.status !== "checking" || state.stage !== "compatibility") {
        return rejection(state, "INVALID_TRANSITION", "Compatibility can be confirmed only while checking.");
      }
      if (!validateCompatibility(event.confirmations)) {
        return rejection(state, "INVALID_EVENT", "Compatibility confirmations are malformed.");
      }
      if (
        !event.confirmations.blackSmoothFinishedLeather ||
        !event.confirmations.productLabelPermitsWaxGlazing ||
        !event.confirmations.hiddenAreaTestCompleted
      ) {
        return rejection(
          state,
          "CONFIRMATION_REQUIRED",
          "Black smooth finished leather, the registered product label, and the inconspicuous-area test must each be explicitly confirmed.",
        );
      }
      return accepted(
        state,
        { status: "ready", stage: "prepare", tool: "cotton-cloth", contact: "clear" },
        ["compatibility-confirmed", "stage-changed"],
      );
    }

    case "DECLARE_UNAVAILABLE": {
      if (state.status !== "checking" || state.stage !== "compatibility") {
        return rejection(state, "INVALID_TRANSITION", "Unavailability can be declared only while checking.");
      }
      if (!isOneOf(event.reason, CARE_UNAVAILABLE_REASONS)) {
        return rejection(state, "INVALID_EVENT", "Unavailable reason is not registered.");
      }
      const message = UNAVAILABLE_COPY[event.reason];
      return accepted(
        state,
        { status: "unavailable", contact: "clear", message, error: message },
        ["run-unavailable"],
      );
    }

    case "CONFIRM_PREPARATION": {
      if (state.status !== "ready" || state.stage !== "prepare") {
        return rejection(state, "INVALID_TRANSITION", "Preparation can be confirmed only from ready/prepare.");
      }
      if (!validatePreparation(event.confirmations)) {
        return rejection(state, "INVALID_EVENT", "Preparation confirmations are malformed.");
      }
      if (!event.confirmations.lacesAndDebrisCleared || !event.confirmations.leatherDry) {
        return rejection(
          state,
          "CONFIRMATION_REQUIRED",
          "Laces or debris and leather dryness must both be explicitly confirmed.",
        );
      }
      return accepted(
        state,
        {
          status: "active",
          stage: "apply",
          targetLocked: true,
          tool: "cotton-cloth",
          contact: "clear",
        },
        ["preparation-confirmed", "stage-changed"],
      );
    }

    case "PLACE_THIN_AMOUNT": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status !== "active" || state.stage !== "apply" || state.tool !== "cotton-cloth") {
        return rejection(state, "INVALID_TRANSITION", "A thin amount can be placed only at active/apply with the cotton cloth.");
      }
      return accepted(
        state,
        { stage: "work", tool: "cotton-cloth", cycleRecordedThisPass: false },
        ["stage-changed"],
      );
    }

    case "APPROACH": {
      if (state.status !== "active" || !(state.stage === "work" || state.stage === "finish")) {
        return rejection(state, "INVALID_TRANSITION", "Approach is available only during active work or finish.");
      }
      if (!(state.contact === "clear" || state.contact === "release")) {
        return rejection(state, "INVALID_TRANSITION", "Approach requires clear or released contact.");
      }
      if (state.tool !== expectedToolForStage(state.stage)) {
        return rejection(state, "TOOL_INCOMPATIBLE", "The current tool is incompatible with this stage.");
      }
      return accepted(state, { contact: "approach" }, ["contact-approached"]);
    }

    case "BEGIN_CONTACT": {
      if (state.status !== "active" || !(state.stage === "work" || state.stage === "finish")) {
        return rejection(state, "INVALID_TRANSITION", "Contact is available only during active work or finish.");
      }
      if (state.contact !== "approach") {
        return rejection(state, "INVALID_TRANSITION", "Contact must follow an accepted approach.");
      }
      if (state.tool !== expectedToolForStage(state.stage)) {
        return rejection(state, "TOOL_INCOMPATIBLE", "The current tool is incompatible with this stage.");
      }
      return accepted(state, { contact: "contact" }, ["contact-began"]);
    }

    case "RELEASE": {
      if (!(state.contact === "approach" || state.contact === "contact")) {
        return rejection(state, "NO_CHANGE", "Contact is already clear or released.");
      }
      const withdrewApproach = state.contact === "approach";
      return accepted(
        state,
        {
          contact: "release",
          message: withdrewApproach
            ? `The ${state.tool} approach to the ${state.shoe} ${state.region} was withdrawn before contact. No modeled care progress was added.`
            : `Contact was released from the ${state.shoe} ${state.region}. No modeled care progress was added.`,
        },
        [withdrewApproach ? "approach-withdrawn" : "contact-released"],
      );
    }

    case "RECORD_CONTACT_CYCLE": {
      if (state.status !== "active" || state.stage !== "work" || state.tool !== "cotton-cloth") {
        return rejection(state, "INVALID_TRANSITION", "A modeled contact cycle can be recorded only during active work with the cotton cloth.");
      }
      if (state.contact !== "contact") {
        return rejection(state, "CONTACT_REQUIRED", "An accepted approach and contact are required before recording a modeled cycle.");
      }
      const target = careTarget(state.shoe, state.region);
      if (state.careAmount[target] >= 1) {
        return rejection(
          state,
          "CARE_AMOUNT_DECREASE",
          "The selected modeled value is already at its finite upper bound. Release contact without recording another modeled cycle.",
        );
      }
      const nextAmount = Math.min(1, Math.round((state.careAmount[target] + 0.125) * 1000) / 1000);
      const careAmount = cloneCareAmount({
        ...state.careAmount,
        [target]: nextAmount,
      });
      return accepted(
        state,
        {
          careAmount,
          contact: "release",
          cycleRecordedThisPass: true,
          message: `Recorded one modeled contact cycle and demonstration value ${nextAmount.toFixed(3)} for the ${state.shoe} ${state.region}. This deterministic value is not measured physical coverage, a layer count, or a finish grade.`,
        },
        ["contact-released", "modeled-care-progressed"],
      );
    }

    case "CHOOSE_WATER": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status !== "active" || state.stage !== "work") {
        return rejection(state, "INVALID_TRANSITION", "Water can be chosen only from active work.");
      }
      if (event.productLabelPermitsOneDrop !== true) {
        return rejection(state, "CONFIRMATION_REQUIRED", "The registered product's current label must explicitly permit one clean-water drop.");
      }
      if (event.resistanceFelt !== true) {
        return rejection(
          state,
          "CONFIRMATION_REQUIRED",
          "Water is unavailable unless resistance is presently felt and the current registered product label permits one clean-water drop.",
        );
      }
      const target = careTarget(state.shoe, state.region);
      if (!state.cycleRecordedThisPass) {
        return rejection(state, "CONTACT_REQUIRED", "A contact cycle in the current pass is required before water.");
      }
      if (state.careAmount[target] >= 1) {
        return rejection(
          state,
          "INVALID_TRANSITION",
          "The modeled value is already at its finite upper bound. Choose Set instead of adding water for another modeled pass.",
        );
      }
      return accepted(state, { stage: "water", tool: "water-drop" }, ["stage-changed"]);
    }

    case "CONTINUE_WITH_ONE_WATER_DROP": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status !== "active" || state.stage !== "water" || state.tool !== "water-drop") {
        return rejection(state, "INVALID_TRANSITION", "One water drop can continue only from active water with the water-drop tool.");
      }
      if (event.productLabelPermitsOneDrop !== true) {
        return rejection(state, "CONFIRMATION_REQUIRED", "The registered product's current label must explicitly permit one clean-water drop.");
      }
      return accepted(
        state,
        {
          stage: "work",
          tool: "cotton-cloth",
          cycleRecordedThisPass: false,
          message: `One clean-water drop was declared for the ${state.shoe} ${state.region} under the registered product label. Continue only with another thin cotton-cloth pass.`,
        },
        ["stage-changed"],
      );
    }

    case "CHOOSE_SET": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status !== "active" || state.stage !== "work") {
        return rejection(state, "INVALID_TRANSITION", "Set can be chosen only from active work.");
      }
      if (!state.cycleRecordedThisPass) {
        return rejection(state, "CONTACT_REQUIRED", "A contact cycle in the current pass is required before set.");
      }
      return accepted(state, { stage: "set", tool: "cotton-cloth" }, ["stage-changed"]);
    }

    case "CONFIRM_WAIT_COMPLETE": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status !== "active" || state.stage !== "set") {
        return rejection(state, "INVALID_TRANSITION", "The product-directed wait can be confirmed only from active set.");
      }
      if (event.productDirectedWaitCompleted !== true) {
        return rejection(state, "CONFIRMATION_REQUIRED", "The product-directed wait requires explicit completion confirmation.");
      }
      return accepted(state, { stage: "finish", tool: "lustreur-glove" }, ["stage-changed"]);
    }

    case "FINISH_PASS_RELEASED": {
      if (
        state.status !== "active" ||
        state.stage !== "finish" ||
        state.tool !== "lustreur-glove" ||
        state.contact !== "contact"
      ) {
        return rejection(
          state,
          "CONTACT_REQUIRED",
          "Completion requires Saphir Lustreur Glove approach, light contact after the confirmed dry, and an explicit release.",
        );
      }
      if (state.careAmount[careTarget(state.shoe, state.region)] <= 0) {
        return rejection(
          state,
          "CONTACT_REQUIRED",
          "Completion requires a previously accepted modeled contact cycle for the selected target.",
        );
      }
      return accepted(
        state,
        { status: "complete", stage: "complete", contact: "release", tool: "lustreur-glove" },
        ["contact-released", "modeled-sequence-complete"],
      );
    }

    case "SELECT_SHOE": {
      if (!isOneOf(event.shoe, CARE_SHOES)) {
        return rejection(state, "INVALID_EVENT", "Selected shoe is invalid.");
      }
      return transitionTarget(state, event.shoe, state.region);
    }

    case "SELECT_REGION": {
      if (!isOneOf(event.region, CARE_REGIONS)) {
        return rejection(state, "INVALID_EVENT", "Selected region is invalid. Only toe and heel are care targets.");
      }
      return transitionTarget(state, state.shoe, event.region);
    }

    case "SET_MOTION_MODE": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (isTerminal(state)) {
        return rejection(state, "TERMINAL_STATE", "Restart before changing motion mode.");
      }
      if (!isOneOf(event.mode, CARE_MOTION_MODES)) {
        return rejection(state, "INVALID_EVENT", "Motion mode is invalid.");
      }
      if (state.requestedMotion === event.mode && state.presentedMotion === event.mode) {
        return rejection(state, "NO_CHANGE", `${event.mode} motion is already requested and presented.`);
      }
      return accepted(
        state,
        {
          requestedMotion: event.mode,
          presentedMotion: event.mode,
          message: `${event.mode} motion is now requested and presented at a contact-safe boundary. Stage, target, and modeled care values did not change.`,
        },
        ["motion-mode-changed"],
      );
    }

    case "BACK": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status === "paused") {
        return rejection(state, "INVALID_TRANSITION", "Resume before returning to a preceding safe boundary.");
      }
      if (state.status === "complete" || isTerminal(state)) {
        return rejection(state, "TERMINAL_STATE", "Restart before leaving a terminal state.");
      }
      const previous: Readonly<Partial<Record<CareStage, CareStage>>> = {
        prepare: "compatibility",
        apply: "prepare",
        work: "apply",
        water: "work",
        set: "work",
        finish: "set",
        complete: "finish",
      };
      const stage = previous[state.stage];
      if (!stage) {
        return rejection(state, "INVALID_TRANSITION", "Compatibility has no preceding care boundary.");
      }
      return accepted(
        state,
        {
          stage,
          status: activeStatusForStage(stage),
          tool: expectedToolForStage(stage),
          contact: state.contact === "release" ? "release" : "clear",
          cycleRecordedThisPass:
            stage === "apply" || state.stage === "water"
              ? false
              : state.cycleRecordedThisPass,
          message: `Returned to ${stage}. Back cannot undo material already applied; every modeled care amount was preserved.`,
        },
        ["safe-boundary-restored", "stage-changed"],
      );
    }

    case "PAUSE": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status === "paused") return rejection(state, "NO_CHANGE", "The care run is already paused.");
      if (state.status === "complete" || isTerminal(state)) {
        return rejection(state, "TERMINAL_STATE", "A complete, unavailable, or cancelled run cannot be paused.");
      }
      return accepted(
        state,
        {
          status: "paused",
          message: `Paused at ${state.stage} with contact ${state.contact}. No clock or animation can advance this run.`,
        },
        ["run-paused"],
      );
    }

    case "RESUME": {
      if (state.status !== "paused") {
        return rejection(state, "INVALID_TRANSITION", "Only a paused care run can resume.");
      }
      return accepted(
        state,
        {
          status: activeStatusForStage(state.stage),
          message: `Resumed at ${state.stage}. Contact remains ${state.contact}; use an explicit approach before contact.`,
        },
        ["run-resumed"],
      );
    }

    case "CONTACT_LOST": {
      if (
        state.status !== "active" ||
        !(state.contact === "release" || state.contact === "clear")
      ) {
        return rejection(
          state,
          "RELEASE_REQUIRED",
          "Withdraw an approach or release contact in a separate accepted revision before recording presentation loss and pausing.",
        );
      }
      const error = `The presentation became unavailable after the ${state.tool} was withdrawn or released from the ${state.shoe} ${state.region}. The run paused. Resume only after the selected target, tool, and presentation are available, then approach again.`;
      return accepted(
        state,
        { status: "paused", contact: "release", message: error, error },
        ["contact-lost", "run-paused"],
      );
    }

    case "CANCEL": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (state.status === "cancelled") return rejection(state, "NO_CHANGE", "The care run is already cancelled.");
      if (state.status === "unavailable" || state.status === "complete") {
        return rejection(state, "TERMINAL_STATE", "Restart an unavailable or complete run instead of cancelling it.");
      }
      return accepted(
        state,
        {
          status: "cancelled",
          contact: state.contact === "clear" ? "clear" : "release",
          cycleRecordedThisPass: false,
          careAmount: ZERO_CARE_AMOUNT,
          message: "The modeled care run was cancelled and its modeled values were discarded. This does not undo material already applied and makes no finish claim.",
        },
        ["run-cancelled"],
      );
    }

    case "RESTART": {
      const releaseFailure = requiresRelease(state);
      if (releaseFailure) return releaseFailure;
      if (!isValidRunId(event.runId) || event.runId === state.runId) {
        return rejection(state, "INVALID_EVENT", "Restart requires a valid new runId different from the current run.");
      }
      const motion = event.motion ?? state.requestedMotion;
      if (!isOneOf(motion, CARE_MOTION_MODES)) {
        return rejection(state, "INVALID_EVENT", "Restart motion is invalid.");
      }
      return accepted(
        state,
        {
          runId: event.runId,
          status: "checking",
          stage: "compatibility",
          shoe: "left",
          region: "toe",
          targetLocked: false,
          tool: "cotton-cloth",
          contact: "clear",
          cycleRecordedThisPass: false,
          careAmount: ZERO_CARE_AMOUNT,
          requestedMotion: motion,
          presentedMotion: motion,
          message: initialMessage("left", "toe"),
        },
        ["run-restarted"],
      );
    }

    default:
      return rejection(state, "INVALID_EVENT", `Unknown care event type: ${safeEvent.type}.`);
  }
}

function nextActionsFor(state: CareState): readonly CareAction[] {
  if (state.status === "unavailable" || state.status === "cancelled") {
    return Object.freeze(["restart"]);
  }
  if (state.status === "complete") {
    return Object.freeze(["restart"]);
  }
  if (state.status === "paused") {
    return Object.freeze(["resume", "cancel", "restart"]);
  }
  if (state.contact === "approach") {
    return Object.freeze(["begin-contact", "release"]);
  }
  if (state.contact === "contact") {
    return state.stage === "finish"
      ? Object.freeze(["finish-pass-and-release", "release"])
      : state.careAmount[careTarget(state.shoe, state.region)] < 1
        ? Object.freeze(["record-contact-cycle", "release"])
        : Object.freeze(["release"]);
  }

  if (
    state.stage === "work" &&
    state.careAmount[careTarget(state.shoe, state.region)] <= 0
  ) {
    return Object.freeze(["approach", "back", "pause", "cancel"]);
  }

  if (state.stage === "work") {
    return Object.freeze([
      "approach",
      ...(state.cycleRecordedThisPass
        ? (state.careAmount[careTarget(state.shoe, state.region)] < 1
            ? (["choose-water", "choose-set"] as const)
            : (["choose-set"] as const))
        : []),
      "back",
      "pause",
      "cancel",
    ]);
  }

  const stageActions: Readonly<Record<CareStage, readonly CareAction[]>> = {
    compatibility: ["confirm-compatibility", "declare-unavailable", "pause", "cancel"],
    prepare: ["confirm-preparation", "back", "pause", "cancel"],
    apply: ["place-thin-amount", "back", "pause", "cancel"],
    work: ["approach", "back", "pause", "cancel"],
    water: ["continue-with-one-water-drop", "back", "pause", "cancel"],
    set: ["confirm-wait-complete", "back", "pause", "cancel"],
    finish: ["approach", "back", "pause", "cancel"],
    complete: ["restart"],
  };
  return Object.freeze([...stageActions[state.stage]]);
}

function recoveryFor(state: CareState): string {
  if (state.error) return state.error;
  if (state.status === "unavailable") return "Follow the literal unavailable reason or restart with different confirmed footwear facts.";
  if (state.status === "cancelled") return "Restart creates a new in-memory run. Cancellation cannot undo physical material application.";
  if (state.status === "complete") return "Restart creates a new in-memory run. Completion reports only the modeled final release boundary and no physical outcome.";
  if (state.status === "paused") return "Resume keeps the same safe stage and modeled values. Approach must be explicit before contact resumes.";
  if (state.contact === "approach" || state.contact === "contact") {
    return "Use Release before changing stage, target, tool, mode, pausing, cancelling, or restarting.";
  }
  return "If the tool or presentation becomes unavailable during approach or contact, the run releases or withdraws, then pauses. Resume only when the selected shoe, region, tool, and presentation are confirmed again.";
}

export function careOperativeCopy(state: CareState): CareOperativeCopy {
  const reason = invalidStateReason(state);
  if (reason !== null) throw new TypeError(`Cannot create care copy from invalid state: ${reason}`);
  const canonicalStageInstruction = stageMessage(state);
  const instruction =
    state.status === "paused" ||
    state.status === "cancelled" ||
    state.status === "unavailable" ||
    state.message === canonicalStageInstruction
      ? state.message
      : `${state.message} ${canonicalStageInstruction}`;
  return Object.freeze({
    title: `Footwear care — ${state.stage}`,
    instruction,
    recovery: recoveryFor(state),
    modeledStateNotice:
      "careAmount is an in-memory modeled demonstration value. It is not measured physical coverage, a layer count, an optical grade, or a promised outcome.",
    nextActions: nextActionsFor(state),
  });
}

export function createCarePublicSnapshot(state: CareState): CarePublicSnapshot {
  const reason = invalidStateReason(state);
  if (reason !== null) throw new TypeError(`Cannot create a public snapshot from invalid state: ${reason}`);
  const target = careTarget(state.shoe, state.region);
  return Object.freeze({
    revision: state.revision,
    runId: state.runId,
    status: state.status,
    stage: state.stage,
    shoe: state.shoe,
    region: state.region,
    target,
    targetLocked: state.targetLocked,
    tool: state.tool,
    contact: state.contact,
    cycleRecordedThisPass: state.cycleRecordedThisPass,
    careAmount: cloneCareAmount(state.careAmount),
    selectedCareAmount: state.careAmount[target],
    requestedMotion: state.requestedMotion,
    presentedMotion: state.presentedMotion,
    availability:
      state.status === "unavailable" || state.status === "cancelled"
          ? "unavailable"
          : state.stage === "compatibility"
            ? "checking"
            : "available",
    message: state.message,
    error: state.error,
    operativeCopy: careOperativeCopy(state),
  });
}

export function describeCareState(state: CareState): string {
  const snapshot = createCarePublicSnapshot(state);
  const next = snapshot.operativeCopy.nextActions.join(", ") || "none";
  return [
    `Revision ${snapshot.revision}.`,
    "Run identity is held only in memory.",
    `Status ${snapshot.status}; availability ${snapshot.availability}.`,
    `Stage ${snapshot.stage}.`,
    `Selected ${snapshot.shoe} shoe, ${snapshot.region} region.`,
    `Target ${snapshot.targetLocked ? "locked for this run" : "not yet locked"}.`,
    `Tool ${snapshot.tool}; contact ${snapshot.contact}.`,
    `Current-pass contact cycle ${snapshot.cycleRecordedThisPass ? "recorded" : "not recorded"}.`,
    `Selected modeled demonstration value ${snapshot.selectedCareAmount.toFixed(3)}.`,
    `Requested motion ${snapshot.requestedMotion}; presented motion ${snapshot.presentedMotion}.`,
    `Next actions: ${next}.`,
    snapshot.message,
    snapshot.operativeCopy.modeledStateNotice,
    `Recovery: ${snapshot.operativeCopy.recovery}`,
  ].join(" ");
}
