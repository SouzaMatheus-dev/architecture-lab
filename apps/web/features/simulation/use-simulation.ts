"use client";

import {
  createInitialRunState,
  getSnapshot,
  reduceSimulation,
} from "@architecture-lab/simulation-engine";
import type {
  SimulationAction,
  SimulationDefinition,
  SimulationRunState,
} from "@architecture-lab/simulation-engine";
import { useCallback, useEffect, useMemo, useState } from "react";

export const PLAYBACK_STEP_MS = 1600;

export function useSimulation(definition: SimulationDefinition) {
  const [state, setState] = useState<SimulationRunState>(() => createInitialRunState());
  const [definitionId, setDefinitionId] = useState(definition.id);

  if (definition.id !== definitionId) {
    setDefinitionId(definition.id);
    setState(createInitialRunState());
  }

  const snapshot = useMemo(() => getSnapshot(definition, state), [definition, state]);

  const dispatch = useCallback(
    (action: SimulationAction) => {
      setState((current) => reduceSimulation(definition, current, action));
    },
    [definition],
  );

  useEffect(() => {
    if (snapshot.status !== "running") {
      return;
    }
    const stepIndex = snapshot.stepIndex;
    const delay = Math.round(PLAYBACK_STEP_MS / snapshot.speed);
    const timer = window.setTimeout(() => {
      setState((current) => {
        if (current.stepIndex !== stepIndex) {
          return current;
        }
        return reduceSimulation(definition, current, { type: "stepForward" });
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [definition, snapshot.speed, snapshot.status, snapshot.stepIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        dispatch(snapshot.status === "running" ? { type: "pause" } : { type: "play" });
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        dispatch({ type: "stepForward" });
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        dispatch({ type: "stepBack" });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, snapshot.status]);

  return { snapshot, dispatch };
}
