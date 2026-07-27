"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  avatarBehaviorReducer,
  avatarStateAnnouncement,
  initialAvatarBehavior,
} from "../domain/avatar-machine";
import type {
  GuidePart,
  MovementDemo,
  MovementView,
} from "../domain/types";

const ARRIVAL_DURATION_MS = 2_200;
const REACTION_DURATION_MS = 1_450;
const LEAVING_DURATION_MS = 3_600;
const TRANSITION_DURATION_MS = 140;
const RETURN_DURATION_MS = 180;
const REDUCED_DURATION_MS = 80;

export function useAvatarController(reducedMotion: boolean) {
  const [state, dispatch] = useReducer(
    avatarBehaviorReducer,
    reducedMotion,
    initialAvatarBehavior,
  );
  const timers = useRef<Set<number>>(new Set());
  const initialReducedMotion = useRef(reducedMotion);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  const cancelTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  useEffect(() => cancelTimers, [cancelTimers]);

  useEffect(() => {
    dispatch({ type: "SET_REDUCED_MOTION", value: reducedMotion });
    if (
      reducedMotion &&
      (state.mode === "entering" || state.mode === "walking-left")
    ) {
      cancelTimers();
      schedule(() => dispatch({ type: "ARRIVED" }), REDUCED_DURATION_MS);
    }
  }, [cancelTimers, reducedMotion, schedule, state.mode]);

  useEffect(() => {
    dispatch({ type: "WALK_IN" });
    schedule(
      () => dispatch({ type: "ARRIVED" }),
      initialReducedMotion.current ? REDUCED_DURATION_MS : ARRIVAL_DURATION_MS,
    );
  }, [schedule]);

  const demonstrate = useCallback(
    (movement: MovementDemo, sourceId: string, view: MovementView) => {
      cancelTimers();
      dispatch({ type: "DEMONSTRATE", movement, sourceId, view });
      schedule(
        () => dispatch({ type: "TRANSITIONED" }),
        reducedMotion ? REDUCED_DURATION_MS : TRANSITION_DURATION_MS,
      );
    },
    [cancelTimers, reducedMotion, schedule],
  );

  const returnToIdle = useCallback(() => {
    cancelTimers();
    dispatch({ type: "RETURN" });
    schedule(
      () => dispatch({ type: "RETURNED" }),
      reducedMotion ? REDUCED_DURATION_MS : RETURN_DURATION_MS,
    );
  }, [cancelTimers, reducedMotion, schedule]);

  const react = useCallback(
    (part: GuidePart) => {
      cancelTimers();
      if (part === "boundary") {
        dispatch({ type: "LEAVE" });
        schedule(() => dispatch({ type: "WALK_OUT" }), 0);
        schedule(
          () => dispatch({ type: "LEFT" }),
          reducedMotion ? REDUCED_DURATION_MS : LEAVING_DURATION_MS,
        );
        return;
      }

      dispatch({ type: "REACT", part });
      schedule(
        () => dispatch({ type: "REACTION_FINISHED" }),
        reducedMotion ? REDUCED_DURATION_MS : REACTION_DURATION_MS,
      );
    },
    [cancelTimers, reducedMotion, schedule],
  );

  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const setView = useCallback(
    (view: MovementView) => dispatch({ type: "SET_VIEW", view }),
    [],
  );
  const nextPose = useCallback(() => dispatch({ type: "NEXT_POSE" }), []);
  const previousPose = useCallback(
    () => dispatch({ type: "PREVIOUS_POSE" }),
    [],
  );

  return {
    state,
    announcement: avatarStateAnnouncement(state),
    demonstrate,
    returnToIdle,
    react,
    pause,
    resume,
    setView,
    nextPose,
    previousPose,
  };
}
