import assert from "node:assert/strict";
import test from "node:test";
import {
  avatarBehaviorReducer,
  initialAvatarBehavior,
} from "../app/domain/avatar-machine";

test("walking states always face their direction of travel", () => {
  const entering = avatarBehaviorReducer(initialAvatarBehavior(), {
    type: "WALK_IN",
  });
  assert.equal(entering.mode, "walking-left");
  assert.equal(entering.facing, "left");

  const idle = avatarBehaviorReducer(entering, { type: "ARRIVED" });
  const leaving = avatarBehaviorReducer(idle, { type: "LEAVE" });
  const walkingOut = avatarBehaviorReducer(leaving, { type: "WALK_OUT" });
  assert.equal(walkingOut.mode, "walking-right");
  assert.equal(walkingOut.facing, "right");
});

test("a movement owns the avatar until it is replaced or returned", () => {
  let state = avatarBehaviorReducer(initialAvatarBehavior(), { type: "ARRIVED" });
  state = avatarBehaviorReducer(state, {
    type: "DEMONSTRATE",
    movement: "cloudHands",
    sourceId: "cloudHands",
    view: "front",
  });
  assert.equal(state.mode, "transitioning");
  state = avatarBehaviorReducer(state, { type: "TRANSITIONED" });
  assert.equal(state.mode, "demonstrating");
  assert.equal(state.movement, "cloudHands");

  state = avatarBehaviorReducer(state, { type: "REACT", part: "head" });
  assert.equal(state.mode, "reacting");
  assert.equal(state.reaction, "headPat");
  state = avatarBehaviorReducer(state, { type: "REACTION_FINISHED" });
  assert.equal(state.mode, "demonstrating");
  assert.equal(state.movement, "cloudHands");

  state = avatarBehaviorReducer(state, { type: "RETURN" });
  state = avatarBehaviorReducer(state, { type: "RETURNED" });
  assert.equal(state.mode, "idle");
  assert.equal(state.movement, "rest");
  assert.equal(state.sourceId, null);
});

test("rapid lesson changes resolve to the latest coherent movement", () => {
  let state = avatarBehaviorReducer(initialAvatarBehavior(), { type: "ARRIVED" });
  state = avatarBehaviorReducer(state, {
    type: "DEMONSTRATE",
    movement: "riseSink",
    sourceId: "riseSink",
    view: "side",
  });
  state = avatarBehaviorReducer(state, {
    type: "DEMONSTRATE",
    movement: "jointCircles",
    sourceId: "jointCircles",
    view: "front",
  });
  state = avatarBehaviorReducer(state, { type: "TRANSITIONED" });

  assert.equal(state.mode, "demonstrating");
  assert.equal(state.movement, "jointCircles");
  assert.equal(state.sourceId, "jointCircles");
  assert.equal(state.view, "front");
});

test("reduced motion retains staged instruction and pause control", () => {
  let state = avatarBehaviorReducer(initialAvatarBehavior(true), {
    type: "ARRIVED",
  });
  state = avatarBehaviorReducer(state, {
    type: "DEMONSTRATE",
    movement: "brushKnee",
    sourceId: "brushKnee",
    view: "side",
  });
  state = avatarBehaviorReducer(state, { type: "TRANSITIONED" });
  assert.equal(state.mode, "reduced-motion");

  state = avatarBehaviorReducer(state, { type: "NEXT_POSE" });
  assert.equal(state.poseIndex, 1);
  state = avatarBehaviorReducer(state, { type: "PAUSE" });
  assert.equal(state.mode, "paused");
  state = avatarBehaviorReducer(state, { type: "RESUME" });
  assert.equal(state.mode, "reduced-motion");
  assert.equal(state.poseIndex, 1);
});

test("a hidden guide rejects incompatible demonstrations until reload", () => {
  let state = avatarBehaviorReducer(initialAvatarBehavior(), { type: "ARRIVED" });
  state = avatarBehaviorReducer(state, { type: "LEAVE" });
  state = avatarBehaviorReducer(state, { type: "WALK_OUT" });
  state = avatarBehaviorReducer(state, { type: "LEFT" });
  const unchanged = avatarBehaviorReducer(state, {
    type: "DEMONSTRATE",
    movement: "opening",
    sourceId: "opening",
    view: "front",
  });
  assert.equal(unchanged.mode, "hidden");
  assert.equal(initialAvatarBehavior().mode, "entering");
});
