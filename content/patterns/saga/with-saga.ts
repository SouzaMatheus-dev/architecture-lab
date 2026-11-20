import type { TableRow } from "@architecture-lab/simulation-engine";
import { stage, step } from "../transactional-outbox/builders";
import { withNodeIds } from "./diagram";

const nodes = withNodeIds;

function processRow(passo: string, estado: string): TableRow {
  return { id: "saga-1042", cells: { Processo: "saga-1042", Passo: passo, Estado: estado } };
}

function paymentRow(estado: string): TableRow {
  return { id: "pay-1042", cells: { Captura: "pay-1042", Pedido: "ord-1042", Estado: estado } };
}

function inventoryRow(estado: string): TableRow {
  return { id: "rsv-1042", cells: { Reserva: "rsv-1042", Pedido: "ord-1042", Estado: estado } };
}

function shippingRow(estado: string): TableRow {
  return { id: "shp-1042", cells: { Remessa: "shp-1042", Pedido: "ord-1042", Estado: estado } };
}

function tables(input: {
  process?: TableRow[];
  payment?: TableRow[];
  inventory?: TableRow[];
  shipping?: TableRow[];
}) {
  return {
    process: input.process ?? [],
    payment: input.payment ?? [],
    inventory: input.inventory ?? [],
    shipping: input.shipping ?? [],
  };
}

const empty = tables({});

export const sagaInitial = {
  title: "Aguardando o pedido",
  narrative:
    "Nenhum passo foi pedido. A saga, o pagamento, o estoque e o envio ainda não têm registro.",
  components: stage(nodes, {}),
  tables: empty,
  notes: [] as string[],
};

const received = step({
  id: "received",
  title: "Pedido recebido",
  narrative:
    "O cliente pede o pedido. O orquestrador abre a saga antes de chamar qualquer serviço.",
  event: {
    id: "saga-open",
    type: "saga.open",
    description: "O cliente abre o processo no orquestrador.",
    source: "client",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "success", detail: "POST" },
    orchestrator: { status: "processing", detail: "saga-1042" },
  }),
  activeEdgeIds: ["request"],
  tables: tables({ process: [processRow("Aberto", "Em curso")] }),
});

