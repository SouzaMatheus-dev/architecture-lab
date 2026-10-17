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
import { handleOrderSource, naiveHandlerSource } from "./example";
import metadata from "./metadata.json";
import { withInboxSimulation, withoutInboxSimulation } from "./simulation";

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

describe("transactional inbox simulations", () => {
  it("commits the effect before acknowledging the broker", () => {
    const types = resolveFrames(withInboxSimulation, null).map((frame) => frame.event.type);
    expect(types.indexOf("db.commit")).toBeLessThan(types.indexOf("broker.ack"));
    expect(types.indexOf("broker.deliver")).toBeLessThan(types.indexOf("db.commit"));
  });

  it("keeps a single charge when the process dies before the ack", () => {
    const frames = resolveFrames(withInboxSimulation, "crash-before-ack");
    expect(frames.filter((frame) => frame.event.type === "broker.deliver")).toHaveLength(2);
    const last = frames.at(-1);
    expect(last?.tables.charges).toHaveLength(1);
    expect(last?.tables.inbox?.[0]?.cells.Estado).toBe("Processada");
    expect(last?.tables.delivery?.[0]?.cells.Ack).toBe("Confirmado");
    const ignored = frames.find((frame) => frame.event.type === "inbox.hit");
    expect(ignored?.notes.join(" ")).toContain("Ignorado pela idempotência");
  });

  it("ignores a second delivery of the same message", () => {
    const frames = resolveFrames(withInboxSimulation, "duplicate-delivery");
    expect(frames.filter((frame) => frame.event.type === "broker.deliver")).toHaveLength(2);
    expect(frames.at(-1)?.tables.charges).toHaveLength(1);
  });

  it("rolls the charge and the inbox row back together", () => {
    const frames = resolveFrames(withInboxSimulation, "transaction-failure");
    expect(
      frames.some((frame) => frame.tables.charges?.[0]?.cells.Estado === "Não confirmado"),
    ).toBe(true);
    const last = frames.at(-1);
    expect(last?.tables.charges).toEqual([]);
    expect(last?.tables.inbox).toEqual([]);
    expect(last?.tables.delivery).toEqual([]);
  });

  it("stores nothing when the database is unavailable", () => {
    const frames = resolveFrames(withInboxSimulation, "database-unavailable");
    for (const frame of frames) {
      expect(frame.tables.charges).toEqual([]);
      expect(frame.tables.inbox).toEqual([]);
    }
  });

  it("does not mark a poison message as processed", () => {
    const frames = resolveFrames(withInboxSimulation, "poison-message");
    expect(frames.filter((frame) => frame.event.type === "message.rejected")).toHaveLength(3);
    const last = frames.at(-1);
    expect(last?.tables.charges).toEqual([]);
    expect(last?.tables.inbox).toEqual([]);
    expect(last?.tables.delivery?.[0]?.cells.Ack).toBe("Retida");
  });

  it("lets only the consumer that inserted the inbox key create the charge", () => {
    const frames = resolveFrames(withInboxSimulation, "concurrent-consumers");
    expect(
      frames.some((frame) => frame.tables.inbox?.[0]?.cells.Estado?.includes("consumer-a")),
    ).toBe(true);
    expect(frames.filter((frame) => frame.event.type === "db.commit")).toHaveLength(1);
    expect(frames.at(-1)?.tables.charges).toHaveLength(1);
  });

  it("duplicates the charge when a redelivery has no inbox", () => {
    const frames = resolveFrames(withoutInboxSimulation, "redelivery-duplicates");
    const last = frames.at(-1);
    expect(last?.tables.charges).toHaveLength(2);
    expect(last?.tables.inbox).toBeUndefined();
  });

  it("loses the effect when the ack happens before the commit", () => {
    const last = resolveFrames(withoutInboxSimulation, "ack-before-effect").at(-1);
    expect(last?.event.type).toBe("effect.lost");
    expect(last?.tables.charges).toEqual([]);
    expect(last?.tables.delivery?.[0]?.cells.Ack).toBe("Confirmado");
  });

  it("finishes every script at the last frame", () => {
    for (const failure of withInboxSimulation.failures) {
      const snapshots = play(withInboxSimulation, failure.id);
      expect(snapshots.at(-1)?.status).toBe("completed");
      expect(snapshots.at(-1)?.stepIndex).toBe(failure.frames.length - 1);
    }
    expect(play(withoutInboxSimulation).at(-1)?.status).toBe("completed");
  });

  it("matches the catalog metadata and the C# examples", () => {
    const summary = patternCatalog.find((pattern) => pattern.slug === "transactional-inbox");
    expect(summary).toMatchObject(metadata);
    expect(readNormalized("./examples/dotnet/HandleOrderCreated.cs")).toBe(
      handleOrderSource.trim(),
    );
    expect(readNormalized("./examples/dotnet/NaiveChargeHandler.cs")).toBe(
      naiveHandlerSource.trim(),
    );
  });
});
