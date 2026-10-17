import type { SimulationDefinition } from "@architecture-lab/simulation-engine";
import { getPatternSummary } from "./catalog";
import type { PatternSummary } from "./catalog";
import { transactionalOutboxArticle } from "./patterns/transactional-outbox/article";
import { createOrderSource, dispatcherSource } from "./patterns/transactional-outbox/example";
import {
  withOutboxSimulation,
  withoutOutboxSimulation,
} from "./patterns/transactional-outbox/simulation";

export { listPatterns, patternCatalog } from "./catalog";
export type { PatternAvailability, PatternComplexity, PatternSummary } from "./catalog";
export { createOrderSource, dispatcherSource, transactionalOutboxArticle };
export { withOutboxSimulation, withoutOutboxSimulation };

export interface LabMode {
  id: string;
  label: string;
  description: string;
  definition: SimulationDefinition;
}

export interface AvailablePattern {
  summary: PatternSummary;
  article: typeof transactionalOutboxArticle;
  examples: {
    createOrder: string;
    dispatcher: string;
  };
  modes: LabMode[];
}

const available: Record<string, AvailablePattern> = {
  "transactional-outbox": {
    summary: requiredSummary("transactional-outbox"),
    article: transactionalOutboxArticle,
    examples: {
      createOrder: createOrderSource,
      dispatcher: dispatcherSource,
    },
    modes: [
      {
        id: "with-outbox",
        label: "Com Outbox",
        description: "Pedido e mensagem entram na mesma transação local.",
        definition: withOutboxSimulation,
      },
      {
        id: "without-outbox",
        label: "Sem Outbox",
        description: "O serviço publica no Kafka depois de gravar o pedido.",
        definition: withoutOutboxSimulation,
      },
    ],
  },
};

export function getAvailablePattern(slug: string): AvailablePattern | undefined {
  return available[slug];
}

export function getPatternPage(
  slug: string,
):
  | { status: "available"; pattern: AvailablePattern }
  | { status: "planned"; summary: PatternSummary }
  | undefined {
  const summary = getPatternSummary(slug);
  if (!summary) {
    return undefined;
  }
  if (summary.status === "planned") {
    return { status: "planned", summary };
  }
  const pattern = getAvailablePattern(slug);
  if (!pattern) {
    return undefined;
  }
  return { status: "available", pattern };
}

function requiredSummary(slug: string): PatternSummary {
  const summary = getPatternSummary(slug);
  if (!summary) {
    throw new Error(`Missing catalog entry for ${slug}`);
  }
  return summary;
}
