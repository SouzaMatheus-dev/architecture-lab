import { describe, expect, it } from "vitest";
import { SimulationError } from "./errors";
import { createInitialRunState, getSnapshot, reduceSimulation, resolveFrames } from "./reducer";
import type { SimulationRunState } from "./reducer";
import { parseSimulationDefinition } from "./schema";

const definition = parseSimulationDefinition({
  id: "sample",
  title: "Sample",
  summary: "A two-step script used to test the engine.",
  lesson: "Happy path lesson.",
  nodes: [
    { id: "a", label: "A", caption: "Source" },
    { id: "b", label: "B", caption: "Target" },
  ],
  edges: [{ id: "a-b", source: "a", target: "b" }],
  tables: [{ id: "items", title: "Items", columns: ["Name", "State"] }],
  initial: {
    title: "Ready",
    narrative: "Nothing has happened.",
    components: [
      { id: "a", status: "inactive" },
      { id: "b", status: "inactive" },
    ],
    tables: { items: [] },
  },
  frames: [
    {
      id: "first",
      title: "First",
      narrative: "A calls B.",
      event: {
        id: "first",
        type: "call",
        description: "First event.",
        source: "a",
        target: "b",
        outcome: "success",
      },
      components: [
        { id: "a", status: "processing" },
        { id: "b", status: "processing" },
      ],
      activeEdgeIds: ["a-b"],
      tables: { items: [{ id: "1", cells: { Name: "one", State: "open" } }] },
    },
    {
      id: "second",
      title: "Second",
      narrative: "B finishes.",
      event: {
        id: "second",
        type: "done",
        description: "Second event.",
        source: "b",
        outcome: "success",
      },
      components: [
        { id: "a", status: "success" },
        { id: "b", status: "success" },
      ],
      activeEdgeIds: [],
      tables: { items: [{ id: "1", cells: { Name: "one", State: "done" } }] },
    },
  ],
  failures: [
    {
      id: "b-down",
      name: "B unavailable",
      description: "The call to B fails.",
      lesson: "Failure lesson.",
      frames: [
        {
          id: "failed",
          title: "Failed",
          narrative: "B rejected the call.",
          event: {
            id: "failed",
            type: "call",
            description: "Call failed.",
            source: "a",
            target: "b",
            outcome: "failure",
          },
          components: [
            { id: "a", status: "failure" },
            { id: "b", status: "failure" },
          ],
          activeEdgeIds: ["a-b"],
          tables: { items: [] },
        },
      ],
    },
  ],
});

function apply(
  state: SimulationRunState,
  ...actions: Parameters<typeof reduceSimulation>[2][]
): SimulationRunState {
  return actions.reduce((current, action) => reduceSimulation(definition, current, action), state);
}

