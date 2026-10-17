import type { TableRow } from "@architecture-lab/simulation-engine";
import { stage, step } from "../transactional-outbox/builders";
import { naiveNodeIds } from "./diagram";

const nodes = naiveNodeIds;

function charge(id: string, estado: string): TableRow {
  return { id, cells: { Cobrança: id, Pedido: "ord-1042", Estado: estado } };
}

function delivery(ack: string): TableRow {
  return { id: "msg-1042", cells: { Mensagem: "msg-1042", Ack: ack } };
}

const empty = {
  charges: [] as TableRow[],
  delivery: [] as TableRow[],
};

export const naiveInitial = {
  title: "Aguardando a mensagem",
  narrative: "O consumidor ainda não recebeu OrderCreated. Não há cobrança registrada.",
  components: stage(nodes, {}),
  tables: empty,
  notes: [] as string[],
};

const delivered = step({
  id: "naive-delivered",
  title: "Mensagem entregue",
  narrative: "O Kafka entrega OrderCreated. O fluxo grava a cobrança direto, sem inbox.",
  event: {
    id: "naive-deliver",
    type: "broker.deliver",
    description: "Kafka entrega OrderCreated.",
    source: "kafka",
    target: "consumer",
    outcome: "pending",
  },
  components: stage(nodes, {
    kafka: { status: "success" },
    consumer: { status: "processing" },
  }),
  activeEdgeIds: ["deliver"],
  tables: empty,
});

const committed = step({
  id: "naive-committed",
  title: "Cobrança gravada",
  narrative: "A cobrança é confirmada sem registrar o identificador da mensagem.",
  event: {
    id: "naive-commit",
    type: "db.commit",
    description: "Commit apenas de Charges.",
    source: "consumer",
    target: "database",
    outcome: "success",
  },
  components: stage(nodes, {
    kafka: { status: "waiting", detail: "sem ack" },
    consumer: { status: "processing" },
    database: { status: "success" },
  }),
  activeEdgeIds: ["write"],
  tables: {
    charges: [charge("chg-1042", "Registrada")],
    delivery: [delivery("Ainda não")],
  },
});

const acked = step({
  id: "naive-acked",
  title: "Offset confirmado",
  narrative: "O ack sai depois da cobrança. Nada no banco lembra que msg-1042 já foi aplicada.",
  event: {
    id: "naive-ack",
    type: "broker.ack",
    description: "Billing confirma o offset.",
    source: "consumer",
    target: "kafka",
    outcome: "success",
  },
  components: stage(nodes, {
    kafka: { status: "success", detail: "ack" },
    consumer: { status: "success" },
    database: { status: "success" },
  }),
  activeEdgeIds: ["deliver"],
  tables: {
    charges: [charge("chg-1042", "Registrada")],
    delivery: [delivery("Confirmado")],
  },
});

const databaseDown = step({
  id: "naive-database-down",
  title: "Banco indisponível",
  narrative: "A cobrança não é gravada e o offset não é confirmado.",
  event: {
    id: "naive-db-down",
    type: "db.unavailable",
    description: "O banco recusa a gravação.",
    source: "consumer",
    target: "database",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "waiting", detail: "sem ack" },
    consumer: { status: "failure" },
    database: { status: "failure", detail: "indisponível" },
  }),
  activeEdgeIds: ["write"],
  tables: empty,
});

const crashed = step({
  id: "naive-crashed",
  title: "Processo interrompido",
  narrative:
    "A cobrança já existe, mas o processo morre antes do ack. O identificador da mensagem não foi guardado.",
  event: {
    id: "naive-crash",
    type: "consumer.crash",
    description: "O consumidor para antes do ack.",
    source: "consumer",
    target: "kafka",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "waiting", detail: "sem ack" },
    consumer: { status: "failure", detail: "interrompido" },
    database: { status: "success" },
  }),
  activeEdgeIds: ["deliver"],
  tables: {
    charges: [charge("chg-1042", "Registrada")],
    delivery: [delivery("Ainda não")],
  },
});

const duplicated = step({
  id: "naive-duplicated",
  title: "Cobrança repetida",
  narrative:
    "A nova entrega não encontra um registro da mensagem. O consumidor grava uma segunda cobrança do mesmo pedido.",
  event: {
    id: "naive-duplicate",
    type: "charge.duplicated",
    description: "Uma segunda cobrança é confirmada.",
    source: "consumer",
    target: "database",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "processing", detail: "reentrega" },
    consumer: { status: "failure", detail: "efeito repetido" },
    database: { status: "failure", detail: "segunda cobrança" },
  }),
  activeEdgeIds: ["write"],
  tables: {
    charges: [charge("chg-1042", "Registrada"), charge("chg-1043", "Registrada")],
    delivery: [delivery("Ainda não")],
  },
  notes: ["Sem a inbox, a reentrega repete o efeito."],
});

const ackedFirst = step({
  id: "naive-acked-first",
  title: "Ack antes do efeito",
  narrative:
    "O offset é confirmado antes de a cobrança existir. O broker considera a mensagem concluída.",
  event: {
    id: "naive-ack-first",
    type: "broker.ack",
    description: "O ack sai antes do commit.",
    source: "consumer",
    target: "kafka",
    outcome: "pending",
  },
  components: stage(nodes, {
    kafka: { status: "success", detail: "ack" },
    consumer: { status: "processing" },
    database: { status: "inactive" },
  }),
  activeEdgeIds: ["deliver"],
  tables: {
    charges: [],
    delivery: [delivery("Confirmado")],
  },
});

const lost = step({
  id: "naive-lost",
  title: "Efeito perdido",
  narrative:
    "O processo para depois do ack e antes da gravação. A mensagem não volta, e a cobrança não existe.",
  event: {
    id: "naive-lost",
    type: "effect.lost",
    description: "Não há reentrega nem cobrança.",
    source: "consumer",
    target: "database",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "success", detail: "já confirmado" },
    consumer: { status: "failure", detail: "interrompido" },
    database: { status: "failure", detail: "vazio" },
  }),
  activeEdgeIds: ["write"],
  tables: {
    charges: [],
    delivery: [delivery("Confirmado")],
  },
  notes: ["Confirmar o broker antes do commit pode perder o efeito."],
});

export const naiveFrames = {
  happy: [delivered, committed, acked],
  delivered,
  databaseDown,
  committed,
  crashed,
  duplicated,
  ackedFirst,
  lost,
};