const chargeAsked = step({
  id: "charge-asked",
  title: "Captura pedida",
  narrative:
    "O orquestrador grava o passo e pede a captura. A chamada ao pagamento fica fora da transação da saga.",
  event: {
    id: "charge-ask",
    type: "payment.charge",
    description: "O orquestrador pede a captura ao pagamento.",
    source: "orchestrator",
    target: "payment",
    outcome: "pending",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "pede captura" },
    payment: { status: "processing", detail: "pay-1042" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({ process: [processRow("Captura pedida", "Em curso")] }),
});

const paid = step({
  id: "paid",
  title: "Pagamento confirmado",
  narrative:
    "O pagamento confirma a captura na própria transação e responde ao orquestrador. O estoque ainda não foi pedido.",
  event: {
    id: "charge-ok",
    type: "payment.captured",
    description: "O pagamento confirma a captura.",
    source: "payment",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "pago" },
    payment: { status: "success", detail: "Capturado" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Pago", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
});

const reserveAsked = step({
  id: "reserve-asked",
  title: "Reserva pedida",
  narrative: "Com o pagamento registrado, o orquestrador pede a reserva ao estoque.",
  event: {
    id: "reserve-ask",
    type: "inventory.reserve",
    description: "O orquestrador pede a reserva ao estoque.",
    source: "orchestrator",
    target: "inventory",
    outcome: "pending",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "pede reserva" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "processing", detail: "rsv-1042" },
  }),
  activeEdgeIds: ["reserve"],
  tables: tables({
    process: [processRow("Reserva pedida", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
});

const reserved = step({
  id: "reserved",
  title: "Estoque reservado",
  narrative:
    "O estoque reserva na própria transação e responde. Outro pedido já pode ver essa reserva.",
  event: {
    id: "reserve-ok",
    type: "inventory.reserved",
    description: "O estoque confirma a reserva.",
    source: "inventory",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "reservado" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
  }),
  activeEdgeIds: ["reserve"],
  tables: tables({
    process: [processRow("Reservado", "Em curso")],
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
  }),
  notes: ["A saga não isola o estoque dos outros pedidos."],
});

const shipAsked = step({
  id: "ship-asked",
  title: "Envio pedido",
  narrative: "O orquestrador pede a criação do envio. Pagamento e estoque continuam confirmados.",
  event: {
    id: "ship-ask",
    type: "shipping.create",
    description: "O orquestrador pede o envio.",
    source: "orchestrator",
    target: "shipping",
    outcome: "pending",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "pede envio" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
    shipping: { status: "processing", detail: "shp-1042" },
  }),
  activeEdgeIds: ["ship"],
  tables: tables({
    process: [processRow("Envio pedido", "Em curso")],
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
  }),
});

const shipped = step({
  id: "shipped",
  title: "Envio confirmado",
  narrative: "O envio grava a remessa na própria transação e responde ao orquestrador.",
  event: {
    id: "ship-ok",
    type: "shipping.created",
    description: "O envio confirma a remessa.",
    source: "shipping",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "enviado" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
    shipping: { status: "success", detail: "Criado" },
  }),
  activeEdgeIds: ["ship"],
  tables: tables({
    process: [processRow("Enviado", "Em curso")],
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
    shipping: [shippingRow("Criado")],
  }),
});

const answered = step({
  id: "answered",
  title: "Resposta ao cliente",
  narrative:
    "O orquestrador marca a saga como concluída e responde ao cliente. Cada serviço manteve a própria transação.",
  event: {
    id: "saga-complete",
    type: "saga.complete",
    description: "O orquestrador responde ao cliente.",
    source: "orchestrator",
    target: "client",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "success", detail: "201 Created" },
    orchestrator: { status: "success", detail: "Concluída" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
    shipping: { status: "success", detail: "Criado" },
  }),
  activeEdgeIds: ["request"],
  tables: tables({
    process: [processRow("Concluído", "Concluída")],
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
    shipping: [shippingRow("Criado")],
  }),
});

const stockRejected = step({
  id: "stock-rejected",
  title: "Estoque recusa",
  narrative:
    "O estoque recusa a reserva. A captura continua feita. A saga ainda não pediu o estorno.",
  event: {
    id: "reserve-rejected",
    type: "inventory.rejected",
    description: "O estoque recusa a reserva.",
    source: "inventory",
    target: "orchestrator",
    outcome: "failure",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "reserva recusada" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "failure", detail: "Sem saldo" },
  }),
  activeEdgeIds: ["reserve"],
  tables: tables({
    process: [processRow("Reserva recusada", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
});

const refundAsked = step({
  id: "refund-asked",
  title: "Estorno pedido",
  narrative:
    "O orquestrador pede o estorno. A compensação é outro passo do pagamento, não um rollback da captura.",
  event: {
    id: "refund-ask",
    type: "payment.refund",
    description: "O orquestrador pede o estorno ao pagamento.",
    source: "orchestrator",
    target: "payment",
    outcome: "pending",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "pede estorno" },
    payment: { status: "processing", detail: "estorno" },
    inventory: { status: "failure", detail: "Sem saldo" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Estorno pedido", "Compensando")],
    payment: [paymentRow("Capturado")],
  }),
  notes: ["Compensar não desfaz a transação em que a captura foi confirmada."],
});

const refunded = step({
  id: "refunded",
  title: "Estorno confirmado",
  narrative:
    "O pagamento conclui o estorno e a saga fica compensada. O pedido não segue para o envio.",
  event: {
    id: "refund-ok",
    type: "payment.refunded",
    description: "O pagamento confirma o estorno.",
    source: "payment",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "success", detail: "409 Sem estoque" },
    orchestrator: { status: "success", detail: "Compensada" },
    payment: { status: "success", detail: "Estornado" },
    inventory: { status: "failure", detail: "Sem saldo" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Compensado", "Compensada")],
    payment: [paymentRow("Estornado")],
  }),
});

