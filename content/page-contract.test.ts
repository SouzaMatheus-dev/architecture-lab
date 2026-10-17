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
      expect(pattern?.article.exercise.length).toBeGreaterThanOrEqual(4);
      for (const item of pattern?.article.exercise ?? []) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThan(0);
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
