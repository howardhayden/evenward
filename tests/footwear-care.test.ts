import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import {
  CARE_CONTACTS,
  CARE_MOTION_MODES,
  CARE_EVENT_TYPES,
  CARE_REGIONS,
  CARE_REJECTION_CODES,
  CARE_SHOES,
  CARE_STAGES,
  CARE_STATUSES,
  CARE_TARGETS,
  CARE_TOOLS,
  CARE_UNAVAILABLE_REASONS,
  careOperativeCopy,
  careTarget,
  createCarePublicSnapshot,
  createInitialCareState,
  describeCareState,
  nextCareRunId,
  reduceCareState,
  type CareEvent,
  type CareMotionMode,
  type CareState,
  type CareTransitionResult,
} from "../app/domain/footwear-care";
import {
  SHOE_FIDELITY_TIERS,
  buriedAdmiralDepthGateFromLinearLuma,
  conservativePshoe,
  flexClearcoatRoughnessFromCareAmount,
  selectRequiredShoeFidelityTier,
  selectShoePixelTier,
  toeClearcoatRoughnessFromCareAmount,
} from "../app/domain/footwear-material";
import {
  careStoreReducer,
  contactLossAtReleasedBoundary,
  createCareStore,
  pauseCareAtReleasedBoundary,
  reduceCareAtReleasedBoundary,
} from "../app/domain/footwear-care-store";

const COMPATIBILITY = {
  blackSmoothFinishedLeather: true,
  productLabelPermitsWaxGlazing: true,
  hiddenAreaTestCompleted: true,
  productProfile: "saphir-amiral-gloss",
} as const;

const PREPARATION = {
  lacesAndDebrisCleared: true,
  leatherDry: true,
} as const;

type EventWithoutRevision = CareEvent extends infer Event
  ? Event extends CareEvent
    ? Omit<Event, "expectedRevision" | "expectedRunId">
    : never
  : never;

function transition(state: CareState, event: EventWithoutRevision): CareTransitionResult {
  return reduceCareState(state, {
    ...event,
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  });
}

function accept(state: CareState, event: EventWithoutRevision): CareState {
  const result = transition(state, event);
  assert.equal(
    result.accepted,
    true,
    result.accepted ? undefined : `${result.rejection.code}: ${result.rejection.message}`,
  );
  assert.equal(result.state.revision, state.revision + 1);
  return result.state;
}

function reject(
  state: CareState,
  event: unknown,
  code: string,
): Extract<CareTransitionResult, { accepted: false }> {
  const identifiedEvent =
    typeof event === "object" &&
    event !== null &&
    "expectedRevision" in event &&
    !("expectedRunId" in event)
      ? { ...event, expectedRunId: state.runId }
      : event;
  const result = reduceCareState(state, identifiedEvent);
  assert.equal(result.accepted, false);
  if (result.accepted) throw new Error("Expected rejection.");
  assert.equal(result.rejection.code, code);
  assert.strictEqual(result.state, state);
  assert.equal(result.state.revision, state.revision);
  return result;
}

function readyState(runId = "run-ready", motion: CareMotionMode = "normal") {
  return accept(createInitialCareState(runId, motion), {
    type: "CONFIRM_COMPATIBILITY",
    confirmations: COMPATIBILITY,
  });
}

function applyState(runId = "run-apply", motion: CareMotionMode = "normal") {
  return accept(readyState(runId, motion), {
    type: "CONFIRM_PREPARATION",
    confirmations: PREPARATION,
  });
}

function workState(runId = "run-work", motion: CareMotionMode = "normal") {
  return accept(applyState(runId, motion), { type: "PLACE_THIN_AMOUNT" });
}

function contactState(runId = "run-contact", motion: CareMotionMode = "normal") {
  let state = workState(runId, motion);
  state = accept(state, { type: "APPROACH" });
  return accept(state, { type: "BEGIN_CONTACT" });
}

function workedState(
  runId = "run-worked",
  motion: CareMotionMode = "normal",
  amount = 0.25,
) {
  assert.equal(Number.isInteger(amount / 0.125), true, "fixture amount must use deterministic 0.125 cycles");
  let state = workState(runId, motion);
  for (let recorded = 0; recorded < amount; recorded += 0.125) {
    state = accept(state, { type: "APPROACH" });
    state = accept(state, { type: "BEGIN_CONTACT" });
    state = accept(state, { type: "RECORD_CONTACT_CYCLE" });
  }
  return state;
}

function completeState(runId = "run-complete", motion: CareMotionMode = "normal") {
  let state = workedState(runId, motion);
  state = accept(state, { type: "CHOOSE_SET" });
  state = accept(state, {
    type: "CONFIRM_WAIT_COMPLETE",
    productDirectedWaitCompleted: true,
  });
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "BEGIN_CONTACT" });
  return accept(state, { type: "FINISH_PASS_RELEASED" });
}

test("initial care state is complete, immutable, deterministic, and memory-only", () => {
  const state = createInitialCareState("run-001");
  assert.deepEqual({ ...state, message: "<operative-copy>" }, {
    revision: 0,
    runId: "run-001",
    status: "checking",
    stage: "compatibility",
    shoe: "left",
    region: "toe",
    targetLocked: false,
    tool: "cotton-cloth",
    contact: "clear",
    cycleRecordedThisPass: false,
    careAmount: {
      "left-toe": 0,
      "left-heel": 0,
      "right-toe": 0,
      "right-heel": 0,
    },
    requestedMotion: "normal",
    presentedMotion: "normal",
    message: "<operative-copy>",
    error: null,
  });
  assert.match(state.message, /confirm black smooth finished leather/i);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.careAmount), true);
  assert.throws(() => createInitialCareState(""), TypeError);
  assert.throws(() => createInitialCareState("spaces are not accepted"), TypeError);
});

test("exported semantic registries are runtime immutable and cannot admit unsafe members", () => {
  for (const registry of [
    CARE_STATUSES,
    CARE_STAGES,
    CARE_SHOES,
    CARE_REGIONS,
    CARE_TARGETS,
    CARE_TOOLS,
    CARE_CONTACTS,
    CARE_MOTION_MODES,
    CARE_UNAVAILABLE_REASONS,
    CARE_REJECTION_CODES,
    CARE_EVENT_TYPES,
    SHOE_FIDELITY_TIERS,
  ]) {
    assert.equal(Object.isFrozen(registry), true);
  }

  assert.throws(
    () => (CARE_MOTION_MODES as unknown as string[]).push("unsafe"),
    TypeError,
  );
  assert.throws(
    () => (CARE_SHOES as unknown as string[]).push("unsafe"),
    TypeError,
  );
  assert.equal((CARE_MOTION_MODES as readonly string[]).includes("unsafe"), false);
  assert.equal((CARE_SHOES as readonly string[]).includes("unsafe"), false);
  assert.throws(
    () => createInitialCareState("unsafe-motion", "unsafe" as CareMotionMode),
    TypeError,
  );
  assert.throws(
    () => careTarget("unsafe" as (typeof CARE_SHOES)[number], "toe"),
    TypeError,
  );
  reject(
    createInitialCareState("unsafe-shoe-event"),
    { type: "SELECT_SHOE", expectedRevision: 0, shoe: "unsafe" },
    "INVALID_EVENT",
  );
});

