import { resolveFrames } from "@architecture-lab/simulation-engine";
import { describe, expect, it } from "vitest";
import { patternCatalog } from "./catalog";
import { getAvailablePattern, getPatternPage } from "./index";

const published = patternCatalog.filter((pattern) => pattern.status === "available");
const planned = patternCatalog.filter((pattern) => pattern.status === "planned");

describe("published pattern contract", () => {
  it("follows the catalog instead of a handwritten slug list", () => {
    expect(published.map((pattern) => pattern.slug)).toEqual([
      "transactional-outbox",
      "transactional-inbox",
      "saga",
    ]);
    for (const summary of planned) {
      const page = getPatternPage(summary.slug);
      expect(page?.status).toBe("planned");
    }
  });

  it("teaches how to read the lab and offers a set of exercises", () => {
    for (const summary of published) {
      const pattern = getAvailablePattern(summary.slug);
      expect(pattern, summary.slug).toBeDefined();
      expect(pattern?.article.flow.title).toBe("Como ler a simulação");
      expect(pattern?.article.flow.paragraphs.length).toBeGreaterThan(0);
      expect(pattern?.contrast.problem.length).toBeGreaterThan(0);
      expect(pattern?.contrast.aim.length).toBeGreaterThan(0);
      expect(pattern?.modes.map((mode) => mode.role).sort()).toEqual(["baseline", "pattern"]);
      expect(pattern?.article.exercise.length).toBeGreaterThanOrEqual(4);
      for (const item of pattern?.article.exercise ?? []) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every node of a path its own position", () => {
    for (const summary of published) {
      const pattern = getAvailablePattern(summary.slug);
      for (const mode of pattern?.modes ?? []) {
        const nodeIds = mode.definition.nodes.map((node) => node.id).sort();
        expect(Object.keys(mode.layout).sort(), mode.id).toEqual(nodeIds);
      }
    }
  });

  it("lights an edge that connects the event of every step", () => {
    for (const summary of published) {
      const pattern = getAvailablePattern(summary.slug);
      for (const mode of pattern?.modes ?? []) {
        const frames = [
          ...mode.definition.frames,
          ...mode.definition.failures.flatMap((failure) => failure.frames),
        ];
        for (const frame of frames) {
          const target = frame.event.target;
          if (!target) {
            continue;
          }
          const edge = mode.definition.edges.find(
            (item) =>
              (item.source === frame.event.source && item.target === target) ||
              (item.source === target && item.target === frame.event.source),
          );
          expect(edge, `${mode.id}:${frame.id}`).toBeDefined();
          expect(frame.activeEdgeIds, `${mode.id}:${frame.id}`).toContain(edge?.id);
        }
        for (const failure of mode.definition.failures) {
          expect(resolveFrames(mode.definition, failure.id).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("shows both orders of the split operation without the pattern", () => {
    for (const summary of published) {
      const pattern = getAvailablePattern(summary.slug);
      const baseline = pattern?.modes.find((mode) => mode.role === "baseline");
      expect(baseline?.splitOrders, summary.slug).toHaveLength(2);
      const failureIds = baseline?.definition.failures.map((failure) => failure.id) ?? [];
      for (const failureId of baseline?.splitOrders ?? []) {
        expect(failureIds, `${summary.slug}:${failureId}`).toContain(failureId);
      }
      for (const mode of pattern?.modes.filter((item) => item.role === "pattern") ?? []) {
        expect(mode.splitOrders).toBeNull();
      }
    }
  });

  it("publishes the saga with both orders of the split operation", () => {
    const pattern = getAvailablePattern("saga");
    expect(pattern?.contrast.problem).toContain("efeito sem o processo");
    expect(pattern?.contrast.problem).toContain("processo sem o efeito");
    expect(pattern?.contrast.aim).toContain("compensação");
    const retry = getPatternPage("retry");
    expect(retry?.status).toBe("planned");
    if (retry?.status === "planned") {
      expect(retry.brief).toBeUndefined();
    }
  });
});
