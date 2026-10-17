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
  exercise: readonly { question: string; answer: string }[];
}

export interface LabContrast {
  problem: string;
  aim: string;
}

export interface LabMode {
  id: string;
  label: string;
  role: "pattern" | "baseline";
  limitNote: string;
  definition: SimulationDefinition;
}

export interface AvailablePattern {
  summary: PatternSummary;
  article: PatternWriteup;
  contrast: LabContrast;
  modes: LabMode[];
}

const available: Record<string, AvailablePattern> = {
  "transactional-outbox": {
    summary: requiredSummary("transactional-outbox"),
    article: transactionalOutboxArticle,
    contrast: {
      problem:
        "Gravar o pedido e publicar o evento são operações separadas. O pedido pode ficar sem evento, ou o evento pode ficar sem o pedido.",
      aim: "Confirmar o pedido e a intenção de publicar na mesma transação. A publicação continua depois, e o ack do broker segue fora dela.",
    },
    modes: [
      {
        id: "with-outbox",
        label: "Com Outbox",
        role: "pattern",
        limitNote:
          "Esta é uma simulação no navegador. O Outbox registra a intenção de publicar. Ele não garante entrega exatamente uma vez, e o consumidor precisa tolerar uma mensagem repetida.",
        definition: withOutboxSimulation,
      },
      {
        id: "without-outbox",
        label: "Sem Outbox",
        role: "baseline",
        limitNote:
          "Esta é uma simulação no navegador. Sem a intenção registrada, o pedido pode ficar sem evento, ou o evento pode ficar sem pedido.",
        definition: withoutOutboxSimulation,
      },
    ],
  },
  "transactional-inbox": {
    summary: requiredSummary("transactional-inbox"),
    article: transactionalInboxArticle,
    contrast: {
      problem:
        "A cobrança não lembra a mensagem. Uma reentrega repete o efeito, e um ack antes da gravação pode perder a cobrança.",
      aim: "Gravar a cobrança e o identificador na mesma transação, e confirmar o broker só depois. A entrega repetida continua possível.",
    },
    modes: [
      {
        id: "with-inbox",
        label: "Com Inbox",
        role: "pattern",
        limitNote:
          "Esta é uma simulação no navegador. A Inbox grava o identificador da mensagem junto com o efeito. Ela não torna o broker exatamente uma vez.",
        definition: withInboxSimulation,
      },
      {
        id: "without-inbox",
        label: "Sem Inbox",
        role: "baseline",
        limitNote:
          "Esta é uma simulação no navegador. Sem o identificador gravado com o efeito, uma reentrega pode repetir a cobrança, e um ack adiantado pode perder o efeito.",
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
