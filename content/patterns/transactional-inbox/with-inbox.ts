import type { TableRow } from "@architecture-lab/simulation-engine";
import { stage, step } from "../transactional-outbox/builders";
import { withNodeIds } from "./diagram";

const nodes = withNodeIds;

function charge(id: string, estado: string): TableRow {
  return { id, cells: { Cobrança: id, Pedido: "ord-1042", Estado: estado } };
}

function inbox(estado: string): TableRow {
  return {
    id: "msg-1042",
    cells: { Mensagem: "msg-1042", Evento: "OrderCreated", Estado: estado },
  };
}

function delivery(ack: string): TableRow {
  return { id: "msg-1042", cells: { Mensagem: "msg-1042", Ack: ack } };
}

const empty = {
  charges: [] as TableRow[],
  inbox: [] as TableRow[],
  delivery: [] as TableRow[],
};

const saved = {
  charges: [charge("chg-1042", "Registrada")],
  inbox: [inbox("Processada")],
  delivery: [delivery("Ainda não")],
};

export const inboxInitial = {
  title: "Aguardando a mensagem",
  narrative:
    "Nenhuma cobrança foi registrada. InboxMessages está vazia e o offset de OrderCreated ainda não foi confirmado.",
  components: stage(nodes, {}),
  tables: empty,
  notes: [] as string[],
};

const delivered = step({
  id: "delivered",
  title: "Mensagem entregue",
  narrative:
    "O Kafka entrega OrderCreated ao Billing. Receber a mensagem ainda não registra a cobrança.",
  event: {
    id: "inbox-deliver",
    type: "broker.deliver",
    description: "Kafka entrega OrderCreated.",
    source: "kafka",
    target: "consumer",
    outcome: "pending",
  },
  components: stage(nodes, {
    kafka: { status: "success" },
    consumer: { status: "processing", detail: "OrderCreated" },
  }),
  activeEdgeIds: ["deliver"],
  tables: empty,
  notes: ["A entrega não é o efeito de negócio."],
});

const begun = step({
  id: "begun",
  title: "Transação aberta",
  narrative: "O consumidor abre a transação local antes de gravar a inbox e a cobrança.",
  event: {
    id: "inbox-begin",
    type: "db.begin",
    description: "BEGIN da transação local.",
    source: "consumer",
    target: "database",
    outcome: "pending",
  },
  components: stage(nodes, {
    kafka: { status: "waiting" },
    consumer: { status: "processing" },
    database: { status: "processing", detail: "BEGIN" },
  }),
  activeEdgeIds: ["write"],
  tables: empty,
});

const committed = step({
  id: "committed",
  title: "Efeito e inbox gravados",
  narrative:
    "A cobrança e o identificador da mensagem entram no mesmo commit. O ack do Kafka ainda não foi enviado.",
  event: {
    id: "inbox-commit",
    type: "db.commit",
    description: "Commit de Charges e InboxMessages.",
    source: "consumer",
    target: "database",
    outcome: "success",
  },
  components: stage(nodes, {
    kafka: { status: "waiting", detail: "sem ack" },
    consumer: { status: "processing" },
    database: { status: "success", detail: "commit" },
  }),
  activeEdgeIds: ["write"],
  tables: saved,
  notes: ["O commit local acontece antes da confirmação do broker."],
});

const acked = step({
  id: "acked",
  title: "Offset confirmado",
  narrative:
    "O consumidor confirma a mensagem depois do commit. Uma nova entrega da mesma mensagem encontra a inbox.",
  event: {
    id: "inbox-ack",
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
    ...saved,
    delivery: [delivery("Confirmado")],
  },
});

const databaseDown = step({
  id: "database-down",
  title: "Banco indisponível",
  narrative:
    "A transação não abre. Não há cobrança, não há inbox e o offset continua sem confirmação.",
  event: {
    id: "inbox-db-down",
    type: "db.unavailable",
    description: "O banco recusa a transação.",
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
  notes: ["Sem gravação, a mensagem pode ser entregue de novo."],
});

const staged = step({
  id: "staged",
  title: "Registros ainda não confirmados",
  narrative: "Cobrança e inbox estão na transação aberta. Um erro agora desfaz as duas.",
  event: {
    id: "inbox-staged",
    type: "db.stage",
    description: "INSERT ainda não confirmado.",
    source: "consumer",
    target: "database",
    outcome: "pending",
  },
  components: stage(nodes, {
    kafka: { status: "waiting" },
    consumer: { status: "processing" },
    database: { status: "processing", detail: "não confirmado" },
  }),
  activeEdgeIds: ["write"],
  tables: {
    charges: [charge("chg-1042", "Não confirmado")],
    inbox: [inbox("Não confirmado")],
    delivery: [],
  },
});

const rolledBack = step({
  id: "rolled-back",
  title: "Transação revertida",
  narrative: "O rollback remove a cobrança e a inbox. O Kafka não recebe ack.",
  event: {
    id: "inbox-rollback",
    type: "db.rollback",
    description: "ROLLBACK da transação local.",
    source: "database",
    target: "consumer",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "waiting", detail: "sem ack" },
    consumer: { status: "failure" },
    database: { status: "failure", detail: "rollback" },
  }),
  activeEdgeIds: ["write"],
  tables: empty,
});

