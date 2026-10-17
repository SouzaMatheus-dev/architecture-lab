import { SimulationError } from "./errors";
import type {
  FailureScenario,
  FrameDefinition,
  SimulationDefinition,
  SimulationFrame,
} from "./schema";
import type { PlaybackStatus } from "./schema";

export const SPEED_PRESETS = [0.5, 1, 1.5, 2] as const;

export interface SimulationRunState {
  status: PlaybackStatus;
  /** -1 is the initial frame, before the first event. */
  stepIndex: number;
  activeFailureId: string | null;
  speed: number;
}

export type SimulationAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "stepForward" }
  | { type: "stepBack" }
  | { type: "reset" }
  | { type: "setSpeed"; speed: number }
  | { type: "selectFailure"; failureId: string | null }
  | { type: "goTo"; stepIndex: number };

export interface ControllerSnapshot {
  status: PlaybackStatus;
  stepIndex: number;
  stepCount: number;
  activeFailureId: string | null;
  speed: number;
  progress: number;
  lesson: string;
  frame: SimulationFrame;
  history: SimulationFrame[];
}

export function createInitialRunState(): SimulationRunState {
  return {
    status: "idle",
    stepIndex: -1,
    activeFailureId: null,
    speed: 1,
  };
}

export function resolveFrames(
  definition: SimulationDefinition,
  failureId: string | null,
): FrameDefinition[] {
  if (failureId === null) {
    return definition.frames;
  }

  const failure = findFailure(definition, failureId);
  return failure.frames;
}

export function projectFrame(
  definition: SimulationDefinition,
  frames: readonly FrameDefinition[],
  stepIndex: number,
): SimulationFrame {
  if (stepIndex < -1 || stepIndex >= frames.length) {
    throw new SimulationError(`Step ${stepIndex} is outside the active script.`);
  }

  if (stepIndex === -1) {
    return {
      index: -1,
      title: definition.initial.title,
      narrative: definition.initial.narrative,
      event: null,
      components: definition.initial.components,
      activeEdgeIds: [],
      tables: definition.initial.tables,
      notes: definition.initial.notes,
    };
  }

  const frame = frames[stepIndex];
  if (!frame) {
    throw new SimulationError(`Step ${stepIndex} is outside the active script.`);
  }

  return {
    index: stepIndex,
    title: frame.title,
    narrative: frame.narrative,
    event: frame.event,
    components: frame.components,
    activeEdgeIds: frame.activeEdgeIds,
    tables: frame.tables,
    notes: frame.notes,
  };
}

export function reduceSimulation(
  definition: SimulationDefinition,
  state: SimulationRunState,
  action: SimulationAction,
): SimulationRunState {
  const frames = resolveFrames(definition, state.activeFailureId);

  switch (action.type) {
    case "play": {
      if (state.status === "running" || state.status === "completed") {
        return state;
      }
      if (frames.length === 0 || state.stepIndex >= frames.length - 1) {
        return { ...state, status: "completed" };
      }
      return { ...state, status: "running" };
    }
    case "pause": {
      if (state.status !== "running") {
        return state;
      }
      return { ...state, status: "paused" };
    }
    case "stepForward": {
      if (state.stepIndex >= frames.length - 1) {
        return { ...state, status: "completed" };
      }
      const stepIndex = state.stepIndex + 1;
      const reachedEnd = stepIndex >= frames.length - 1;
      const status = reachedEnd ? "completed" : state.status === "running" ? "running" : "paused";
      return { ...state, stepIndex, status };
    }
    case "stepBack": {
      if (state.stepIndex <= -1) {
        return { ...state, stepIndex: -1, status: "idle" };
      }
      const stepIndex = state.stepIndex - 1;
      return {
        ...state,
        stepIndex,
        status: stepIndex < 0 ? "idle" : "paused",
      };
    }
    case "reset": {
      return {
        ...createInitialRunState(),
        activeFailureId: state.activeFailureId,
        speed: state.speed,
      };
    }
    case "setSpeed": {
      if (!Number.isFinite(action.speed) || action.speed <= 0 || action.speed > 4) {
        throw new SimulationError("Speed must be greater than 0 and at most 4.");
      }
      return { ...state, speed: action.speed };
    }
    case "selectFailure": {
      if (action.failureId !== null) {
        findFailure(definition, action.failureId);
      }
      if (action.failureId === state.activeFailureId) {
        return state;
      }
      return {
        ...createInitialRunState(),
        speed: state.speed,
        activeFailureId: action.failureId,
      };
    }
    case "goTo": {
      if (!Number.isInteger(action.stepIndex)) {
        throw new SimulationError("Step index must be an integer.");
      }
      if (action.stepIndex < -1 || action.stepIndex >= frames.length) {
        throw new SimulationError(`Step ${action.stepIndex} is outside the active script.`);
      }
      return {
        ...state,
        stepIndex: action.stepIndex,
        status: action.stepIndex < 0 ? "idle" : "paused",
      };
    }
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

export function getSnapshot(
  definition: SimulationDefinition,
  state: SimulationRunState,
): ControllerSnapshot {
  const frames = resolveFrames(definition, state.activeFailureId);
  const frame = projectFrame(definition, frames, state.stepIndex);
  const history = frames.slice(0, Math.max(state.stepIndex + 1, 0)).map((_, index) => {
    return projectFrame(definition, frames, index);
  });
  const failure = state.activeFailureId
    ? findFailure(definition, state.activeFailureId)
    : undefined;

  return {
    status: state.status,
    stepIndex: state.stepIndex,
    stepCount: frames.length,
    activeFailureId: state.activeFailureId,
    speed: state.speed,
    progress: frames.length === 0 ? 0 : Math.max(state.stepIndex + 1, 0) / frames.length,
    lesson: failure?.lesson ?? definition.lesson,
    frame,
    history,
  };
}

function findFailure(definition: SimulationDefinition, failureId: string): FailureScenario {
  const failure = definition.failures.find((item) => item.id === failureId);
  if (!failure) {
    throw new SimulationError(`Unknown failure scenario "${failureId}".`);
  }
  return failure;
}