const capturedBeforeLog = step({
  id: "captured-before-log",
  title: "Captura sem registro",
  narrative:
    "O pagamento já confirmou a captura. O orquestrador ainda não gravou esse passo na saga.",
  event: {
    id: "capture-before-log",
    type: "payment.captured",
    description: "O pagamento confirma a captura antes do registro da saga.",
    source: "payment",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "sem registro" },
    payment: { status: "success", detail: "Capturado" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Captura pedida", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
});

const crashed = step({
  id: "crashed",
  title: "Orquestrador cai",
  narrative: "O orquestrador cai antes de gravar o passo. A captura permanece no pagamento.",
  event: {
    id: "orchestrator-down",
    type: "saga.crash",
    description: "O orquestrador cai antes de atualizar a saga.",
    source: "orchestrator",
    target: "client",
    outcome: "failure",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "failure", detail: "sem resposta" },
    payment: { status: "success", detail: "Capturado" },
  }),
  activeEdgeIds: ["request"],
  tables: tables({
    process: [processRow("Captura pedida", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
  notes: ["A janela fica entre o commit do participante e a gravação do orquestrador."],
});

const chargeRetried = step({
  id: "charge-retried",
  title: "Captura repetida",
  narrative: "A recuperação lê a saga ainda em 'captura pedida' e repete o pedido de captura.",
  event: {
    id: "charge-retry",
    type: "payment.charge",
    description: "O orquestrador repete o pedido de captura.",
    source: "orchestrator",
    target: "payment",
    outcome: "pending",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "repete captura" },
    payment: { status: "processing", detail: "pay-1042" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Captura pedida", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
});

const captureRecognized = step({
  id: "capture-recognized",
  title: "Repetição reconhecida",
  narrative:
    "O pagamento reconhece pay-1042 e devolve a mesma captura. Não existe uma segunda cobrança.",
  event: {
    id: "capture-same",
    type: "payment.captured",
    description: "O pagamento devolve a captura já feita.",
    source: "payment",
    target: "orchestrator",
    outcome: "success",
  },
  components: stage(nodes, {
    client: { status: "waiting" },
    orchestrator: { status: "processing", detail: "pago" },
    payment: { status: "success", detail: "mesma captura" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Pago", "Em curso")],
    payment: [paymentRow("Capturado")],
  }),
  notes: ["O participante precisa reconhecer a repetição. A saga não faz isso sozinha."],
});

const refundFailed = step({
  id: "refund-failed",
  title: "Estorno recusado",
  narrative:
    "O estorno também falha. A captura continua feita e a saga fica bloqueada, à espera de intervenção. O processo não aparece como concluído.",
  event: {
    id: "refund-rejected",
    type: "payment.refund-failed",
    description: "O pagamento recusa o estorno.",
    source: "payment",
    target: "orchestrator",
    outcome: "failure",
  },
  components: stage(nodes, {
    client: { status: "waiting", detail: "sem resposta final" },
    orchestrator: { status: "failure", detail: "Bloqueada" },
    payment: { status: "failure", detail: "Estorno recusado" },
    inventory: { status: "failure", detail: "Sem saldo" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({
    process: [processRow("Estorno recusado", "Bloqueada")],
    payment: [paymentRow("Capturado")],
  }),
  notes: ["A compensação também pode falhar. A tela não marca a saga como concluída."],
});

export const sagaFrames = {
  happy: [received, chargeAsked, paid, reserveAsked, reserved, shipAsked, shipped, answered],
  stockRejected: [received, chargeAsked, paid, reserveAsked, stockRejected, refundAsked, refunded],
  crashBeforeLog: [
    received,
    chargeAsked,
    capturedBeforeLog,
    crashed,
    chargeRetried,
    captureRecognized,
  ],
  compensationRejected: [
    received,
    chargeAsked,
    paid,
    reserveAsked,
    stockRejected,
    refundAsked,
    refundFailed,
  ],
};
