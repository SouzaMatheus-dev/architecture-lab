import type { TableRow } from "@architecture-lab/simulation-engine";
import { delivery, order, stage, step } from "./builders";
import { naiveNodeIds } from "./diagram";

const ids = naiveNodeIds;

function blank(): Record<string, TableRow[]> {
  return { orders: [], consumerLog: [] };
}

function data(partial: Record<string, TableRow[]>): Record<string, TableRow[]> {
  return { ...blank(), ...partial };
}

const receive = step({
  id: "receive",
  title: "Pedido recebido",
  narrative:
    "O cliente envia POST /orders. O serviço vai gravar o pedido e, em outra operação, publicar o evento.",
  event: {
    id: "receive",
    type: "http.request",
    description: "POST /orders chega ao Order Service.",
    source: "client",
    target: "order-service",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "processing", detail: "POST /orders" },
    "order-service": { status: "processing", detail: "Validando pedido" },
  }),
  activeEdgeIds: ["request"],
  tables: blank(),
});

const commit = step({
  id: "commit",
  title: "Pedido confirmado",
  narrative:
    "O banco confirma somente o pedido. Não existe uma linha durável representando a intenção de publicar OrderCreated.",
  event: {
    id: "commit",
    type: "db.commit",
    description: "Commit da tabela Orders.",
    source: "order-service",
    target: "database",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando resposta" },
    "order-service": { status: "processing", detail: "Pedido gravado" },
    database: { status: "success", detail: "Orders confirmada" },
  }),
  activeEdgeIds: ["write"],
  tables: data({ orders: [order("Confirmado")] }),
  notes: ["A partir daqui, uma falha do Kafka não tem uma pendência para retomar."],
});

const publish = step({
  id: "publish",
  title: "Publicação direta",
  narrative:
    "O próprio Order Service publica no Kafka. Essa chamada está fora da transação que gravou o pedido.",
  event: {
    id: "publish",
    type: "broker.publish",
    description: "Order Service produz OrderCreated.",
    source: "order-service",
    target: "kafka",
    outcome: "pending",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando Kafka" },
    "order-service": { status: "processing", detail: "Publicando" },
    database: { status: "success", detail: "Pedido já confirmado" },
    kafka: { status: "processing", detail: "Recebendo evento" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({ orders: [order("Confirmado")] }),
});

const ack = step({
  id: "ack",
  title: "Broker confirma",
  narrative:
    "O Kafka aceita o evento. Só então a API responde ao cliente. A latência do broker entra na requisição.",
  event: {
    id: "ack",
    type: "broker.ack",
    description: "Kafka confirma a publicação feita pelo serviço.",
    source: "kafka",
    target: "order-service",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando resposta" },
    "order-service": { status: "processing", detail: "Ack recebido" },
    database: { status: "success", detail: "Pedido confirmado" },
    kafka: { status: "success", detail: "Evento aceito" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({ orders: [order("Confirmado")] }),
});

const respond = step({
  id: "respond",
  title: "Resposta ao cliente",
  narrative:
    "A API responde 201 somente depois da publicação. O cliente esperou o banco e o Kafka.",
  event: {
    id: "respond",
    type: "http.response",
    description: "201 Created devolvido depois do ack.",
    source: "order-service",
    target: "client",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido publicado" },
    database: { status: "success", detail: "Pedido confirmado" },
    kafka: { status: "success", detail: "Evento aceito" },
  }),
  activeEdgeIds: ["request"],
  tables: data({ orders: [order("Confirmado")] }),
});

const consume = step({
  id: "consume",
  title: "Evento consumido",
  narrative:
    "O consumidor recebe OrderCreated. Neste caminho feliz não houve janela de falha entre o commit e o broker.",
  event: {
    id: "consume",
    type: "consumer.handle",
    description: "Consumidor recebe o evento publicado pelo serviço.",
    source: "kafka",
    target: "consumer",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido publicado" },
    database: { status: "success", detail: "Pedido confirmado" },
    kafka: { status: "success", detail: "Evento entregue" },
    consumer: { status: "success", detail: "Efeito aplicado" },
  }),
  activeEdgeIds: ["deliver"],
  tables: data({
    orders: [order("Confirmado")],
    consumerLog: [delivery("delivery-1", "Aplicado")],
  }),
});

const databaseDown = step({
  id: "database-down",
  title: "Banco indisponível",
  narrative:
    "O pedido não é confirmado. Como a publicação ainda não começou, também não existe evento órfão.",
  event: {
    id: "database-down",
    type: "db.commit",
    description: "O banco recusa a gravação do pedido.",
    source: "order-service",
    target: "database",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "failure", detail: "Erro 503" },
    "order-service": { status: "failure", detail: "Pedido não gravado" },
    database: { status: "failure", detail: "Indisponível" },
  }),
  activeEdgeIds: ["write"],
  tables: blank(),
});

const publishFailed = step({
  id: "publish-failed",
  title: "Kafka indisponível",
  narrative:
    "O pedido já foi confirmado e a publicação falha. Não há registro da intenção de publicar, então o evento se perde.",
  event: {
    id: "publish-failed",
    type: "broker.publish",
    description: "A publicação direta falha depois do commit.",
    source: "order-service",
    target: "kafka",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando erro" },
    "order-service": { status: "failure", detail: "Publicação falhou" },
    database: { status: "success", detail: "Pedido confirmado" },
    kafka: { status: "failure", detail: "Indisponível" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({ orders: [order("Confirmado")] }),
});

const inconsistent = step({
  id: "inconsistent",
  title: "Estado inconsistente",
  narrative:
    "A API devolve erro, mas o pedido existe. Se o cliente repetir o POST, pode criar outro pedido. Se alguém tratar o erro como ausência de pedido, o evento perdido não será reconstituído com segurança.",
  event: {
    id: "inconsistent",
    type: "http.response",
    description: "Erro devolvido ao cliente depois de um commit bem-sucedido.",
    source: "order-service",
    target: "client",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "failure", detail: "Erro após o commit" },
    "order-service": { status: "failure", detail: "Sem pendência para retry" },
    database: { status: "success", detail: "Pedido órfão" },
    kafka: { status: "failure", detail: "Evento não publicado" },
    consumer: { status: "inactive", detail: "Nada para consumir" },
  }),
  activeEdgeIds: ["request"],
  tables: data({ orders: [order("Confirmado")] }),
  notes: ["Não existe OutboxMessages para um worker retomar a publicação."],
});

export const naiveInitial = {
  title: "Aguardando o pedido",
  narrative:
    "O fluxo publica direto no Kafka, depois de gravar o pedido. Não há tabela de mensagens pendentes.",
  components: stage(ids, {}),
  tables: blank(),
};

export const naiveFrames = {
  happy: [receive, commit, publish, ack, respond, consume],
  receive,
  commit,
  databaseDown,
  publishFailed,
  inconsistent,
};