test("compatibility requires all three explicit confirmations and the exact profile", () => {
  for (let mask = 0; mask < 8; mask += 1) {
    const state = createInitialCareState(`compat-${mask}`);
    const confirmations = {
      ...COMPATIBILITY,
      blackSmoothFinishedLeather: Boolean(mask & 1),
      productLabelPermitsWaxGlazing: Boolean(mask & 2),
      hiddenAreaTestCompleted: Boolean(mask & 4),
    };
    const result = transition(state, {
      type: "CONFIRM_COMPATIBILITY",
      confirmations,
    });
    assert.equal(result.accepted, mask === 7);
    if (mask !== 7) {
      assert.equal(result.accepted ? "" : result.rejection.code, "CONFIRMATION_REQUIRED");
      assert.strictEqual(result.state, state);
    }
  }

  const state = createInitialCareState("compat-profile");
  reject(
    state,
    {
      type: "CONFIRM_COMPATIBILITY",
      expectedRevision: 0,
      confirmations: { ...COMPATIBILITY, productProfile: "another-product" },
    },
    "INVALID_EVENT",
  );
});

test("every registered unsupported fact fails closed to literal unavailable", () => {
  for (const reason of CARE_UNAVAILABLE_REASONS) {
    const state = createInitialCareState(`unavailable-${reason}`);
    const result = transition(state, { type: "DECLARE_UNAVAILABLE", reason });
    if (!result.accepted) throw new Error(result.rejection.message);
    assert.equal(result.accepted, true);
    assert.equal(result.state.status, "unavailable");
    assert.equal(result.state.stage, "compatibility");
    assert.equal(result.state.error, result.state.message);
    assert.match(result.state.message, /Stop here|Do not use/);
  }
});

test("preparation requires laces or debris and dryness together", () => {
  for (let mask = 0; mask < 4; mask += 1) {
    const state = readyState(`prepare-${mask}`);
    const result = transition(state, {
      type: "CONFIRM_PREPARATION",
      confirmations: {
        lacesAndDebrisCleared: Boolean(mask & 1),
        leatherDry: Boolean(mask & 2),
      },
    });
    assert.equal(result.accepted, mask === 3);
    if (mask !== 3) {
      assert.equal(result.accepted ? "" : result.rejection.code, "CONFIRMATION_REQUIRED");
      assert.strictEqual(result.state, state);
    }
  }
});

test("the legal non-water graph reaches bounded completion with one revision per event", () => {
  let state = createInitialCareState("legal-graph");
  const trace: Array<[string, string, string, string]> = [];
  const step = (event: EventWithoutRevision) => {
    const before = state;
    state = accept(state, event);
    trace.push([state.status, state.stage, state.tool, state.contact]);
    assert.equal(state.revision, before.revision + 1);
  };

  step({ type: "CONFIRM_COMPATIBILITY", confirmations: COMPATIBILITY });
  step({ type: "CONFIRM_PREPARATION", confirmations: PREPARATION });
  step({ type: "PLACE_THIN_AMOUNT" });
  step({ type: "APPROACH" });
  step({ type: "BEGIN_CONTACT" });
  step({ type: "RECORD_CONTACT_CYCLE" });
  step({ type: "CHOOSE_SET" });
  assert.match(careOperativeCopy(state).instruction, /30-minute final dry/i);
  assert.match(careOperativeCopy(state).instruction, /without brushing/i);
  step({ type: "CONFIRM_WAIT_COMPLETE", productDirectedWaitCompleted: true });
  assert.match(careOperativeCopy(state).instruction, /Saphir Lustreur Glove/i);
  step({ type: "APPROACH" });
  step({ type: "BEGIN_CONTACT" });
  step({ type: "FINISH_PASS_RELEASED" });

  assert.deepEqual(trace, [
    ["ready", "prepare", "cotton-cloth", "clear"],
    ["active", "apply", "cotton-cloth", "clear"],
    ["active", "work", "cotton-cloth", "clear"],
    ["active", "work", "cotton-cloth", "approach"],
    ["active", "work", "cotton-cloth", "contact"],
    ["active", "work", "cotton-cloth", "release"],
    ["active", "set", "cotton-cloth", "release"],
    ["active", "finish", "lustreur-glove", "release"],
    ["active", "finish", "lustreur-glove", "approach"],
    ["active", "finish", "lustreur-glove", "contact"],
    ["complete", "complete", "lustreur-glove", "release"],
  ]);
  assert.match(state.message, /modeled sequence reached its final release boundary/i);
  assert.doesNotMatch(state.message, /inspection-ready|guaranteed/i);
  assert.equal(state.contact, "release");
  assert.equal(state.cycleRecordedThisPass, true);
  assert.ok(state.careAmount[careTarget(state.shoe, state.region)] > 0);
});

test("the water branch requires a current-pass cycle, resistance, and label permission", () => {
  const noCycle = workState("water-no-cycle");
  reject(
    noCycle,
    { type: "CHOOSE_WATER", expectedRevision: noCycle.revision, productLabelPermitsOneDrop: true, resistanceFelt: true },
    "CONTACT_REQUIRED",
  );

  let state = workedState("water-branch");
  reject(
    state,
    { type: "CHOOSE_WATER", expectedRevision: state.revision, productLabelPermitsOneDrop: false, resistanceFelt: true },
    "CONFIRMATION_REQUIRED",
  );
  reject(
    state,
    { type: "CHOOSE_WATER", expectedRevision: state.revision, productLabelPermitsOneDrop: true, resistanceFelt: false },
    "CONFIRMATION_REQUIRED",
  );
  state = accept(state, { type: "CHOOSE_WATER", productLabelPermitsOneDrop: true, resistanceFelt: true });
  assert.equal(state.stage, "water");
  assert.equal(state.tool, "water-drop");
  assert.match(state.message, /one drop of clean water/i);
  assert.doesNotMatch(state.message, /\b(?:hot|warm|heat)\b/i);

  reject(
    state,
    {
      type: "CONTINUE_WITH_ONE_WATER_DROP",
      expectedRevision: state.revision,
      productLabelPermitsOneDrop: false,
    },
    "CONFIRMATION_REQUIRED",
  );
  state = accept(state, {
    type: "CONTINUE_WITH_ONE_WATER_DROP",
    productLabelPermitsOneDrop: true,
  });
  assert.equal(state.stage, "work");
  assert.equal(state.tool, "cotton-cloth");
  assert.equal(state.cycleRecordedThisPass, false);
  reject(
    state,
    { type: "CHOOSE_SET", expectedRevision: state.revision },
    "CONTACT_REQUIRED",
  );
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "BEGIN_CONTACT" });
  state = accept(state, { type: "RECORD_CONTACT_CYCLE" });
  assert.equal(state.cycleRecordedThisPass, true);
  assert.equal(accept(state, { type: "CHOOSE_SET" }).stage, "set");
});

test("historical modeled values cannot authorize a new pass", () => {
  let state = workedState("fresh-cycle", "normal", 0.25);
  state = accept(state, { type: "BACK" });
  assert.equal(state.stage, "apply");
  state = accept(state, { type: "PLACE_THIN_AMOUNT" });
  assert.equal(state.careAmount["left-toe"], 0.25);
  assert.equal(state.cycleRecordedThisPass, false);
  reject(
    state,
    { type: "CHOOSE_SET", expectedRevision: state.revision },
    "CONTACT_REQUIRED",
  );
  reject(
    state,
    {
      type: "CHOOSE_WATER",
      expectedRevision: state.revision,
      productLabelPermitsOneDrop: true,
      resistanceFelt: true,
    },
    "CONTACT_REQUIRED",
  );

  let backedFromWater = workedState("water-back-cycle", "normal", 0.25);
  const amountsBeforeWater = backedFromWater.careAmount;
  backedFromWater = accept(backedFromWater, {
    type: "CHOOSE_WATER",
    productLabelPermitsOneDrop: true,
    resistanceFelt: true,
  });
  backedFromWater = accept(backedFromWater, { type: "BACK" });
  assert.equal(backedFromWater.stage, "work");
  assert.deepEqual(backedFromWater.careAmount, amountsBeforeWater);
  assert.equal(backedFromWater.cycleRecordedThisPass, false);
  reject(
    backedFromWater,
    { type: "CHOOSE_SET", expectedRevision: backedFromWater.revision },
    "CONTACT_REQUIRED",
  );
  reject(
    backedFromWater,
    {
      type: "CHOOSE_WATER",
      expectedRevision: backedFromWater.revision,
      productLabelPermitsOneDrop: true,
      resistanceFelt: true,
    },
    "CONTACT_REQUIRED",
  );
});

