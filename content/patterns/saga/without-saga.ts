import type { TableRow } from "@architecture-lab/simulation-engine";
import { stage, step } from "../transactional-outbox/builders";
import { naiveNodeIds } from "./diagram";

const nodes = naiveNodeIds;

function paymentRow(estado: string): TableRow {
  return { id: "pay-1042", cells: { Captura: "pay-1042", Pedido: "ord-1042", Estado: estado } };
}

function inventoryRow(estado: string): TableRow {
  return { id: "rsv-1042", cells: { Reserva: "rsv-1042", Pedido: "ord-1042", Estado: estado } };
}

function shippingRow(estado: string): TableRow {
  return { id: "shp-1042", cells: { Remessa: "shp-1042", Pedido: "ord-1042", Estado: estado } };
}

function tables(input: { payment?: TableRow[]; inventory?: TableRow[]; shipping?: TableRow[] }) {
  return {
    payment: input.payment ?? [],
    inventory: input.inventory ?? [],
    shipping: input.shipping ?? [],
  };
}

const empty = tables({});

export const naiveInitial = {
  title: "Aguardando o pedido",
  narrative:
    "O caixa ainda não chamou pagamento, estoque nem envio. Não existe uma saga para retomar.",
  components: stage(nodes, {}),
  tables: empty,
  notes: [] as string[],
};

const chargeAsked = step({
  id: "naive-charge",
  title: "Captura pedida",
  narrative:
    "O caixa pede a captura direto ao pagamento. Não há um processo durável ao lado dessa chamada.",
  event: {
    id: "naive-charge",
    type: "payment.charge",
    description: "O caixa pede a captura.",
    source: "checkout",
    target: "payment",
    outcome: "pending",
  },
  components: stage(nodes, {
    checkout: { status: "processing", detail: "ord-1042" },
    payment: { status: "processing", detail: "pay-1042" },
  }),
  activeEdgeIds: ["charge"],
  tables: empty,
});

