import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  rendererContactActionPolicy,
  ShoeCareStudio,
  restartMotionForRequirement,
  studioAlertMessage,
} from "../app/components/care/ShoeCareStudio";
import { navItems } from "../app/domain/content";
import {
  createInitialCareState,
  reduceCareState,
  type CareEvent,
  type CareState,
} from "../app/domain/footwear-care";

type EventInput = CareEvent extends infer Event
  ? Event extends CareEvent
    ? Omit<Event, "expectedRevision" | "expectedRunId">
    : never
  : never;

function accept(state: CareState, event: EventInput) {
  const result = reduceCareState(state, {
    ...event,
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  });
  if (!result.accepted) throw new Error(result.rejection.message);
  return result.state;
}

function renderCare(state: CareState) {
  return renderToStaticMarkup(
    <ShoeCareStudio
      state={state}
      rejection={null}
      onEvent={() => undefined}
      onRendererContactLoss={() => undefined}
      onCancelAtReleasedBoundary={() => undefined}
      motionReductionRequired={false}
    />,
  );
}

test("a new run cannot restore Normal while reduced motion is required", () => {
  assert.equal(restartMotionForRequirement("normal", true), "reduced");
  assert.equal(restartMotionForRequirement("reduced", true), "reduced");
  assert.equal(restartMotionForRequirement("still", true), "still");
  assert.equal(restartMotionForRequirement("normal", false), "normal");
});

test("renderer failure receives one Studio-owned assertive announcement", () => {
  assert.match(
    studioAlertMessage(false, null, null) ?? "",
    /3D reference is unavailable.*Do not begin or resume contact/i,
  );
  assert.equal(studioAlertMessage(null, null, null), null);
  assert.equal(studioAlertMessage(true, null, "Event rejection"), "Event rejection");
  assert.equal(studioAlertMessage(false, "Domain failure", null), "Domain failure");
  assert.match(
    studioAlertMessage(false, null, "Unrelated event rejection") ?? "",
    /3D reference is unavailable/i,
  );
});

test("renderer availability gates contact without blocking withdrawal or release", () => {
  assert.equal(rendererContactActionPolicy(true, "clear"), "continue");
  assert.equal(rendererContactActionPolicy(false, "clear"), "wait");
  assert.equal(rendererContactActionPolicy(null, "release"), "wait");
  assert.equal(rendererContactActionPolicy(false, "approach"), "release");
  assert.equal(rendererContactActionPolicy(false, "contact"), "release");
});

test("SSR starts renderer-loss recovery guarded while capability is unknown", () => {
  let state = createInitialCareState("render-loss-paused");
  state = accept(state, {
    type: "CONFIRM_COMPATIBILITY",
    confirmations: {
      blackSmoothFinishedLeather: true,
      productLabelPermitsWaxGlazing: true,
      hiddenAreaTestCompleted: true,
      productProfile: "saphir-amiral-gloss",
    },
  });
  state = accept(state, {
    type: "CONFIRM_PREPARATION",
    confirmations: { lacesAndDebrisCleared: true, leatherDry: true },
  });
  state = accept(state, { type: "PLACE_THIN_AMOUNT" });
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "RELEASE" });
  state = accept(state, { type: "CONTACT_LOST" });
  const markup = renderCare(state);
  assert.match(markup, /aria-disabled="true"[^>]*>Resume when the 3D reference is available<\/button>/);
});

function reachableStates() {
  const states: CareState[] = [];
  let state = createInitialCareState("render-sequence");
  states.push(state);
  state = accept(state, {
    type: "CONFIRM_COMPATIBILITY",
    confirmations: {
      blackSmoothFinishedLeather: true,
      productLabelPermitsWaxGlazing: true,
      hiddenAreaTestCompleted: true,
      productProfile: "saphir-amiral-gloss",
    },
  });
  states.push(state);
  state = accept(state, {
    type: "CONFIRM_PREPARATION",
    confirmations: { lacesAndDebrisCleared: true, leatherDry: true },
  });
  states.push(state);
  state = accept(state, { type: "PLACE_THIN_AMOUNT" });
  states.push(state);
  state = accept(state, { type: "APPROACH" });
  states.push(state);
  state = accept(state, { type: "BEGIN_CONTACT" });
  states.push(state);
  state = accept(state, { type: "RECORD_CONTACT_CYCLE" });
  states.push(state);
  state = accept(state, {
    type: "CHOOSE_WATER",
    productLabelPermitsOneDrop: true,
    resistanceFelt: true,
  });
  states.push(state);
  state = accept(state, { type: "BACK" });
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "BEGIN_CONTACT" });
  state = accept(state, { type: "RECORD_CONTACT_CYCLE" });
  state = accept(state, { type: "CHOOSE_SET" });
  states.push(state);
  state = accept(state, {
    type: "CONFIRM_WAIT_COMPLETE",
    productDirectedWaitCompleted: true,
  });
  states.push(state);
  state = accept(state, { type: "APPROACH" });
  state = accept(state, { type: "BEGIN_CONTACT" });
  state = accept(state, { type: "FINISH_PASS_RELEASED" });
  states.push(state);

  states.push(
    accept(createInitialCareState("render-unavailable"), {
      type: "DECLARE_UNAVAILABLE",
      reason: "unknown-material",
    }),
  );
  states.push(
    accept(createInitialCareState("render-cancelled"), { type: "CANCEL" }),
  );
  return states;
}

