import type { DiagramEdge, DiagramNode, TableSchema } from "@architecture-lab/simulation-engine";

export const withNodes = [
  { id: "client", label: "Cliente", caption: "HTTP" },
  { id: "order-service", label: "Order Service", caption: "API" },
  { id: "database", label: "Banco de dados", caption: "Transação local" },
  { id: "worker", label: "Outbox Worker", caption: "Publicação" },
  { id: "kafka", label: "Kafka", caption: "Broker" },
  { id: "consumer", label: "Consumidor", caption: "Idempotente" },
] as const satisfies readonly DiagramNode[];

export const withEdges = [
  { id: "request", source: "client", target: "order-service", label: "HTTP" },
  { id: "write", source: "order-service", target: "database", label: "transação" },
  { id: "poll", source: "database", target: "worker", label: "pendências" },
  { id: "publish", source: "worker", target: "kafka", label: "OrderCreated" },
  { id: "deliver", source: "kafka", target: "consumer", label: "entrega" },
] as const satisfies readonly DiagramEdge[];

export const withTables = [
  { id: "orders", title: "Orders", columns: ["Pedido", "Cliente", "Estado"] },
  {
    id: "outbox",
    title: "OutboxMessages",
    columns: ["Mensagem", "Tipo", "Estado", "Tentativas"],
  },
  { id: "consumerLog", title: "Consumidor", columns: ["Evento", "Resultado"] },
] as const satisfies readonly TableSchema[];

export const withNodeIds = withNodes.map((node) => node.id);

export const naiveNodes = [
  { id: "client", label: "Cliente", caption: "HTTP" },
  { id: "order-service", label: "Order Service", caption: "API" },
  { id: "database", label: "Banco de dados", caption: "Pedido" },
  { id: "kafka", label: "Kafka", caption: "Broker" },
  { id: "consumer", label: "Consumidor", caption: "Downstream" },
] as const satisfies readonly DiagramNode[];

export const naiveEdges = [
  { id: "request", source: "client", target: "order-service", label: "HTTP" },
  { id: "write", source: "order-service", target: "database", label: "commit" },
  { id: "publish", source: "order-service", target: "kafka", label: "OrderCreated" },
  { id: "deliver", source: "kafka", target: "consumer", label: "entrega" },
] as const satisfies readonly DiagramEdge[];

export const naiveTables = [
  { id: "orders", title: "Orders", columns: ["Pedido", "Cliente", "Estado"] },
  { id: "consumerLog", title: "Consumidor", columns: ["Evento", "Resultado"] },
] as const satisfies readonly TableSchema[];

export const naiveNodeIds = naiveNodes.map((node) => node.id);
