export type PatternComplexity = "Introdutório" | "Intermediário" | "Avançado";
export type PatternAvailability = "available" | "planned";

export interface PatternSummary {
  slug: string;
  title: string;
  summary: string;
  category: string;
  complexity: PatternComplexity;
  status: PatternAvailability;
  language: "pt-BR";
}

export const patternCatalog: readonly PatternSummary[] = [
  {
    slug: "transactional-outbox",
    title: "Transactional Outbox",
    summary:
      "Grava a mudança de negócio e a intenção de publicar um evento na mesma transação local.",
    category: "Consistência",
    complexity: "Intermediário",
    status: "available",
    language: "pt-BR",
  },
  {
    slug: "transactional-inbox",
    title: "Transactional Inbox",
    summary: "Grava o efeito de negócio e o identificador da mensagem na mesma transação local.",
    category: "Consistência",
    complexity: "Intermediário",
    status: "available",
    language: "pt-BR",
  },
  {
    slug: "saga",
    title: "Saga",
    summary:
      "Coordena um processo que atravessa serviços e compensa os passos já concluídos quando um deles falha.",
    category: "Consistência",
    complexity: "Avançado",
    status: "planned",
    language: "pt-BR",
  },
  {
    slug: "cqrs",
    title: "CQRS",
    summary: "Separa o modelo usado para alterar o estado do modelo usado para consultar.",
    category: "Modelo",
    complexity: "Avançado",
    status: "planned",
    language: "pt-BR",
  },
  {
    slug: "event-sourcing",
    title: "Event Sourcing",
    summary: "Persiste os fatos do domínio. O estado corrente é uma leitura derivada desses fatos.",
    category: "Modelo",
    complexity: "Avançado",
    status: "planned",
    language: "pt-BR",
  },
  {
    slug: "circuit-breaker",
    title: "Circuit Breaker",
    summary: "Interrompe chamadas a uma dependência instável para evitar que a falha se espalhe.",
    category: "Resiliência",
    complexity: "Intermediário",
    status: "planned",
    language: "pt-BR",
  },
  {
    slug: "retry",
    title: "Retry",
    summary:
      "Repete uma operação transitória com limite, espera e uma condição clara para desistir.",
    category: "Resiliência",
    complexity: "Introdutório",
    status: "planned",
    language: "pt-BR",
  },
  {
    slug: "cache-aside",
    title: "Cache-Aside",
    summary:
      "Consulta o cache primeiro e, quando o dado falta, busca na origem e preenche o cache.",
    category: "Dados",
    complexity: "Introdutório",
    status: "planned",
    language: "pt-BR",
  },
  {
    slug: "api-gateway",
    title: "API Gateway",
    summary: "Concentra a entrada dos clientes, com roteamento e políticas aplicadas na borda.",
    category: "Borda",
    complexity: "Intermediário",
    status: "planned",
    language: "pt-BR",
  },
];

export function listPatterns(): PatternSummary[] {
  return [...patternCatalog];
}

export function getPatternSummary(slug: string): PatternSummary | undefined {
  return patternCatalog.find((pattern) => pattern.slug === slug);
}