const paid = step({
  id: "naive-paid",
  title: "Pagamento confirmado",
  narrative:
    "O pagamento confirma a captura. O caixa ainda não guardou um passo que outra pessoa possa retomar.",
  event: {
    id: "naive-paid",
    type: "payment.captured",
    description: "O pagamento confirma a captura.",
    source: "payment",
    target: "checkout",
    outcome: "success",
  },
  components: stage(nodes, {
    checkout: { status: "processing", detail: "pago" },
    payment: { status: "success", detail: "Capturado" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({ payment: [paymentRow("Capturado")] }),
});

const reserveAsked = step({
  id: "naive-reserve",
  title: "Reserva pedida",
  narrative:
    "O caixa segue para o estoque porque a chamada anterior voltou. O próximo passo mora só na memória do processo.",
  event: {
    id: "naive-reserve",
    type: "inventory.reserve",
    description: "O caixa pede a reserva.",
    source: "checkout",
    target: "inventory",
    outcome: "pending",
  },
  components: stage(nodes, {
    checkout: { status: "processing", detail: "pede reserva" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "processing" },
  }),
  activeEdgeIds: ["reserve"],
  tables: tables({ payment: [paymentRow("Capturado")] }),
});

const reserved = step({
  id: "naive-reserved",
  title: "Estoque reservado",
  narrative:
    "O estoque reserva o item. Ainda não existe uma saga que saiba compensar se o envio falhar.",
  event: {
    id: "naive-reserved",
    type: "inventory.reserved",
    description: "O estoque confirma a reserva.",
    source: "inventory",
    target: "checkout",
    outcome: "success",
  },
  components: stage(nodes, {
    checkout: { status: "processing", detail: "reservado" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
  }),
  activeEdgeIds: ["reserve"],
  tables: tables({
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
  }),
});

const shipAsked = step({
  id: "naive-ship",
  title: "Envio pedido",
  narrative: "O caixa pede o envio em seguida. Cada serviço confirma por conta própria.",
  event: {
    id: "naive-ship",
    type: "shipping.create",
    description: "O caixa pede o envio.",
    source: "checkout",
    target: "shipping",
    outcome: "pending",
  },
  components: stage(nodes, {
    checkout: { status: "processing", detail: "pede envio" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
    shipping: { status: "processing" },
  }),
  activeEdgeIds: ["ship"],
  tables: tables({
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
  }),
});

const shipped = step({
  id: "naive-shipped",
  title: "Envio confirmado",
  narrative:
    "O envio confirma a remessa e o caixa responde. No caminho feliz os três efeitos existem, sem um registro do processo.",
  event: {
    id: "naive-shipped",
    type: "shipping.created",
    description: "O envio confirma a remessa.",
    source: "shipping",
    target: "checkout",
    outcome: "success",
  },
  components: stage(nodes, {
    checkout: { status: "success", detail: "201 Created" },
    payment: { status: "success", detail: "Capturado" },
    inventory: { status: "success", detail: "Reservado" },
    shipping: { status: "success", detail: "Criado" },
  }),
  activeEdgeIds: ["ship"],
  tables: tables({
    payment: [paymentRow("Capturado")],
    inventory: [inventoryRow("Reservado")],
    shipping: [shippingRow("Criado")],
  }),
});

const abandoned = step({
  id: "payment-abandoned",
  title: "Processo abandonado",
  narrative:
    "A captura ficou feita e o caixa caiu antes de pedir a reserva. Ninguém continua o pedido e ninguém pede o estorno.",
  event: {
    id: "checkout-down",
    type: "checkout.crash",
    description: "O caixa cai depois da captura.",
    source: "checkout",
    target: "payment",
    outcome: "failure",
  },
  components: stage(nodes, {
    checkout: { status: "failure", detail: "sem retomada" },
    payment: { status: "success", detail: "Capturado" },
  }),
  activeEdgeIds: ["charge"],
  tables: tables({ payment: [paymentRow("Capturado")] }),
  notes: ["Efeito sem o processo: a captura existe e não há saga para compensar."],
});

const chargeFailed = step({
  id: "charge-failed",
  title: "Captura recusada",
  narrative:
    "O pagamento recusa a captura. O caixa ainda não tem um efeito de pagamento para continuar.",
  event: {
    id: "naive-charge-failed",
    type: "payment.rejected",
    description: "O pagamento recusa a captura.",
    source: "payment",
    target: "checkout",
    outcome: "failure",
  },
  components: stage(nodes, {
    checkout: { status: "processing", detail: "sem captura" },
    payment: { status: "failure", detail: "Recusado" },
  }),
  activeEdgeIds: ["charge"],
  tables: empty,
});

const reservedAnyway = step({
  id: "reserved-anyway",
  title: "Fluxo segue sem captura",
  narrative:
    "O caixa pede a reserva mesmo sem a captura. O estoque muda e o pagamento continua vazio.",
  event: {
    id: "reserve-without-payment",
    type: "inventory.reserve",
    description: "O caixa pede a reserva sem captura.",
    source: "checkout",
    target: "inventory",
    outcome: "success",
  },
  components: stage(nodes, {
    checkout: { status: "failure", detail: "seguiu assim mesmo" },
    payment: { status: "failure", detail: "Recusado" },
    inventory: { status: "success", detail: "Reservado" },
  }),
  activeEdgeIds: ["reserve"],
  tables: tables({ inventory: [inventoryRow("Reservado")] }),
  notes: ["Processo sem o efeito: o fluxo avançou e a captura não ocorreu."],
});

export const naiveFrames = {
  happy: [chargeAsked, paid, reserveAsked, reserved, shipAsked, shipped],
  paymentWithoutProcess: [chargeAsked, paid, abandoned],
  processWithoutEffect: [chargeAsked, chargeFailed, reservedAnyway],
};
