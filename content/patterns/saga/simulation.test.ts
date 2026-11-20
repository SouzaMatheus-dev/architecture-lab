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
import { compensationSource, naiveCheckoutSource, orchestratorSource } from "./example";
import metadata from "./metadata.json";
import { withSagaSimulation, withoutSagaSimulation } from "./simulation";

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
  for (let index = 0; index < frames.length; index += 1) {
    state = reduceSimulation(definition, state, { type: "stepForward" });
  }
  return getSnapshot(definition, state);
}

describe("saga simulations", () => {
  it("completes the three local steps and then answers the client", () => {
    const frames = resolveFrames(withSagaSimulation, null);
    const types = frames.map((frame) => frame.event.type);
    expect(types.indexOf("payment.captured")).toBeLessThan(types.indexOf("inventory.reserved"));
    expect(types.indexOf("inventory.reserved")).toBeLessThan(types.indexOf("shipping.created"));
    expect(types.at(-1)).toBe("saga.complete");
    const last = frames.at(-1);
    expect(last?.tables.process?.[0]?.cells.Estado).toBe("Concluída");
    expect(last?.tables.payment).toHaveLength(1);
    expect(last?.tables.inventory).toHaveLength(1);
    expect(last?.tables.shipping).toHaveLength(1);
  });

  it("refunds the capture when stock rejects the reservation", () => {
    const frames = resolveFrames(withSagaSimulation, "stock-rejected");
    const last = frames.at(-1);
    expect(last?.tables.process?.[0]?.cells.Estado).toBe("Compensada");
    expect(last?.tables.payment?.[0]?.cells.Estado).toBe("Estornado");
    expect(last?.tables.shipping).toEqual([]);
    expect(frames.some((frame) => frame.event.type === "payment.refund")).toBe(true);
  });

  it("recognizes the same capture after the orchestrator crashes", () => {
    const frames = resolveFrames(withSagaSimulation, "crash-before-saga-log");
    expect(frames.filter((frame) => frame.event.type === "payment.charge")).toHaveLength(2);
    const last = frames.at(-1);
    expect(last?.tables.payment).toHaveLength(1);
    expect(last?.tables.payment?.[0]?.cells.Estado).toBe("Capturado");
    expect(last?.tables.process?.[0]?.cells.Passo).toBe("Pago");
  });

  it("keeps the saga blocked when compensation fails", () => {
    const last = resolveFrames(withSagaSimulation, "compensation-rejected").at(-1);
    expect(last?.tables.process?.[0]?.cells.Estado).toBe("Bloqueada");
    expect(last?.tables.payment?.[0]?.cells.Estado).toBe("Capturado");
    expect(last?.event.type).toBe("payment.refund-failed");
  });

  it("leaves a capture with nobody to continue or compensate", () => {
    const last = resolveFrames(withoutSagaSimulation, "payment-without-process").at(-1);
    expect(last?.tables.payment?.[0]?.cells.Estado).toBe("Capturado");
    expect(last?.tables.inventory).toEqual([]);
    expect(last?.tables.shipping).toEqual([]);
  });

  it("reserves stock when the capture never happened", () => {
    const last = resolveFrames(withoutSagaSimulation, "process-without-effect").at(-1);
    expect(last?.tables.payment).toEqual([]);
    expect(last?.tables.inventory?.[0]?.cells.Estado).toBe("Reservado");
  });

  it("finishes every script at the last frame", () => {
    for (const definition of [withSagaSimulation, withoutSagaSimulation]) {
      expect(play(definition).status).toBe("completed");
      for (const failure of definition.failures) {
        const snapshot = play(definition, failure.id);
        expect(snapshot.status).toBe("completed");
        expect(snapshot.stepIndex).toBe(failure.frames.length - 1);
      }
    }
  });

  it("matches the catalog metadata and the C# examples", () => {
    const summary = patternCatalog.find((pattern) => pattern.slug === "saga");
    expect(summary).toMatchObject(metadata);
    expect(readNormalized("./examples/dotnet/OrderSaga.cs")).toBe(orchestratorSource.trim());
    expect(readNormalized("./examples/dotnet/RefundCapture.cs")).toBe(compensationSource.trim());
    expect(readNormalized("./examples/dotnet/NaiveCheckout.cs")).toBe(naiveCheckoutSource.trim());
  });
});