test("contact phases cannot be skipped, reordered, duplicated, or timer-made", () => {
  let state = workState("contact-order");
  reject(
    state,
    { type: "BEGIN_CONTACT", expectedRevision: state.revision },
    "INVALID_TRANSITION",
  );
  reject(
    state,
    { type: "RECORD_CONTACT_CYCLE", expectedRevision: state.revision },
    "CONTACT_REQUIRED",
  );
  state = accept(state, { type: "APPROACH" });
  reject(
    state,
    { type: "APPROACH", expectedRevision: state.revision },
    "INVALID_TRANSITION",
  );
  state = accept(state, { type: "BEGIN_CONTACT" });
  reject(
    state,
    { type: "BEGIN_CONTACT", expectedRevision: state.revision },
    "INVALID_TRANSITION",
  );

  for (const type of ["TIMER_TICK", "ANIMATION_FRAME", "ANIMATION_END", "POINTER_DISTANCE"]) {
    reject(state, { type, expectedRevision: state.revision, value: 100000 }, "INVALID_EVENT");
  }
});

test("modeled care is reducer-owned, deterministic, and saturates without caller amounts", () => {
  let state = contactState("amount-deterministic");
  state = accept(state, { type: "RECORD_CONTACT_CYCLE" });
  assert.equal(state.careAmount["left-toe"], 0.125);

  for (let index = 1; index < 8; index += 1) {
    state = accept(state, { type: "APPROACH" });
    state = accept(state, { type: "BEGIN_CONTACT" });
    state = accept(state, { type: "RECORD_CONTACT_CYCLE" });
  }
  assert.equal(state.careAmount["left-toe"], 1);
  assert.deepEqual(createCarePublicSnapshot(state).operativeCopy.nextActions, [
    "approach",
    "choose-set",
    "back",
    "pause",
    "cancel",
  ]);
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "BEGIN_CONTACT" });
  assert.deepEqual(createCarePublicSnapshot(state).operativeCopy.nextActions, ["release"]);
  reject(
    state,
    { type: "RECORD_CONTACT_CYCLE", expectedRevision: state.revision },
    "CARE_AMOUNT_DECREASE",
  );
  reject(
    contactState("amount-extra-field"),
    { type: "RECORD_CONTACT_CYCLE", expectedRevision: 5, careAmount: 1 },
    "INVALID_EVENT",
  );
});

test("a contact cycle changes only the selected rigid region", () => {
  let state = createInitialCareState("region-isolation");
  state = accept(state, { type: "SELECT_SHOE", shoe: "right" });
  state = accept(state, { type: "SELECT_REGION", region: "heel" });
  state = accept(state, { type: "CONFIRM_COMPATIBILITY", confirmations: COMPATIBILITY });
  state = accept(state, { type: "CONFIRM_PREPARATION", confirmations: PREPARATION });
  state = accept(state, { type: "PLACE_THIN_AMOUNT" });
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "BEGIN_CONTACT" });
  state = accept(state, { type: "RECORD_CONTACT_CYCLE" });

  assert.deepEqual(state.careAmount, {
    "left-toe": 0,
    "left-heel": 0,
    "right-toe": 0,
    "right-heel": 0.125,
  });

  reject(
    state,
    { type: "SELECT_REGION", expectedRevision: state.revision, region: "flex" },
    "INVALID_EVENT",
  );
});

test("target, tool, mode, pause, cancel, and restart require release during contact", () => {
  const state = contactState("release-order");
  const attempts = [
    { type: "SELECT_SHOE", expectedRevision: state.revision, shoe: "right" },
    { type: "SELECT_REGION", expectedRevision: state.revision, region: "heel" },
    { type: "SET_MOTION_MODE", expectedRevision: state.revision, mode: "still" },
    { type: "PAUSE", expectedRevision: state.revision },
    { type: "CANCEL", expectedRevision: state.revision },
    { type: "RESTART", expectedRevision: state.revision, runId: "release-order-next" },
    { type: "CHOOSE_SET", expectedRevision: state.revision },
  ];
  for (const event of attempts) reject(state, event, "RELEASE_REQUIRED");

  const releasedResult = transition(state, { type: "RELEASE" });
  if (!releasedResult.accepted) throw new Error(releasedResult.rejection.message);
  assert.equal(releasedResult.accepted, true);
  assert.deepEqual(releasedResult.effects, ["contact-released"]);

  const pausedResult = transition(releasedResult.state, { type: "PAUSE" });
  if (!pausedResult.accepted) throw new Error(pausedResult.rejection.message);
  assert.equal(pausedResult.accepted, true);
  assert.deepEqual(pausedResult.effects, ["run-paused"]);
  assert.equal(pausedResult.state.contact, "release");
});

test("contact loss exposes ordered release and pause effects without fabricating progress", () => {
  const state = contactState("contact-loss");
  reject(
    state,
    { type: "CONTACT_LOST", expectedRevision: state.revision },
    "RELEASE_REQUIRED",
  );
  const released = transition(state, { type: "RELEASE" });
  if (!released.accepted) throw new Error(released.rejection.message);
  assert.deepEqual(released.effects, ["contact-released"]);
  const lost = transition(released.state, { type: "CONTACT_LOST" });
  if (!lost.accepted) throw new Error(lost.rejection.message);
  assert.deepEqual(lost.effects, ["contact-lost", "run-paused"]);
  assert.equal(lost.state.status, "paused");
  assert.equal(lost.state.contact, "release");
  assert.equal(lost.state.revision, state.revision + 2);
  assert.deepEqual(lost.state.careAmount, state.careAmount);
  assert.match(lost.state.error ?? "", /Resume only after.*then approach again/i);
  assert.deepEqual(contactLossAtReleasedBoundary(state), lost.state);
});

test("pause freezes semantics, resume preserves them, and cancel discards modeled values", () => {
  let state = workedState("pause-cancel");
  const amounts = state.careAmount;
  state = accept(state, { type: "PAUSE" });
  assert.equal(state.status, "paused");

  for (const type of ["TIMER_TICK", "ANIMATION_FRAME", "POINTER_DISTANCE"]) {
    reject(state, { type, expectedRevision: state.revision }, "INVALID_EVENT");
  }
  assert.deepEqual(state.careAmount, amounts);
  state = accept(state, { type: "RESUME" });
  assert.equal(state.status, "active");
  assert.deepEqual(state.careAmount, amounts);

  state = accept(state, { type: "CANCEL" });
  assert.equal(state.status, "cancelled");
  assert.equal(state.cycleRecordedThisPass, false);
  assert.deepEqual(state.careAmount, {
    "left-toe": 0,
    "left-heel": 0,
    "right-toe": 0,
    "right-heel": 0,
  });
  assert.match(state.message, /does not undo material already applied/i);
  reject(
    state,
    { type: "RESUME", expectedRevision: state.revision },
    "INVALID_TRANSITION",
  );
});