describe("simulation engine", () => {
  it("starts on the initial frame", () => {
    const snapshot = getSnapshot(definition, createInitialRunState());

    expect(snapshot.status).toBe("idle");
    expect(snapshot.stepIndex).toBe(-1);
    expect(snapshot.frame.event).toBeNull();
    expect(snapshot.frame.tables.items).toEqual([]);
    expect(snapshot.history).toEqual([]);
    expect(snapshot.lesson).toBe(definition.lesson);
  });

  it("plays, pauses, steps, and resets without losing the selected failure", () => {
    let state = apply(
      createInitialRunState(),
      { type: "play" },
      { type: "stepForward" },
      { type: "pause" },
    );

    expect(state).toMatchObject({ status: "paused", stepIndex: 0 });

    state = apply(state, { type: "stepForward" });
    expect(getSnapshot(definition, state).status).toBe("completed");
    expect(getSnapshot(definition, state).frame.title).toBe("Second");

    state = apply(state, { type: "selectFailure", failureId: "b-down" }, { type: "play" });
    state = apply(state, { type: "reset" });

    expect(state).toMatchObject({
      status: "idle",
      stepIndex: -1,
      activeFailureId: "b-down",
    });
  });

  it("steps backward to the exact previous snapshot", () => {
    const forward = apply(
      createInitialRunState(),
      { type: "stepForward" },
      { type: "stepForward" },
    );
    const back = apply(forward, { type: "stepBack" });
    const first = apply(createInitialRunState(), { type: "stepForward" });

    expect(getSnapshot(definition, back).frame).toEqual(getSnapshot(definition, first).frame);
    expect(back.status).toBe("paused");
  });

  it("keeps manual playback paused and automatic playback running until the end", () => {
    const manual = apply(createInitialRunState(), { type: "stepForward" });
    expect(manual.status).toBe("paused");

    const automatic = apply(createInitialRunState(), { type: "play" }, { type: "stepForward" });
    expect(automatic.status).toBe("running");

    const finished = apply(automatic, { type: "stepForward" });
    expect(finished.status).toBe("completed");
    expect(apply(finished, { type: "play" })).toEqual(finished);
    expect(apply(finished, { type: "stepForward" })).toEqual(finished);
  });

  it("does not move before the initial frame", () => {
    const state = apply(createInitialRunState(), { type: "stepBack" });
    expect(state).toMatchObject({ status: "idle", stepIndex: -1 });
  });

  it("replaces the script when a failure is selected and rejects unknown failures", () => {
    const running = apply(createInitialRunState(), { type: "play" }, { type: "stepForward" });
    const failed = apply(running, { type: "selectFailure", failureId: "b-down" });

    expect(failed).toMatchObject({ status: "idle", stepIndex: -1, activeFailureId: "b-down" });
    expect(resolveFrames(definition, "b-down")).toHaveLength(1);
    expect(getSnapshot(definition, failed).lesson).toBe("Failure lesson.");

    expect(() => apply(failed, { type: "selectFailure", failureId: "missing" })).toThrow(
      SimulationError,
    );
  });

  it("keeps the current step when the same failure is selected again", () => {
    const state = apply(
      createInitialRunState(),
      { type: "selectFailure", failureId: "b-down" },
      { type: "stepForward" },
    );
    expect(apply(state, { type: "selectFailure", failureId: "b-down" })).toEqual(state);
  });

  it("seeks to a frame and pauses there", () => {
    const state = apply(createInitialRunState(), { type: "play" }, { type: "goTo", stepIndex: 1 });
    const snapshot = getSnapshot(definition, state);

    expect(state.status).toBe("paused");
    expect(snapshot.frame.title).toBe("Second");
    expect(snapshot.history.map((frame) => frame.title)).toEqual(["First", "Second"]);
  });

  it("changes speed without changing the step", () => {
    const stepped = apply(createInitialRunState(), { type: "stepForward" });
    const faster = apply(stepped, { type: "setSpeed", speed: 2 });

    expect(faster.stepIndex).toBe(stepped.stepIndex);
    expect(faster.speed).toBe(2);
    expect(() => apply(faster, { type: "setSpeed", speed: 0 })).toThrow(SimulationError);
  });

  it("is deterministic for the same definition, failure, and actions", () => {
    const actions: Parameters<typeof reduceSimulation>[2][] = [
      { type: "selectFailure", failureId: "b-down" },
      { type: "play" },
      { type: "stepForward" },
      { type: "pause" },
      { type: "stepBack" },
      { type: "reset" },
      { type: "stepForward" },
    ];

    const left = getSnapshot(definition, apply(createInitialRunState(), ...actions));
    const right = getSnapshot(definition, apply(createInitialRunState(), ...actions));

    expect(left).toEqual(right);
    expect(JSON.stringify(left)).not.toContain("Date");
  });

  it("rejects a definition whose frame omits a node", () => {
    expect(() =>
      parseSimulationDefinition({
        ...definition,
        initial: {
          ...definition.initial,
          components: [{ id: "a", status: "inactive" }],
        },
      }),
    ).toThrow(SimulationError);
  });
});
