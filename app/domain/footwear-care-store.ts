import {
  reduceCareState,
  type CareEvent,
  type CareEffect,
  type CareState,
} from "./footwear-care";

export type CareTransitionTraceEntry = Readonly<{
  revision: number;
  runId: string;
  status: CareState["status"];
  stage: CareState["stage"];
  contact: CareState["contact"];
  presentedMotion: CareState["presentedMotion"];
  effects: readonly CareEffect[];
}>;

export type CareStore = Readonly<{
  state: CareState;
  rejection: string | null;
  transitionTrace: readonly CareTransitionTraceEntry[];
}>;

export type CareStoreAction =
  | Readonly<{ kind: "event"; event: CareEvent }>
  | Readonly<{ kind: "pause-at-release" }>
  | Readonly<{ kind: "cancel-at-release" }>
  | Readonly<{ kind: "contact-loss-at-release" }>
  | Readonly<{ kind: "reduce-at-release" }>;

type BoundaryResult = Readonly<{
  state: CareState;
  transitionTrace: readonly CareTransitionTraceEntry[];
}>;

const EMPTY_TRACE: readonly CareTransitionTraceEntry[] = Object.freeze([]);

function traceEntry(
  state: CareState,
  effects: readonly CareEffect[],
): CareTransitionTraceEntry {
  return Object.freeze({
    revision: state.revision,
    runId: state.runId,
    status: state.status,
    stage: state.stage,
    contact: state.contact,
    presentedMotion: state.presentedMotion,
    effects: Object.freeze([...effects]),
  });
}

function boundaryResult(
  state: CareState,
  transitionTrace: CareTransitionTraceEntry[],
): BoundaryResult {
  return Object.freeze({
    state,
    transitionTrace: Object.freeze(transitionTrace),
  });
}

export function createCareStore(state: CareState): CareStore {
  return Object.freeze({ state, rejection: null, transitionTrace: EMPTY_TRACE });
}

function pauseCareBoundary(state: CareState): BoundaryResult {
  let next = state;
  const transitionTrace: CareTransitionTraceEntry[] = [];
  if (next.contact === "approach" || next.contact === "contact") {
    const released = reduceCareState(next, {
      type: "RELEASE",
      expectedRevision: next.revision,
      expectedRunId: next.runId,
    });
    if (released.accepted) {
      next = released.state;
      transitionTrace.push(traceEntry(next, released.effects));
    }
  }
  if (
    next.status !== "paused" &&
    next.status !== "complete" &&
    next.status !== "cancelled" &&
    next.status !== "unavailable"
  ) {
    const paused = reduceCareState(next, {
      type: "PAUSE",
      expectedRevision: next.revision,
      expectedRunId: next.runId,
    });
    if (paused.accepted) {
      next = paused.state;
      transitionTrace.push(traceEntry(next, paused.effects));
    }
  }
  return boundaryResult(next, transitionTrace);
}

export function pauseCareAtReleasedBoundary(state: CareState): CareState {
  return pauseCareBoundary(state).state;
}

function cancelCareBoundary(state: CareState): BoundaryResult {
  let next = state;
  const transitionTrace: CareTransitionTraceEntry[] = [];
  if (next.contact === "approach" || next.contact === "contact") {
    const released = reduceCareState(next, {
      type: "RELEASE",
      expectedRevision: next.revision,
      expectedRunId: next.runId,
    });
    if (!released.accepted) return boundaryResult(state, []);
    next = released.state;
    transitionTrace.push(traceEntry(next, released.effects));
  }
  const cancelled = reduceCareState(next, {
    type: "CANCEL",
    expectedRevision: next.revision,
    expectedRunId: next.runId,
  });
  if (cancelled.accepted) {
    next = cancelled.state;
    transitionTrace.push(traceEntry(next, cancelled.effects));
  }
  return boundaryResult(next, transitionTrace);
}

export function cancelCareAtReleasedBoundary(state: CareState): CareState {
  return cancelCareBoundary(state).state;
}

function reduceCareBoundary(state: CareState): BoundaryResult {
  if (
    state.presentedMotion !== "normal" ||
    state.status === "complete" ||
    state.status === "cancelled" ||
    state.status === "unavailable"
  ) {
    return boundaryResult(state, []);
  }
  let next = state;
  const transitionTrace: CareTransitionTraceEntry[] = [];
  if (next.contact === "approach" || next.contact === "contact") {
    const released = reduceCareState(next, {
      type: "RELEASE",
      expectedRevision: next.revision,
      expectedRunId: next.runId,
    });
    if (!released.accepted) return boundaryResult(state, []);
    next = released.state;
    transitionTrace.push(traceEntry(next, released.effects));
  }
  const reduced = reduceCareState(next, {
    type: "SET_MOTION_MODE",
    expectedRevision: next.revision,
    expectedRunId: next.runId,
    mode: "reduced",
  });
  if (reduced.accepted) {
    next = reduced.state;
    transitionTrace.push(traceEntry(next, reduced.effects));
  }
  return boundaryResult(next, transitionTrace);
}

export function reduceCareAtReleasedBoundary(state: CareState): CareState {
  return reduceCareBoundary(state).state;
}

function contactLossCareBoundary(state: CareState): BoundaryResult {
  if (
    state.status !== "active" ||
    !(state.contact === "approach" || state.contact === "contact")
  ) {
    return boundaryResult(state, []);
  }
  const transitionTrace: CareTransitionTraceEntry[] = [];
  const released = reduceCareState(state, {
    type: "RELEASE",
    expectedRevision: state.revision,
    expectedRunId: state.runId,
  });
  if (!released.accepted) return boundaryResult(state, []);
  transitionTrace.push(traceEntry(released.state, released.effects));
  const lost = reduceCareState(released.state, {
    type: "CONTACT_LOST",
    expectedRevision: released.state.revision,
    expectedRunId: released.state.runId,
  });
  if (lost.accepted) {
    transitionTrace.push(traceEntry(lost.state, lost.effects));
    return boundaryResult(lost.state, transitionTrace);
  }
  return boundaryResult(released.state, transitionTrace);
}

export function contactLossAtReleasedBoundary(state: CareState): CareState {
  return contactLossCareBoundary(state).state;
}

export function careStoreReducer(store: CareStore, action: CareStoreAction): CareStore {
  if (action.kind === "event") {
    const result = reduceCareState(store.state, action.event);
    return result.accepted
      ? Object.freeze({
          state: result.state,
          rejection: null,
          transitionTrace: Object.freeze([traceEntry(result.state, result.effects)]),
        })
      : Object.freeze({
          state: store.state,
          rejection: result.rejection.message,
          transitionTrace: EMPTY_TRACE,
        });
  }
  const boundary = action.kind === "pause-at-release"
    ? pauseCareBoundary(store.state)
    : action.kind === "cancel-at-release"
      ? cancelCareBoundary(store.state)
      : action.kind === "contact-loss-at-release"
        ? contactLossCareBoundary(store.state)
        : reduceCareBoundary(store.state);
  if (
    boundary.state === store.state &&
    store.rejection === null &&
    store.transitionTrace.length === 0
  ) return store;
  return Object.freeze({
    state: boundary.state,
    rejection: null,
    transitionTrace: boundary.transitionTrace,
  });
}