test("restart creates a fresh run while preserving global monotonic revision", () => {
  const old = workedState("restart-old");
  const result = transition(old, { type: "RESTART", runId: "restart-new", motion: "still" });
  if (!result.accepted) throw new Error(result.rejection.message);
  assert.equal(result.accepted, true);
  assert.equal(result.state.runId, "restart-new");
  assert.equal(result.state.revision, old.revision + 1);
  assert.equal(result.state.stage, "compatibility");
  assert.equal(result.state.status, "checking");
  assert.equal(result.state.requestedMotion, "still");
  assert.equal(result.state.presentedMotion, "still");
  assert.ok(CARE_TARGETS.every((target) => result.state.careAmount[target] === 0));

  reject(
    result.state,
    { type: "CHOOSE_SET", expectedRevision: old.revision },
    "STALE_REVISION",
  );
  reject(
    result.state,
    { type: "RESTART", expectedRevision: result.state.revision, runId: "restart-new" },
    "INVALID_EVENT",
  );
});

test("generated run identities are bounded, distinct, and stale-safe across A to B to A", () => {
  const longRunId = `x${"y".repeat(127)}`;
  const generated = nextCareRunId(longRunId, 0);
  assert.match(generated, /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);
  assert.notEqual(generated, longRunId);
  assert.notEqual(nextCareRunId("care-a:1", 0), "care-a:1");

  const a0 = createInitialCareState("A");
  const staleAEvent = {
    type: "DECLARE_UNAVAILABLE",
    expectedRevision: a0.revision,
    expectedRunId: a0.runId,
    reason: "unknown-material",
  } as const;
  const b = accept(a0, { type: "RESTART", runId: "B" });
  const a2 = accept(b, { type: "RESTART", runId: "A" });
  const replay = reduceCareState(a2, staleAEvent);
  assert.equal(replay.accepted, false);
  if (replay.accepted) throw new Error("Expected stale A-event rejection.");
  assert.equal(replay.rejection.code, "STALE_REVISION");
  assert.strictEqual(replay.state, a2);
});

test("run identities cannot inject outcome language into descriptions or stale-run errors", () => {
  const state = createInitialCareState("restored");
  const description = describeCareState(state);
  assert.doesNotMatch(description, /\brestored\b|inspection[- ]ready/i);
  assert.match(description, /Run identity is held only in memory/i);

  const result = reduceCareState(state, {
    type: "PAUSE",
    expectedRevision: state.revision,
    expectedRunId: "inspection-ready",
  });
  assert.equal(result.accepted, false);
  if (result.accepted) throw new Error("Expected stale-run rejection.");
  assert.equal(result.rejection.code, "STALE_RUN");
  assert.doesNotMatch(
    result.rejection.message,
    /\brestored\b|inspection[- ]ready|guaranteed|protected|undamaged/i,
  );
  assert.match(result.rejection.message, /another (?:care )?run/i);
});

test("Complete is terminal for every registered event except Restart", () => {
  const state = completeState("complete-terminal-matrix");
  const attempts: EventWithoutRevision[] = [
    { type: "CONFIRM_COMPATIBILITY", confirmations: COMPATIBILITY },
    { type: "DECLARE_UNAVAILABLE", reason: "unknown-material" },
    { type: "CONFIRM_PREPARATION", confirmations: PREPARATION },
    { type: "PLACE_THIN_AMOUNT" },
    { type: "APPROACH" },
    { type: "BEGIN_CONTACT" },
    { type: "RELEASE" },
    { type: "RECORD_CONTACT_CYCLE" },
    { type: "CHOOSE_WATER", productLabelPermitsOneDrop: true, resistanceFelt: true },
    { type: "CONTINUE_WITH_ONE_WATER_DROP", productLabelPermitsOneDrop: true },
    { type: "CHOOSE_SET" },
    { type: "CONFIRM_WAIT_COMPLETE", productDirectedWaitCompleted: true },
    { type: "FINISH_PASS_RELEASED" },
    { type: "SELECT_SHOE", shoe: "right" },
    { type: "SELECT_REGION", region: "heel" },
    { type: "SET_MOTION_MODE", mode: "still" },
    { type: "BACK" },
    { type: "PAUSE" },
    { type: "RESUME" },
    { type: "CONTACT_LOST" },
    { type: "CANCEL" },
  ];
  for (const event of attempts) {
    const result = transition(state, event);
    assert.equal(result.accepted, false, event.type);
    assert.strictEqual(result.state, state, event.type);
  }
  assert.equal(
    transition(state, { type: "RESTART", runId: "complete-terminal-next" }).accepted,
    true,
  );
});

test("stale, missing, malformed, and unknown events never mutate state", () => {
  const state = workState("strict-events");
  reject(
    state,
    {
      type: "APPROACH",
      expectedRevision: state.revision,
      expectedRunId: "prior-run-with-matching-revision",
    },
    "STALE_RUN",
  );
  reject(
    state,
    { type: "APPROACH", expectedRevision: state.revision - 1 },
    "STALE_REVISION",
  );
  reject(state, { type: "APPROACH" }, "INVALID_EVENT");
  reject(state, { type: "APPROACH", expectedRevision: Number.NaN }, "INVALID_EVENT");
  reject(state, { type: "NOT_A_CARE_EVENT", expectedRevision: state.revision }, "INVALID_EVENT");
  reject(
    state,
    {
      type: "APPROACH",
      expectedRevision: state.revision,
      expectedRunId: state.runId,
      semanticShortcut: true,
    },
    "INVALID_EVENT",
  );
  const inheritedIdentity = Object.assign(
    Object.create({
      expectedRevision: state.revision,
      expectedRunId: state.runId,
    }) as Record<string, unknown>,
    { type: "SELECT_SHOE", shoe: "right" },
  );
  reject(state, inheritedIdentity, "INVALID_EVENT");

  const nonEnumerableExtra: Record<PropertyKey, unknown> = {
    type: "APPROACH",
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  };
  Object.defineProperty(nonEnumerableExtra, "semanticShortcut", {
    value: true,
    enumerable: false,
  });
  reject(state, nonEnumerableExtra, "INVALID_EVENT");

  const symbolExtra: Record<PropertyKey, unknown> = {
    type: "APPROACH",
    expectedRevision: state.revision,
    expectedRunId: state.runId,
    [Symbol("semanticShortcut")]: true,
  };
  reject(state, symbolExtra, "INVALID_EVENT");
  reject(state, null, "INVALID_EVENT");
});

test("accessor, proxy, and nested-accessor events reject without executing traps", () => {
  const state = createInitialCareState("hostile-events");
  let getterExecuted = false;
  const accessorEvent: Record<string, unknown> = {
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  };
  Object.defineProperty(accessorEvent, "type", {
    enumerable: true,
    get() {
      getterExecuted = true;
      throw new Error("event getter must not execute");
    },
  });
  const accessorResult = reduceCareState(state, accessorEvent);
  assert.equal(accessorResult.accepted, false);
  if (accessorResult.accepted) throw new Error("Expected accessor rejection.");
  assert.equal(accessorResult.rejection.code, "INVALID_EVENT");
  assert.equal(getterExecuted, false);

  const proxyEvent = new Proxy(Object.create(null) as Record<string, unknown>, {
    ownKeys() {
      throw new Error("hostile ownKeys");
    },
  });
  const proxyResult = reduceCareState(state, proxyEvent);
  assert.equal(proxyResult.accepted, false);
  if (proxyResult.accepted) throw new Error("Expected proxy rejection.");
  assert.equal(proxyResult.rejection.code, "INVALID_EVENT");

  let nestedGetterExecuted = false;
  const confirmations: Record<string, unknown> = { ...COMPATIBILITY };
  Object.defineProperty(confirmations, "productProfile", {
    enumerable: true,
    get() {
      nestedGetterExecuted = true;
      throw new Error("nested getter must not execute");
    },
  });
  const nestedResult = reduceCareState(state, {
    type: "CONFIRM_COMPATIBILITY",
    expectedRevision: state.revision,
    expectedRunId: state.runId,
    confirmations,
  });
  assert.equal(nestedResult.accepted, false);
  if (nestedResult.accepted) throw new Error("Expected nested accessor rejection.");
  assert.equal(nestedResult.rejection.code, "INVALID_EVENT");
  assert.equal(nestedGetterExecuted, false);
});

