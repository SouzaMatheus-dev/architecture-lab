import type { DiagramEdge, DiagramNode, TableSchema } from "@architecture-lab/simulation-engine";

export const withNodes = [
  { id: "client", label: "Cliente", caption: "HTTP" },
  { id: "orchestrator", label: "Orquestrador", caption: "Saga" },
  { id: "payment", label: "Pagamento", caption: "Transação local" },
  { id: "inventory", label: "Estoque", caption: "Transação local" },
  { id: "shipping", label: "Envio", caption: "Transação local" },
] as const satisfies readonly DiagramNode[];

export const withEdges = [
  { id: "request", source: "client", target: "orchestrator", label: "pedido" },
  { id: "charge", source: "orchestrator", target: "payment", label: "captura" },
  { id: "reserve", source: "orchestrator", target: "inventory", label: "reserva" },
  { id: "ship", source: "orchestrator", target: "shipping", label: "envio" },
] as const satisfies readonly DiagramEdge[];

export const withTables = [
  { id: "process", title: "Saga", columns: ["Processo", "Passo", "Estado"] },
  { id: "payment", title: "Pagamento", columns: ["Captura", "Pedido", "Estado"] },
  { id: "inventory", title: "Estoque", columns: ["Reserva", "Pedido", "Estado"] },
  { id: "shipping", title: "Envio", columns: ["Remessa", "Pedido", "Estado"] },
] as const satisfies readonly TableSchema[];

export const withLayout = {
  client: { x: 0, y: 100 },
  orchestrator: { x: 260, y: 100 },
  payment: { x: 540, y: 0 },
  inventory: { x: 540, y: 140 },
  shipping: { x: 540, y: 280 },
} as const;

export const withNodeIds = withNodes.map((node) => node.id);

export const naiveNodes = [
  { id: "checkout", label: "Caixa", caption: "Sem processo" },
  { id: "payment", label: "Pagamento", caption: "Transação local" },
  { id: "inventory", label: "Estoque", caption: "Transação local" },
  { id: "shipping", label: "Envio", caption: "Transação local" },
] as const satisfies readonly DiagramNode[];

export const naiveEdges = [
  { id: "charge", source: "checkout", target: "payment", label: "captura" },
  { id: "reserve", source: "checkout", target: "inventory", label: "reserva" },
  { id: "ship", source: "checkout", target: "shipping", label: "envio" },
] as const satisfies readonly DiagramEdge[];

export const naiveTables = [
  { id: "payment", title: "Pagamento", columns: ["Captura", "Pedido", "Estado"] },
  { id: "inventory", title: "Estoque", columns: ["Reserva", "Pedido", "Estado"] },
  { id: "shipping", title: "Envio", columns: ["Remessa", "Pedido", "Estado"] },
] as const satisfies readonly TableSchema[];

export const naiveLayout = {
  checkout: { x: 0, y: 100 },
  payment: { x: 280, y: 0 },
  inventory: { x: 280, y: 160 },
  shipping: { x: 560, y: 80 },
} as const;

export const naiveNodeIds = naiveNodes.map((node) => node.id);
