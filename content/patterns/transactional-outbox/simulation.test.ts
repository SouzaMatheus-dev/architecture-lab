import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createInitialRunState,
  getSnapshot,
  reduceSimulation,
  resolveFrames,
} from "@architecture-lab/simulation-engine";
import type { SimulationDefinition } from "@architecture-lab/simulation-engine";
import { describe, expect, it } from "vitest";
import { patternCatalog } from "../../catalog";
import { createOrderSource, dispatcherSource } from "./example";
import metadata from "./metadata.json";
import { withOutboxSimulation, withoutOutboxSimulation } from "./simulation";

function readNormalized(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")
    .replace(/\r\n/g, "\n")
    .trim();
}

function play(definition: SimulationDefinition, failureId: string | null = null) {
  let state = reduceSimulation(definition, createInitialRunState(), {
    type: "selectFailure",
    failureId,
  });
  const frames = resolveFrames(definition, failureId);
  const snapshots = [getSnapshot(definition, state)];
  for (let index = 0; index < frames.length; index += 1) {
    state = reduceSimulation(definition, state, { type: "stepForward" });
    snapshots.push(getSnapshot(definition, state));
  }
  return snapshots;
}

function cell(
  definition: SimulationDefinition,
  failureId: string | null,
  eventType: string,
  table: string,
  column: string,
): string | undefined {
  const frame = resolveFrames(definition, failureId).find((item) => item.event.type === eventType);
  return frame?.tables[table]?.[0]?.cells[column];
}