test("the functional care store rejects two commits stamped from one snapshot", () => {
  const state = workState("store-cas");
  const firstEvent = {
    type: "APPROACH",
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  } as const;
  const secondEvent = {
    type: "PAUSE",
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  } as const;
  const afterFirst = careStoreReducer(createCareStore(state), {
    kind: "event",
    event: firstEvent,
  });
  const afterSecond = careStoreReducer(afterFirst, {
    kind: "event",
    event: secondEvent,
  });
  assert.equal(afterFirst.state.contact, "approach");
  assert.equal(afterFirst.transitionTrace.length, 1);
  assert.strictEqual(afterSecond.state, afterFirst.state);
  assert.match(afterSecond.rejection ?? "", /Expected revision/);
  assert.deepEqual(afterSecond.transitionTrace, []);
});

test("route or visibility pause exposes release then pause as two revisions", () => {
  const contact = contactState("store-boundary");
  const store = careStoreReducer(createCareStore(contact), {
    kind: "pause-at-release",
  });
  const paused = store.state;
  assert.equal(paused.status, "paused");
  assert.equal(paused.contact, "release");
  assert.equal(paused.revision, contact.revision + 2);
  assert.deepEqual(
    store.transitionTrace.map(({ revision, status, contact: phase, effects }) => ({
      revision,
      status,
      contact: phase,
      effects,
    })),
    [
      {
        revision: contact.revision + 1,
        status: "active",
        contact: "release",
        effects: ["contact-released"],
      },
      {
        revision: contact.revision + 2,
        status: "paused",
        contact: "release",
        effects: ["run-paused"],
      },
    ],
  );
});

test("active-contact Cancel exposes release then cancellation as two revisions", () => {
  let contact = workedState("store-cancel-boundary", "normal", 0.25);
  const beforeAmounts = contact.careAmount;
  contact = accept(contact, { type: "APPROACH" });
  contact = accept(contact, { type: "BEGIN_CONTACT" });

  const store = careStoreReducer(createCareStore(contact), {
    kind: "cancel-at-release",
  });

  assert.deepEqual(
    store.transitionTrace.map(
      ({ revision, status, contact: phase, effects }) => ({
        revision,
        status,
        contact: phase,
        effects,
      }),
    ),
    [
      {
        revision: contact.revision + 1,
        status: "active",
        contact: "release",
        effects: ["contact-released"],
      },
      {
        revision: contact.revision + 2,
        status: "cancelled",
        contact: "release",
        effects: ["run-cancelled"],
      },
    ],
  );
  assert.equal(Object.isFrozen(store.transitionTrace), true);
  assert.ok(store.transitionTrace.every(Object.isFrozen));
  assert.equal(store.state.revision, contact.revision + 2);
  assert.equal(store.state.status, "cancelled");
  assert.equal(store.state.contact, "release");
  assert.equal(store.state.cycleRecordedThisPass, false);
  assert.notDeepEqual(beforeAmounts, store.state.careAmount);
  assert.ok(CARE_TARGETS.every((target) => store.state.careAmount[target] === 0));
});

test("released-boundary helpers cover approach, clear, terminal, and stale callbacks", () => {
  const work = workState("boundary-matrix");
  const approach = accept(work, { type: "APPROACH" });
  const pausedFromApproach = pauseCareAtReleasedBoundary(approach);
  assert.equal(pausedFromApproach.contact, "release");
  assert.equal(pausedFromApproach.status, "paused");
  assert.equal(pausedFromApproach.revision, approach.revision + 2);

  const reducedFromApproach = reduceCareAtReleasedBoundary(approach);
  assert.equal(reducedFromApproach.contact, "release");
  assert.equal(reducedFromApproach.presentedMotion, "reduced");
  assert.equal(reducedFromApproach.revision, approach.revision + 2);

  const reducedStore = careStoreReducer(createCareStore(approach), {
    kind: "reduce-at-release",
  });
  assert.deepEqual(
    reducedStore.transitionTrace.map(
      ({ revision, contact, presentedMotion, effects }) => ({
        revision,
        contact,
        presentedMotion,
        effects,
      }),
    ),
    [
      {
        revision: approach.revision + 1,
        contact: "release",
        presentedMotion: "normal",
        effects: ["approach-withdrawn"],
      },
      {
        revision: approach.revision + 2,
        contact: "release",
        presentedMotion: "reduced",
        effects: ["motion-mode-changed"],
      },
    ],
  );

  const reducedFromClear = reduceCareAtReleasedBoundary(work);
  assert.equal(reducedFromClear.contact, "clear");
  assert.equal(reducedFromClear.presentedMotion, "reduced");
  assert.equal(reducedFromClear.revision, work.revision + 1);
  assert.strictEqual(reduceCareAtReleasedBoundary(reducedFromClear), reducedFromClear);

  const complete = completeState("boundary-complete");
  assert.strictEqual(pauseCareAtReleasedBoundary(complete), complete);
  assert.strictEqual(reduceCareAtReleasedBoundary(complete), complete);

  const pausedContact = pauseCareAtReleasedBoundary(contactState("stale-renderer-loss"));
  assert.strictEqual(contactLossAtReleasedBoundary(pausedContact), pausedContact);
});

test("contact loss during approach withdraws then pauses without progress", () => {
  const approach = accept(workState("loss-approach"), { type: "APPROACH" });
  const lost = contactLossAtReleasedBoundary(approach);
  assert.equal(lost.status, "paused");
  assert.equal(lost.contact, "release");
  assert.equal(lost.revision, approach.revision + 2);
  assert.deepEqual(lost.careAmount, approach.careAmount);
});

test("invalid canonical snapshots fail before any event can execute", () => {
  const valid = workState("invalid-snapshot");
  const withExtra = { ...valid, semanticShortcut: true } as unknown as CareState;
  reject(
    withExtra,
    { type: "APPROACH", expectedRevision: valid.revision },
    "INVALID_STATE",
  );

  const invalidAmount = {
    ...valid,
    careAmount: { ...valid.careAmount, "left-toe": Number.NaN },
  } as CareState;
  reject(
    invalidAmount,
    { type: "APPROACH", expectedRevision: valid.revision },
    "INVALID_STATE",
  );

  const incompatible = { ...valid, stage: "water", tool: "cotton-cloth" } as CareState;
  reject(
    incompatible,
    { type: "APPROACH", expectedRevision: valid.revision },
    "INVALID_STATE",
  );

  const forgedComplete = {
    ...createInitialCareState("forged-complete"),
    status: "complete",
    stage: "complete",
    tool: "lustreur-glove",
    contact: "release",
  } as CareState;
  reject(
    forgedComplete,
    { type: "RESTART", expectedRevision: 0, runId: "forged-next" },
    "INVALID_STATE",
  );
  assert.throws(() => createCarePublicSnapshot(forgedComplete), /opaque value issued/);

  const forgedCancelled = {
    ...workedState("forged-cancelled-source"),
    status: "cancelled",
  } as CareState;
  reject(
    forgedCancelled,
    {
      type: "RESTART",
      expectedRevision: forgedCancelled.revision,
      runId: "forged-cancelled-next",
    },
    "INVALID_STATE",
  );
  assert.throws(
    () => createCarePublicSnapshot(forgedCancelled),
    /opaque value issued/,
  );

  const forgedMessage = {
    ...createInitialCareState("forged-message"),
    message: "Apply bleach now.",
  } as CareState;
  assert.throws(() => careOperativeCopy(forgedMessage), /opaque value issued/);
});