const crashed = step({
  id: "crashed",
  title: "Processo interrompido",
  narrative:
    "O commit já aconteceu, mas o processo morre antes do ack. A cobrança e a inbox continuam no banco.",
  event: {
    id: "inbox-crash",
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
  activeEdgeIds: [],
  tables: saved,
  notes: ["O efeito sobrevive na transação local, não na memória do processo."],
});

const redelivered = step({
  id: "redelivered",
  title: "Mensagem entregue de novo",
  narrative: "Sem o ack, o Kafka entrega OrderCreated outra vez. A inbox já contém msg-1042.",
  event: {
    id: "inbox-redeliver",
    type: "broker.deliver",
    description: "Kafka entrega OrderCreated de novo.",
    source: "kafka",
    target: "consumer",
    outcome: "pending",
  },
  components: stage(nodes, {
    kafka: { status: "processing", detail: "reentrega" },
    consumer: { status: "processing" },
    database: { status: "success" },
  }),
  activeEdgeIds: ["deliver"],
  tables: saved,
});

const ignored = step({
  id: "ignored",
  title: "Cópia ignorada",
  narrative: "O consumidor encontra a mensagem na inbox e não cria outra cobrança.",
  event: {
    id: "inbox-ignore",
    type: "inbox.hit",
    description: "A chave da mensagem já existe.",
    source: "consumer",
    target: "database",
    outcome: "success",
  },
  components: stage(nodes, {
    kafka: { status: "waiting" },
    consumer: { status: "success", detail: "idempotente" },
    database: { status: "success" },
  }),
  activeEdgeIds: ["write"],
  tables: saved,
  notes: ["Ignorado pela idempotência. A cobrança continua única."],
});

function rejection(attempt: string, id: string) {
  return step({
    id,
    title: `Tentativa ${attempt} recusada`,
    narrative:
      "A cobrança é inválida para este evento. A transação desfaz o efeito e não marca a inbox como processada.",
    event: {
      id: `inbox-reject-${attempt}`,
      type: "message.rejected",
      description: `Tentativa ${attempt} de 3.`,
      source: "consumer",
      target: "database",
      outcome: "failure",
    },
    components: stage(nodes, {
      kafka: { status: "waiting", detail: "sem ack" },
      consumer: { status: "failure", detail: `tentativa ${attempt}` },
      database: { status: "failure", detail: "rollback" },
    }),
    activeEdgeIds: ["write"],
    tables: empty,
    notes: ["Uma falha de negócio não pode parecer consumo concluído."],
  });
}

const parked = step({
  id: "parked",
  title: "Mensagem retida",
  narrative:
    "Depois de três tentativas, a mensagem fica retida para inspeção. Charges e InboxMessages continuam vazias.",
  event: {
    id: "inbox-park",
    type: "broker.park",
    description: "A mensagem sai do retry e fica retida.",
    source: "kafka",
    target: "consumer",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "failure", detail: "retida" },
    consumer: { status: "inactive" },
    database: { status: "inactive" },
  }),
  activeEdgeIds: ["deliver"],
  tables: {
    charges: [],
    inbox: [],
    delivery: [delivery("Retida")],
  },
  notes: ["O limite de três tentativas é uma escolha didática."],
});

const claimed = step({
  id: "claimed",
  title: "Chave reservada",
  narrative:
    "O primeiro consumidor insere msg-1042 e a cobrança na mesma transação. A chave única da mensagem fica com ele.",
  event: {
    id: "inbox-claim",
    type: "db.commit",
    description: "Commit condicionado à chave msg-1042.",
    source: "consumer",
    target: "database",
    outcome: "success",
  },
  components: stage(nodes, {
    kafka: { status: "waiting" },
    consumer: { status: "processing", detail: "consumer-a" },
    database: { status: "success" },
    rival: { status: "processing", detail: "mesma mensagem" },
  }),
  activeEdgeIds: ["write", "race"],
  tables: {
    charges: [charge("chg-1042", "Registrada")],
    inbox: [inbox("Processada · consumer-a")],
    delivery: [delivery("Ainda não")],
  },
});

const rivalLoses = step({
  id: "rival-loses",
  title: "Segundo consumidor recusado",
  narrative:
    "A segunda inserção de msg-1042 viola a chave única. Nenhuma cobrança extra é gravada.",
  event: {
    id: "inbox-conflict",
    type: "consumer.conflict",
    description: "A chave única recusa o segundo consumidor.",
    source: "rival",
    target: "database",
    outcome: "failure",
  },
  components: stage(nodes, {
    kafka: { status: "waiting" },
    consumer: { status: "success", detail: "consumer-a" },
    database: { status: "success" },
    rival: { status: "failure", detail: "chave única" },
  }),
  activeEdgeIds: ["race"],
  tables: {
    charges: [charge("chg-1042", "Registrada")],
    inbox: [inbox("Processada · consumer-a")],
    delivery: [delivery("Ainda não")],
  },
  notes: ["Ler a inbox e inserir depois, em comandos separados, abriria esta corrida."],
});

export const inboxFrames = {
  happy: [delivered, begun, committed, acked],
  delivered,
  databaseDown,
  begun,
  staged,
  rolledBack,
  committed,
  crashed,
  redelivered,
  ignored,
  acked,
  rejection,
  parked,
  claimed,
  rivalLoses,
};
