import type { SimulationDefinition } from "@architecture-lab/simulation-engine";
import { getPatternSummary } from "./catalog";
import type { PatternSummary } from "./catalog";
import { transactionalInboxArticle } from "./patterns/transactional-inbox/article";
import {
  withInboxSimulation,
  withoutInboxSimulation,
} from "./patterns/transactional-inbox/simulation";
import { transactionalOutboxArticle } from "./patterns/transactional-outbox/article";
import { createOrderSource, dispatcherSource } from "./patterns/transactional-outbox/example";
import {
  withOutboxSimulation,
  withoutOutboxSimulation,
} from "./patterns/transactional-outbox/simulation";

export { listPatterns, patternCatalog } from "./catalog";
export type { PatternAvailability, PatternComplexity, PatternSummary } from "./catalog";
export { createOrderSource, dispatcherSource, transactionalOutboxArticle };
export { transactionalInboxArticle, withInboxSimulation, withoutInboxSimulation };
export { withOutboxSimulation, withoutOutboxSimulation };

export interface PatternWriteup {
  problem: { id: string; title: string; paragraphs: readonly string[] };
  comparison: { id: string; title: string; paragraphs: readonly string[] };
  flow: { id: string; title: string; paragraphs: readonly string[] };
  tradeoffs: { id: string; title: string; pros: readonly string[]; cons: readonly string[] };
  whenToUse: {
    id: string;
    title: string;
    paragraphs: readonly string[];
    use: readonly string[];
    avoid: readonly string[];
  };
  example: {
    intro: string;
    files: readonly { filename: string; source: string }[];
  };
  accuracy: { id: string; title: string; items: readonly string[] };
  exercise: { question: string; answer: string };
}

export interface LabMode {
  id: string;
  label: string;
  description: string;
  limitNote: string;
  definition: SimulationDefinition;
}

export interface AvailablePattern {
  summary: PatternSummary;
  article: PatternWriteup;
  modes: LabMode[];
}

const available: Record<string, AvailablePattern> = {
  "transactional-outbox": {
    summary: requiredSummary("transactional-outbox"),
    article: transactionalOutboxArticle,
    modes: [
      {
        id: "with-outbox",
        label: "Com Outbox",
        description: "Pedido e mensagem entram na mesma transação local.",
        limitNote:
          "Esta é uma simulação no navegador. O Outbox registra a intenção de publicar. Ele não garante entrega exatamente uma vez, e o consumidor precisa tolerar uma mensagem repetida.",
        definition: withOutboxSimulation,
      },
      {
        id: "without-outbox",
        label: "Sem Outbox",
        description: "O serviço publica no Kafka depois de gravar o pedido.",
        limitNote:
          "Esta é uma simulação no navegador. Sem a intenção registrada, uma falha entre o commit e a publicação deixa o pedido sem evento.",
        definition: withoutOutboxSimulation,
      },
    ],
  },
  "transactional-inbox": {
    summary: requiredSummary("transactional-inbox"),
    article: transactionalInboxArticle,
    modes: [
      {
        id: "with-inbox",
        label: "Com Inbox",
        description: "Cobrança e identificador da mensagem entram na mesma transação local.",
        limitNote:
          "Esta é uma simulação no navegador. A Inbox grava o identificador da mensagem junto com o efeito. Ela não torna o broker exatamente uma vez.",
        definition: withInboxSimulation,
      },
      {
        id: "without-inbox",
        label: "Sem Inbox",
        description: "O consumidor grava a cobrança sem lembrar a mensagem.",
        limitNote:
          "Esta é uma simulação no navegador. Sem o identificador gravado com o efeito, uma reentrega pode repetir a cobrança.",
        definition: withoutInboxSimulation,
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