test("hostile and revoked state proxies fail closed without escaping exceptions", () => {
  const issued = workState("hostile-state");
  const hostile = new Proxy(issued, {
    ownKeys() {
      throw new Error("state ownKeys trap");
    },
  }) as CareState;
  const hostileResult = reduceCareState(hostile, {
    type: "APPROACH",
    expectedRevision: issued.revision,
    expectedRunId: issued.runId,
  });
  assert.equal(hostileResult.accepted, false);
  if (hostileResult.accepted) throw new Error("Expected hostile-state rejection.");
  assert.equal(hostileResult.rejection.code, "INVALID_STATE");
  assert.strictEqual(hostileResult.state, hostile);
  assert.throws(
    () => createCarePublicSnapshot(hostile),
    /could not be inspected as an own-data semantic record/,
  );

  const revocable = Proxy.revocable(issued, {});
  revocable.revoke();
  const revoked = revocable.proxy as CareState;
  const revokedResult = reduceCareState(revoked, {
    type: "APPROACH",
    expectedRevision: issued.revision,
    expectedRunId: issued.runId,
  });
  assert.equal(revokedResult.accepted, false);
  if (revokedResult.accepted) throw new Error("Expected revoked-state rejection.");
  assert.equal(revokedResult.rejection.code, "INVALID_STATE");
  assert.strictEqual(revokedResult.state, revoked);
  assert.throws(
    () => createCarePublicSnapshot(revoked),
    /could not be inspected as an own-data semantic record/,
  );
});

test("cycle proof cannot be forged or carried into incompatible stages", () => {
  const initial = createInitialCareState("forged-cycle");
  for (const forged of [
    { ...initial, cycleRecordedThisPass: true },
    {
      ...initial,
      status: "active",
      stage: "apply",
      careAmount: { ...initial.careAmount, "left-toe": 0.125 },
      cycleRecordedThisPass: true,
    },
  ] as CareState[]) {
    reject(
      forged,
      { type: "CHOOSE_SET", expectedRevision: forged.revision },
      "INVALID_STATE",
    );
  }
});

test("Back follows declared safe predecessors, preserves every amount, and states its limit", () => {
  let state = workedState("back-monotonic");
  state = accept(state, { type: "CHOOSE_SET" });
  state = accept(state, {
    type: "CONFIRM_WAIT_COMPLETE",
    productDirectedWaitCompleted: true,
  });
  const amounts = { ...state.careAmount };
  const expectedStages = ["set", "work", "apply", "prepare", "compatibility"];
  for (const expectedStage of expectedStages) {
    state = accept(state, { type: "BACK" });
    assert.equal(state.stage, expectedStage);
    assert.deepEqual(state.careAmount, amounts);
    assert.match(state.message, /cannot undo material already applied/i);
  }
  reject(
    state,
    { type: "BACK", expectedRevision: state.revision },
    "INVALID_TRANSITION",
  );

  const complete = completeState("back-terminal");
  reject(
    complete,
    { type: "BACK", expectedRevision: complete.revision },
    "TERMINAL_STATE",
  );
});

test("target selection locks after preparation while early selection remains available", () => {
  let early = createInitialCareState("target-early");
  early = accept(early, { type: "SELECT_SHOE", shoe: "right" });
  early = accept(early, { type: "SELECT_REGION", region: "heel" });
  assert.equal(early.shoe, "right");
  assert.equal(early.region, "heel");

  const state = workedState("target-boundary");
  const amounts = { ...state.careAmount };
  reject(
    state,
    { type: "SELECT_SHOE", expectedRevision: state.revision, shoe: "right" },
    "INVALID_TRANSITION",
  );
  reject(
    state,
    { type: "SELECT_REGION", expectedRevision: state.revision, region: "heel" },
    "INVALID_TRANSITION",
  );
  assert.deepEqual(state.careAmount, amounts);

  let backed = accept(state, { type: "BACK" });
  backed = accept(backed, { type: "BACK" });
  assert.equal(backed.stage, "prepare");
  assert.equal(backed.targetLocked, true);
  reject(
    backed,
    { type: "SELECT_REGION", expectedRevision: backed.revision, region: "heel" },
    "INVALID_TRANSITION",
  );
  backed = accept(backed, { type: "BACK" });
  assert.equal(backed.stage, "compatibility");
  assert.equal(backed.targetLocked, true);
  reject(
    backed,
    { type: "SELECT_SHOE", expectedRevision: backed.revision, shoe: "right" },
    "INVALID_TRANSITION",
  );
});

test("mode transactions are atomic only after a contact-safe release boundary", () => {
  let state = contactState("mode-order");
  reject(
    state,
    { type: "SET_MOTION_MODE", expectedRevision: state.revision, mode: "still" },
    "RELEASE_REQUIRED",
  );
  state = accept(state, { type: "RELEASE" });
  const before = state;
  state = accept(state, { type: "SET_MOTION_MODE", mode: "still" });
  assert.equal(state.revision, before.revision + 1);
  assert.equal(state.requestedMotion, "still");
  assert.equal(state.presentedMotion, "still");
  assert.equal(state.stage, before.stage);
  assert.deepEqual(state.careAmount, before.careAmount);
  assert.equal(state.contact, "release");
});

test("Normal, Reduced, and Still share identical semantic progression", () => {
  const projected = CARE_MOTION_MODES.map((motion) => {
    const state = completeState(`mode-${motion}`, motion);
    return {
      status: state.status,
      stage: state.stage,
      shoe: state.shoe,
      region: state.region,
      tool: state.tool,
      contact: state.contact,
      careAmount: state.careAmount,
    };
  });
  assert.deepEqual(projected[0], projected[1]);
  assert.deepEqual(projected[1], projected[2]);
});

function referenceFloat32Mix(start: number, end: number, amount: number): number {
  const start32 = Math.fround(start);
  const end32 = Math.fround(end);
  const amount32 = Math.fround(amount);
  return Math.fround(
    start32 + Math.fround(Math.fround(end32 - start32) * amount32),
  );
}

test("toe and flex roughness conversions use the declared float32 operation order", () => {
  for (const amount of [0, 0.125, 0.5, 0.75, 1]) {
    const amount32 = Math.fround(amount);
    const toeExpected = referenceFloat32Mix(
      0.005,
      0.012,
      Math.fround(amount32 * amount32),
    );
    const flexExpected = referenceFloat32Mix(0.05, 0.11, amount32);
    assert.equal(toeClearcoatRoughnessFromCareAmount(amount), toeExpected);
    assert.equal(flexClearcoatRoughnessFromCareAmount(amount), flexExpected);
  }
});

test("roughness conversion rejects every invalid authority value rather than clamping", () => {
  for (const amount of [
    -Number.EPSILON,
    1 + Number.EPSILON,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    null,
    "0.5",
  ]) {
    assert.throws(
      () => toeClearcoatRoughnessFromCareAmount(amount as number),
      RangeError,
    );
    assert.throws(
      () => flexClearcoatRoughnessFromCareAmount(amount as number),
      RangeError,
    );
  }
});