test("Care is a reachable primary view with one literal working surface", () => {
  assert.deepEqual(
    navItems.filter(({ id }) => id === "care"),
    [{ id: "care", label: "Care", mark: "◒" }],
  );

  const markup = renderCare(createInitialCareState("render-initial"));
  assert.match(markup, /data-care-surface="true"/);
  assert.match(markup, /Black leather shoe care/);
  assert.match(markup, /Pre-production reference/);
  assert.match(markup, /Confirm every compatibility fact/);
  assert.match(markup, /product[^<]*current label/i);
  assert.match(markup, /inconspicuous-area test/i);
  assert.match(markup, /data-renderer-rating="unrated"/);
  assert.match(markup, /aria-live="polite"/);
});

test("Still exposes explicit representative controls without changing canonical state", () => {
  const state = createInitialCareState("render-still", "still");
  const before = JSON.stringify(state);
  const markup = renderCare(state);
  assert.match(markup, /Previous phase/);
  assert.match(markup, /Next phase/);
  assert.match(markup, /Describe current state/);
  assert.match(markup, /Restart this in-memory run/);
  assert.match(markup, /Canonical contact remains Clear/i);
  assert.equal(JSON.stringify(state), before);
});

test("active contact keeps ordered Cancel available", () => {
  const contact = reachableStates().find(
    (state) => state.stage === "work" && state.contact === "contact",
  );
  assert.ok(contact);
  const markup = renderCare(contact);
  const cancelButton = markup.match(
    /<button[^>]*>Cancel and discard modeled values<\/button>/,
  )?.[0];
  assert.ok(cancelButton);
  assert.doesNotMatch(cancelButton, /\bdisabled(?:=|\s|>)/);
  assert.match(
    markup,
    /Cancel first withdraws or releases contact, then discards the modeled values/i,
  );
});

test("wayfinder never reports optional Water as completed without branch history", () => {
  const set = reachableStates().find((state) => state.stage === "set");
  assert.ok(set);
  const markup = renderCare(set);
  const waterStep = markup.match(
    /<li[^>]*data-stage-state="optional-unrecorded"[^>]*>[\s\S]*?Water \(optional; visit not recorded\)<\/span><\/li>/,
  )?.[0];
  assert.ok(waterStep);
  assert.doesNotMatch(waterStep, /data-stage-state="past"/);
});

test("representative reachable care transcripts keep safety and outcome language literal", () => {
  const transcripts = reachableStates().map(renderCare).join("\n");
  assert.doesNotMatch(transcripts, /\bhot water\b|\bwarm water\b|wake the polish/i);
  assert.doesNotMatch(transcripts, /guaranteed|inspection-ready|restored|undamaged/i);
  assert.match(transcripts, /one drop of clean water/i);
  assert.match(transcripts, /not measured physical coverage/i);
  assert.match(transcripts, /makes no statement about the physical shoe/i);
  assert.match(transcripts, /Flex, seams, welt, sole/i);
  assert.match(transcripts, /Stop here and check the maker/i);
});

test("completion exposes all four modeled targets and untreated regions in text", () => {
  const complete = reachableStates().find(({ status }) => status === "complete");
  assert.ok(complete);
  const markup = renderCare(complete);
  for (const target of ["Left Toe", "Left Heel", "Right Toe", "Right Heel"]) {
    assert.match(markup, new RegExp(target));
  }
  assert.match(markup, /Physical finish: not measured or declared/);
  assert.match(markup, /Not treated/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>Reduced demonstration<\/button>/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>Still presentation<\/button>/);
});