describe("transactional outbox simulations", () => {
  it("answers the client before publishing when the outbox is used", () => {
    const types = resolveFrames(withOutboxSimulation, null).map((frame) => frame.event.type);
    expect(types.indexOf("http.response")).toBeLessThan(types.indexOf("broker.publish"));
    expect(types.indexOf("db.commit")).toBeLessThan(types.indexOf("http.response"));
  });

  it("publishes before answering when the service talks to Kafka directly", () => {
    const types = resolveFrames(withoutOutboxSimulation, null).map((frame) => frame.event.type);
    expect(types.indexOf("broker.ack")).toBeLessThan(types.indexOf("http.response"));
  });

  it("keeps the pending message when Kafka is unavailable", () => {
    const frames = resolveFrames(withOutboxSimulation, "kafka-unavailable");
    const failed = frames.find((frame) => frame.event.outcome === "failure");
    expect(failed?.tables.orders?.[0]?.cells.Estado).toBe("Confirmado");
    expect(failed?.tables.outbox?.[0]?.cells.Estado).toBe("Pending");

    const recovered = frames.at(-1);
    expect(recovered?.tables.outbox?.[0]?.cells.Estado).toBe("Processed");
    expect(recovered?.tables.consumerLog).toHaveLength(1);
  });

  it("leaves an accepted event behind when the transaction fails after publish", () => {
    const frames = resolveFrames(withoutOutboxSimulation, "message-without-order");
    const publish = frames.findIndex((frame) => frame.event.type === "broker.publish");
    const commit = frames.findIndex((frame) => frame.event.type === "db.commit");
    expect(publish).toBeGreaterThanOrEqual(0);
    expect(commit).toBeGreaterThan(publish);
    expect(frames[publish]?.tables.orders).toEqual([]);
    const last = frames.at(-1);
    expect(last?.tables.orders).toEqual([]);
    expect(last?.tables.consumerLog?.[0]?.cells.Resultado).toBe("Aplicado sem pedido");
    expect(last?.notes.join(" ")).toContain("não alcança o broker");
  });

  it("loses the event in the naive Kafka failure and leaves the order behind", () => {
    const frames = resolveFrames(withoutOutboxSimulation, "kafka-unavailable");
    const last = frames.at(-1);
    expect(last?.event.outcome).toBe("failure");
    expect(last?.tables.orders).toHaveLength(1);
    expect(last?.tables.consumerLog).toEqual([]);
    expect(last?.tables.outbox).toBeUndefined();
  });

  it("rolls the order and the outbox message back together", () => {
    const frames = resolveFrames(withOutboxSimulation, "transaction-failure");
    expect(
      frames.some((frame) => frame.tables.orders?.[0]?.cells.Estado === "Não confirmado"),
    ).toBe(true);
    const last = frames.at(-1);
    expect(last?.tables.orders).toEqual([]);
    expect(last?.tables.outbox).toEqual([]);
  });

  it("stores nothing when the database is unavailable", () => {
    const frames = resolveFrames(withOutboxSimulation, "database-unavailable");
    for (const frame of frames) {
      expect(frame.tables.orders).toEqual([]);
      expect(frame.tables.outbox).toEqual([]);
    }
  });

  it("shows a duplicate delivery and an idempotent consumer", () => {
    const frames = resolveFrames(withOutboxSimulation, "duplicate-publish");
    expect(frames.filter((frame) => frame.event.type === "broker.publish")).toHaveLength(2);
    const last = frames.at(-1);
    expect(last?.tables.outbox?.[0]?.cells.Estado).toBe("Processed");
    expect(last?.tables.consumerLog?.map((row) => row.cells.Resultado)).toContain(
      "Ignorado pela idempotência",
    );
  });

  it("stops retrying a poison message without deleting the order", () => {
    const last = resolveFrames(withOutboxSimulation, "poison-message").at(-1);
    expect(last?.tables.orders?.[0]?.cells.Estado).toBe("Confirmado");
    expect(last?.tables.outbox?.[0]?.cells.Estado).toBe("Failed");
    expect(last?.tables.consumerLog).toEqual([]);
  });

  it("lets only the worker that claimed the message publish it", () => {
    const frames = resolveFrames(withOutboxSimulation, "concurrent-workers");
    expect(
      frames.some((frame) => frame.tables.outbox?.[0]?.cells.Estado?.includes("worker-a")),
    ).toBe(true);
    expect(frames.filter((frame) => frame.event.type === "broker.publish")).toHaveLength(1);
    expect(frames.at(-1)?.tables.consumerLog).toHaveLength(1);
  });

  it("recovers a message after the worker process stops", () => {
    const frames = resolveFrames(withOutboxSimulation, "worker-interrupted");
    expect(frames.some((frame) => frame.event.type === "worker.crash")).toBe(true);
    expect(
      cell(withOutboxSimulation, "worker-interrupted", "worker.crash", "outbox", "Estado"),
    ).toBe("Pending");
    expect(frames.at(-1)?.tables.outbox?.[0]?.cells.Estado).toBe("Processed");
  });

  it("returns to the previous table state when stepping back", () => {
    let state = reduceSimulation(withOutboxSimulation, createInitialRunState(), {
      type: "stepForward",
    });
    const first = getSnapshot(withOutboxSimulation, state);
    state = reduceSimulation(withOutboxSimulation, state, { type: "stepForward" });
    state = reduceSimulation(withOutboxSimulation, state, { type: "stepBack" });
    expect(getSnapshot(withOutboxSimulation, state).frame).toEqual(first.frame);
  });

  it("finishes every script at the last frame", () => {
    for (const failure of withOutboxSimulation.failures) {
      const snapshots = play(withOutboxSimulation, failure.id);
      expect(snapshots.at(-1)?.status).toBe("completed");
      expect(snapshots.at(-1)?.stepIndex).toBe(failure.frames.length - 1);
    }
    for (const failure of withoutOutboxSimulation.failures) {
      const snapshots = play(withoutOutboxSimulation, failure.id);
      expect(snapshots.at(-1)?.status).toBe("completed");
      expect(snapshots.at(-1)?.stepIndex).toBe(failure.frames.length - 1);
    }
    expect(play(withoutOutboxSimulation).at(-1)?.status).toBe("completed");
  });

  it("matches the catalog metadata and the C# examples", () => {
    const summary = patternCatalog.find((pattern) => pattern.slug === "transactional-outbox");
    expect(summary).toMatchObject(metadata);
    expect(readNormalized("./examples/dotnet/CreateOrder.cs")).toBe(createOrderSource.trim());
    expect(readNormalized("./examples/dotnet/OutboxDispatcher.cs")).toBe(dispatcherSource.trim());
  });
});