test("buried Admiral absorption gate is active for the actual linear black base", () => {
  const linearBase = new THREE.Color(0x0b0b0b);
  const linearLuma =
    linearBase.r * 0.2126 + linearBase.g * 0.7152 + linearBase.b * 0.0722;
  const gate = buriedAdmiralDepthGateFromLinearLuma(linearLuma);
  assert.ok(gate > 0 && gate <= 1, `expected active gate, received ${gate}`);
  const lowDensityRed = Math.exp(-0.004) * gate + (1 - gate);
  const highDensityRed = Math.exp(-0.01) * gate + (1 - gate);
  assert.ok(highDensityRed < lowDensityRed);
  for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => buriedAdmiralDepthGateFromLinearLuma(invalid), RangeError);
  }
});

test("Pshoe boundaries own exact SF0–SF4 intervals", () => {
  const fixtures: Array<[number, string]> = [
    [0, "SF0"],
    [95.999, "SF0"],
    [96, "SF1"],
    [255.999, "SF1"],
    [256, "SF2"],
    [639.999, "SF2"],
    [640, "SF3"],
    [1199.999, "SF3"],
    [1200, "SF4"],
    [Number.MAX_VALUE, "SF4"],
  ];
  for (const [pshoe, tier] of fixtures) assert.equal(selectShoePixelTier(pshoe), tier);

  for (const invalid of [-Number.EPSILON, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => selectShoePixelTier(invalid), RangeError);
  }
});

test("conservative Pshoe uses the maximum physical presentation extent", () => {
  assert.equal(conservativePshoe([95, 640, 256, 1200]), 1200);
  assert.equal(conservativePshoe([0]), 0);
  assert.throws(() => conservativePshoe([]), RangeError);
  assert.throws(() => conservativePshoe([96, Number.NaN]), RangeError);
  assert.throws(() => conservativePshoe([96, -1]), RangeError);
});

test("required fidelity is the maximum of pixel, roughness, and inspection SF3", () => {
  for (const roughnessTier of SHOE_FIDELITY_TIERS) {
    const expected = SHOE_FIDELITY_TIERS[
      Math.max(
        SHOE_FIDELITY_TIERS.indexOf("SF1"),
        SHOE_FIDELITY_TIERS.indexOf(roughnessTier),
      )
    ];
    assert.equal(
      selectRequiredShoeFidelityTier({
        pshoe: 96,
        roughnessTier,
        inspectionActive: false,
      }),
      expected,
    );
  }

  assert.equal(
    selectRequiredShoeFidelityTier({
      pshoe: 95,
      roughnessTier: "SF0",
      inspectionActive: true,
    }),
    "SF3",
  );
  assert.equal(
    selectRequiredShoeFidelityTier({
      pshoe: 1200,
      roughnessTier: "SF0",
      inspectionActive: true,
    }),
    "SF4",
  );
  assert.equal(
    selectRequiredShoeFidelityTier({
      pshoe: 256,
      roughnessTier: "SF4",
      inspectionActive: true,
    }),
    "SF4",
  );
});

