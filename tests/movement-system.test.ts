import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultAvatar,
  flows,
  movementPractices,
} from "../app/domain/content";
import {
  adaptFlow,
  availableMovementPractices,
  movementHowTo,
  movementFlow,
} from "../app/domain/movement-logic";
import {
  adaptedMovementPhases,
  movementAnimationCss,
} from "../app/domain/movement-animation";

test("the movement catalog is declarative, complete, and uniquely keyed", () => {
  assert.ok(movementPractices.length > 30);
  assert.equal(
    new Set(movementPractices.map((movement) => movement.id)).size,
    movementPractices.length,
  );

  for (const movement of movementPractices) {
    assert.ok(movement.title);
    assert.ok(movement.startingPose);
    assert.ok(movement.instruction);
    assert.ok(movement.accessibility);
    assert.equal(movement.repeats, true);
    assert.ok(movement.phases.length >= 3);
    assert.ok(movement.howTo.length >= 3);
    assert.equal(movement.reducedMotionSteps.length, 3);
    assert.equal(movement.reducedPhaseIndexes.length, 3);
    assert.ok(movement.durationMs >= 3_000);
    for (const phase of movement.phases) {
      assert.ok(phase.id);
      assert.ok(phase.label);
      assert.ok(["left", "center", "right"].includes(phase.weightSide));
      assert.ok(Object.keys(phase.joints).length > 0);
    }
  }
});

test("named movements own distinct articulated sequences and actionable directions", () => {
  const signatures = new Set<string>();
  for (const movement of movementPractices) {
    const signature = movement.phases
      .map((phase) => JSON.stringify([phase.bodyX, phase.bodyY, phase.bodyRotation, phase.joints]))
      .join("|");
    signatures.add(signature);

    const directions = movementHowTo(movement, defaultAvatar);
    assert.ok(directions.length >= 3);
    assert.ok(directions.every((direction) => direction.length >= 18));

    const css = movementAnimationCss(movement, defaultAvatar);
    assert.match(css, new RegExp(`evenward-${movement.id}-standing-front-body`));
    assert.match(css, /left-forearm/);
    assert.match(css, /right-shin/);
  }
  assert.equal(signatures.size, movementPractices.length);
});

test("side demonstrations translate symmetric movement into the forward plane", () => {
  const riseSink = movementPractices.find((movement) => movement.id === "riseSink");
  assert.ok(riseSink);

  const side = adaptedMovementPhases(riseSink, defaultAvatar, "side");
  const float = side.find((phase) => phase.id === "float");
  assert.ok(float);
  assert.ok((float.joints.leftShoulder ?? 0) < 0);
  assert.ok((float.joints.rightShoulder ?? 0) < 0);
  assert.ok((float.joints.leftElbow ?? 0) > 0);
  assert.ok((float.joints.rightElbow ?? 0) > 0);
  assert.ok((float.joints.leftKnee ?? 0) <= 0);
  assert.ok((float.joints.rightKnee ?? 0) <= 0);

  const css = movementAnimationCss(riseSink, defaultAvatar, "side");
  assert.match(css, /evenward-riseSink-standing-side-left-arm/);
});

test("cat-cow uses a grounded quadruped rig unless the selected form is seated", () => {
  const catCow = movementPractices.find((movement) => movement.id === "catCow");
  assert.ok(catCow);
  assert.equal(catCow.position, "quadruped");

  const standingPhases = adaptedMovementPhases(catCow, defaultAvatar);
  assert.ok(standingPhases.every((phase) => (phase.bodyRotation ?? 0) >= 65));
  assert.ok(standingPhases.some((phase) => Math.abs(phase.joints.leftKnee ?? 0) >= 80));

  const seatedAvatar = { ...defaultAvatar, mobility: "seated" as const };
  const seatedPhases = adaptedMovementPhases(catCow, seatedAvatar);
  assert.ok(seatedPhases.every((phase) => phase.bodyRotation === 0));
  assert.match(movementHowTo(catCow, seatedAvatar)[0], /stable chair/i);
});

test("practice accessibility selects compatible forms without mutating data", () => {
  const burqaAvatar = { ...defaultAvatar, headwear: "burqa" as const };
  const compatible = availableMovementPractices(burqaAvatar);
  assert.ok(compatible.length > 0);
  assert.ok(compatible.length < movementPractices.length);
  assert.ok(compatible.every((movement) => movement.allowedWithBurqa));

  const oneArmAvatar = { ...defaultAvatar, mobility: "oneArm" as const };
  const cloud = movementPractices.find((movement) => movement.id === "cloudHands");
  assert.ok(cloud);
  const flow = movementFlow(cloud, oneArmAvatar);
  assert.equal(flow.steps[1].movement, "singleCloud");
  assert.match(flow.title, /^Single cloud hand/);
});

test("flow adaptation preserves stable step identifiers", () => {
  for (const flow of flows) {
    const adapted = adaptFlow(flow, defaultAvatar);
    assert.ok(adapted.steps.length > 0);
    assert.equal(
      new Set(adapted.steps.map((step) => step.id)).size,
      adapted.steps.length,
    );
  }
});
