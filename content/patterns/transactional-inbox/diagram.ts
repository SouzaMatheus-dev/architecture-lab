import type { DiagramEdge, DiagramNode, TableSchema } from "@architecture-lab/simulation-engine";

export const withNodes = [
  { id: "kafka", label: "Kafka", caption: "Broker" },
  { id: "consumer", label: "Billing", caption: "Consumidor" },
  { id: "database", label: "Banco de dados", caption: "Transação local" },
  { id: "rival", label: "Outro consumidor", caption: "Corrida" },
] as const satisfies readonly DiagramNode[];

export const withEdges = [
  { id: "deliver", source: "kafka", target: "consumer", label: "OrderCreated" },
  { id: "write", source: "consumer", target: "database", label: "transação" },
  { id: "race", source: "kafka", target: "rival", label: "mesma mensagem" },
  { id: "reject", source: "rival", target: "database", label: "chave" },
] as const satisfies readonly DiagramEdge[];

export const withTables = [
  { id: "charges", title: "Charges", columns: ["Cobrança", "Pedido", "Estado"] },
  { id: "inbox", title: "InboxMessages", columns: ["Mensagem", "Evento", "Estado"] },
  { id: "delivery", title: "Entrega", columns: ["Mensagem", "Ack"] },
] as const satisfies readonly TableSchema[];

export const withLayout = {
  kafka: { x: 0, y: 40 },
  consumer: { x: 280, y: 40 },
  database: { x: 560, y: 20 },
  rival: { x: 280, y: 220 },
} as const;

export const withNodeIds = withNodes.map((node) => node.id);

export const naiveNodes = [
  { id: "kafka", label: "Kafka", caption: "Broker" },
  { id: "consumer", label: "Billing", caption: "Consumidor" },
  { id: "database", label: "Banco de dados", caption: "Cobrança" },
] as const satisfies readonly DiagramNode[];

export const naiveEdges = [
  { id: "deliver", source: "kafka", target: "consumer", label: "OrderCreated" },
  { id: "write", source: "consumer", target: "database", label: "gravação" },
] as const satisfies readonly DiagramEdge[];

export const naiveTables = [
  { id: "charges", title: "Charges", columns: ["Cobrança", "Pedido", "Estado"] },
  { id: "delivery", title: "Entrega", columns: ["Mensagem", "Ack"] },
] as const satisfies readonly TableSchema[];

export const naiveLayout = {
  kafka: { x: 0, y: 80 },
  consumer: { x: 280, y: 80 },
  database: { x: 560, y: 80 },
} as const;

export const naiveNodeIds = naiveNodes.map((node) => node.id);