test("public snapshot and operative copy expose one immutable revision and modeled semantics", () => {
  const state = workedState("public-snapshot", "reduced", 0.375);
  const snapshot = createCarePublicSnapshot(state);
  assert.equal(snapshot.revision, state.revision);
  assert.equal(snapshot.runId, state.runId);
  assert.equal(snapshot.target, "left-toe");
  assert.equal(snapshot.selectedCareAmount, 0.375);
  assert.equal(snapshot.shoe, "left");
  assert.equal(snapshot.region, "toe");
  assert.equal(snapshot.tool, "cotton-cloth");
  assert.equal(snapshot.contact, "release");
  assert.equal(snapshot.stage, "work");
  assert.equal(snapshot.availability, "available");
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.careAmount), true);
  assert.equal(Object.isFrozen(snapshot.operativeCopy), true);
  assert.equal(Object.isFrozen(snapshot.operativeCopy.nextActions), true);
  assert.match(snapshot.operativeCopy.modeledStateNotice, /modeled demonstration value/i);
  assert.match(snapshot.operativeCopy.modeledStateNotice, /not measured physical coverage/i);

  const copy = careOperativeCopy(state);
  assert.match(copy.instruction, new RegExp(state.message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(copy.instruction, /working the left toe with a cotton cloth/i);
  assert.match(copy.recovery, /releases or withdraws/i);
  assert.match(copy.recovery, /then pauses/i);

  const description = describeCareState(state);
  for (const expected of [
    `Revision ${state.revision}`,
    "Status active",
    "Stage work",
    "Selected left shoe, toe region",
    "Tool cotton-cloth; contact release",
    "Selected modeled demonstration value 0.375",
    "Requested motion reduced; presented motion reduced",
    "Next actions:",
  ]) {
    assert.match(description, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("availability distinguishes checking from available and unavailable", () => {
  assert.equal(
    createCarePublicSnapshot(createInitialCareState("availability-checking")).availability,
    "checking",
  );
  assert.equal(createCarePublicSnapshot(readyState("availability-ready")).availability, "available");
  const unavailable = accept(createInitialCareState("availability-unavailable"), {
    type: "DECLARE_UNAVAILABLE",
    reason: "unknown-material",
  });
  assert.equal(createCarePublicSnapshot(unavailable).availability, "unavailable");
});

type ModelEventBody = Readonly<Record<string, unknown> & { type: string }>;

const MODEL_EVENT_TYPES = CARE_EVENT_TYPES;

function modelEventBodies(state: CareState): ModelEventBody[] {
  const events: ModelEventBody[] = [];
  for (let mask = 0; mask < 8; mask += 1) {
    events.push({
      type: "CONFIRM_COMPATIBILITY",
      confirmations: {
        ...COMPATIBILITY,
        blackSmoothFinishedLeather: Boolean(mask & 1),
        productLabelPermitsWaxGlazing: Boolean(mask & 2),
        hiddenAreaTestCompleted: Boolean(mask & 4),
      },
    });
  }
  for (const reason of CARE_UNAVAILABLE_REASONS) {
    events.push({ type: "DECLARE_UNAVAILABLE", reason });
  }
  for (let mask = 0; mask < 4; mask += 1) {
    events.push({
      type: "CONFIRM_PREPARATION",
      confirmations: {
        lacesAndDebrisCleared: Boolean(mask & 1),
        leatherDry: Boolean(mask & 2),
      },
    });
  }
  events.push(
    { type: "PLACE_THIN_AMOUNT" },
    { type: "APPROACH" },
    { type: "BEGIN_CONTACT" },
    { type: "RELEASE" },
    { type: "RECORD_CONTACT_CYCLE" },
    {
      type: "CHOOSE_WATER",
      productLabelPermitsOneDrop: true,
      resistanceFelt: true,
    },
    {
      type: "CHOOSE_WATER",
      productLabelPermitsOneDrop: false,
      resistanceFelt: true,
    },
    {
      type: "CHOOSE_WATER",
      productLabelPermitsOneDrop: true,
      resistanceFelt: false,
    },
    {
      type: "CONTINUE_WITH_ONE_WATER_DROP",
      productLabelPermitsOneDrop: true,
    },
    {
      type: "CONTINUE_WITH_ONE_WATER_DROP",
      productLabelPermitsOneDrop: false,
    },
    { type: "CHOOSE_SET" },
    { type: "CONFIRM_WAIT_COMPLETE", productDirectedWaitCompleted: true },
    { type: "CONFIRM_WAIT_COMPLETE", productDirectedWaitCompleted: false },
    { type: "FINISH_PASS_RELEASED" },
    { type: "SELECT_SHOE", shoe: "left" },
    { type: "SELECT_SHOE", shoe: "right" },
    { type: "SELECT_REGION", region: "toe" },
    { type: "SELECT_REGION", region: "heel" },
    ...CARE_MOTION_MODES.map((mode) => ({ type: "SET_MOTION_MODE", mode })),
    { type: "BACK" },
    { type: "PAUSE" },
    { type: "RESUME" },
    { type: "CONTACT_LOST" },
    { type: "CANCEL" },
    {
      type: "RESTART",
      runId: nextCareRunId(state.runId, state.revision),
      motion: state.requestedMotion,
    },
    { type: "RESTART", runId: state.runId, motion: state.requestedMotion },
  );
  return events;
}

function semanticCareKey(state: CareState): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(state).filter(([key]) => key !== "revision" && key !== "runId"),
    ),
  );
}

const FORBIDDEN_COPY =
  /\b(?:hot|warm|heat|heated|boiling|lukewarm|obey|obedience|worthy|unworthy|guaranteed|restored|protected|undamaged|inspection[- ]ready)\b|wake the polish/i;

test("bounded reachable model audits every discovered operative and rejection transcript", (t) => {
  const startedAt = performance.now();
  const initial = createInitialCareState("copy-model");
  const queue: CareState[] = [initial];
  const seen = new Map<string, CareState>([[semanticCareKey(initial), initial]]);
  const attemptedEventTypes = new Set<string>();
  const seenTargets = new Set<string>();
  const seenModes = new Set<string>();
  const seenStages = new Set<string>();
  const seenStatuses = new Set<string>();
  const seenContacts = new Set<string>();
  const seenRejectionCodes = new Set<string>();
  const unavailableMessages = new Set<string>();
  const backMessages = new Set<string>();
  let acceptedEdges = 0;
  let rejectedEdges = 0;
  const maxSemanticStates = 20_000;

  const auditState = (state: CareState) => {
    const operative = careOperativeCopy(state);
    const description = describeCareState(state);
    const snapshot = createCarePublicSnapshot(state);
    const transcript = JSON.stringify({
      message: state.message,
      error: state.error,
      operative,
      description,
    });

    assert.doesNotMatch(transcript, FORBIDDEN_COPY);
    assert.match(operative.modeledStateNotice, /in-memory modeled demonstration value/i);
    assert.match(operative.modeledStateNotice, /not measured physical coverage/i);
    assert.ok(operative.recovery.length > 0);
    assert.match(description, /Next actions:/i);
    assert.equal(snapshot.revision, state.revision);
    assert.equal(snapshot.runId, state.runId);

    seenTargets.add(snapshot.target);
    seenModes.add(state.presentedMotion);
    seenStages.add(state.stage);
    seenStatuses.add(state.status);
    seenContacts.add(state.contact);
    if (state.status === "unavailable") unavailableMessages.add(state.message);
    if (state.message.startsWith("Returned to ")) backMessages.add(state.message);

    if (state.stage === "water" && state.status === "active") {
      assert.match(transcript, /one drop of clean water/i);
      assert.match(transcript, /resistance is felt/i);
      assert.match(transcript, /current label/i);
    }
    if (state.stage === "set" && state.status === "active") {
      assert.match(transcript, /30-minute final dry/i);
      assert.match(transcript, /without brushing/i);
      assert.match(transcript, /current physical label/i);
    }
    if (state.stage === "finish" && state.status === "active") {
      assert.match(transcript, /Saphir Lustreur Glove/i);
      assert.match(transcript, /(?:Do not (?:use a )?brush|non-brush)/i);
    }
    if (state.status === "complete") {
      assert.match(transcript, /makes no statement about the physical shoe/i);
      assert.equal(state.stage, "complete");
      assert.equal(state.contact, "release");
      assert.equal(state.cycleRecordedThisPass, true);
      assert.ok(snapshot.selectedCareAmount > 0);
    }
    if (state.status === "cancelled") {
      assert.equal(state.cycleRecordedThisPass, false);
      assert.ok(CARE_TARGETS.every((target) => state.careAmount[target] === 0));
    }
    if (state.status === "unavailable") {
      assert.equal(state.error, state.message);
      assert.match(transcript, /Stop here|Do not use/i);
    }
    if (state.status === "paused") {
      assert.match(transcript, /Status paused/i);
      assert.match(transcript, /Resume/i);
    }
  };

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor];
    auditState(state);

    for (const body of modelEventBodies(state)) {
      attemptedEventTypes.add(body.type);
      const result = reduceCareState(state, {
        ...body,
        expectedRevision: state.revision,
        expectedRunId: state.runId,
      });
      if (result.accepted) {
        acceptedEdges += 1;
        assert.equal(result.state.revision, state.revision + 1);
        const key = semanticCareKey(result.state);
        if (!seen.has(key)) {
          assert.ok(
            seen.size < maxSemanticStates,
            `reachable semantic state bound ${maxSemanticStates} exceeded`,
          );
          seen.set(key, result.state);
          queue.push(result.state);
        }
      } else {
        rejectedEdges += 1;
        seenRejectionCodes.add(result.rejection.code);
        assert.strictEqual(result.state, state);
        assert.equal(result.state.revision, state.revision);
        assert.ok(result.rejection.message.length > 0);
        assert.doesNotMatch(result.rejection.message, FORBIDDEN_COPY);
      }
    }

    for (const staleEvent of [
      {
        type: "PAUSE",
        expectedRevision: state.revision === 0 ? 1 : state.revision - 1,
        expectedRunId: state.runId,
      },
      {
        type: "PAUSE",
        expectedRevision: state.revision,
        expectedRunId: "copy-model-wrong-run",
      },
    ]) {
      const result = reduceCareState(state, staleEvent);
      assert.equal(result.accepted, false);
      if (result.accepted) throw new Error("A stale model event was accepted.");
      rejectedEdges += 1;
      seenRejectionCodes.add(result.rejection.code);
      assert.strictEqual(result.state, state);
      assert.doesNotMatch(result.rejection.message, FORBIDDEN_COPY);
    }
  }

  assert.deepEqual([...attemptedEventTypes].sort(), [...MODEL_EVENT_TYPES].sort());
  assert.deepEqual([...seenTargets].sort(), [...CARE_TARGETS].sort());
  assert.deepEqual([...seenModes].sort(), [...CARE_MOTION_MODES].sort());
  assert.deepEqual([...seenStages].sort(), [...CARE_STAGES].sort());
  assert.deepEqual([...seenStatuses].sort(), [...CARE_STATUSES].sort());
  assert.deepEqual([...seenContacts].sort(), [...CARE_CONTACTS].sort());
  assert.equal(unavailableMessages.size, CARE_UNAVAILABLE_REASONS.length);
  assert.ok(backMessages.size >= 5, "every distinct nonterminal Back destination must enter the copy denominator");
  for (const expectedCode of [
    "INVALID_EVENT",
    "STALE_REVISION",
    "STALE_RUN",
    "INVALID_TRANSITION",
    "TERMINAL_STATE",
    "CONFIRMATION_REQUIRED",
    "RELEASE_REQUIRED",
    "CONTACT_REQUIRED",
    "CARE_AMOUNT_DECREASE",
    "NO_CHANGE",
  ]) {
    assert.equal(seenRejectionCodes.has(expectedCode), true, expectedCode);
  }
  assert.ok(seen.size >= 500, `unexpectedly small reachable denominator: ${seen.size}`);
  assert.ok(rejectedEdges > acceptedEdges);
  t.diagnostic(
    `audited ${seen.size} semantic states across ${acceptedEdges + rejectedEdges} transition results in ${Math.round(performance.now() - startedAt)} ms`,
  );
});

test("the care domain has no clocks, pointer semantics, persistence, network, or random run generation", () => {
  const source = readFileSync(
    new URL("../app/domain/footwear-care.ts", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame(",
    "Date.now(",
    "performance.now(",
    "Math.random(",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "XMLHttpRequest",
    "PointerEvent",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
