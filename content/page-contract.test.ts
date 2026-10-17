import { resolveFrames } from "@architecture-lab/simulation-engine";
import { describe, expect, it } from "vitest";
import { getAvailablePattern } from "./index";
import { withoutInboxSimulation } from "./patterns/transactional-inbox/simulation";
import { withoutOutboxSimulation } from "./patterns/transactional-outbox/simulation";

const published = ["transactional-outbox", "transactional-inbox"] as const;

describe("published pattern contract", () => {
  it("teaches how to read the lab and offers a set of exercises", () => {
    for (const slug of published) {
      const pattern = getAvailablePattern(slug);
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

  it("lights an edge that connects the event of every step", () => {
    for (const slug of published) {
      const pattern = getAvailablePattern(slug);
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
    expect(withoutOutboxSimulation.failures.map((failure) => failure.id)).toEqual(
      expect.arrayContaining(["kafka-unavailable", "message-without-order"]),
    );
    expect(withoutInboxSimulation.failures.map((failure) => failure.id)).toEqual(
      expect.arrayContaining(["redelivery-duplicates", "ack-before-effect"]),
    );
  });
});
