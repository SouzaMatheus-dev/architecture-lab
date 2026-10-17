import type { TableRow } from "@architecture-lab/simulation-engine";
import { delivery, message, order, stage, step } from "./builders";
import { withNodeIds } from "./diagram";

const ids = withNodeIds;

function blank(): Record<string, TableRow[]> {
  return { orders: [], outbox: [], consumerLog: [] };
}

function data(partial: Record<string, TableRow[]>): Record<string, TableRow[]> {
  return { ...blank(), ...partial };
}

const receive = step({
  id: "receive",
  title: "Pedido recebido",
  narrative:
    "O cliente envia POST /orders. O Order Service valida o pedido e prepara uma transação local. O Kafka ainda não participa.",
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

const begin = step({
  id: "begin",
  title: "Transação aberta",
  narrative:
    "O serviço abre uma transação no banco. Pedido e mensagem Outbox ainda não estão confirmados.",
  event: {
    id: "begin",
    type: "db.begin",
    description: "BEGIN da transação local.",
    source: "order-service",
    target: "database",
    outcome: "pending",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando resposta" },
    "order-service": { status: "processing", detail: "Transação aberta" },
    database: { status: "processing", detail: "BEGIN" },
  }),
  activeEdgeIds: ["write"],
  tables: blank(),
});

const commit = step({
  id: "commit",
  title: "Gravação atômica",
  narrative:
    "O pedido e o evento OrderCreated entram na mesma transação. Ou os dois são confirmados, ou nenhum é. A publicação no Kafka continua pendente.",
  event: {
    id: "commit",
    type: "db.commit",
    description: "Commit de Orders e OutboxMessages.",
    source: "order-service",
    target: "database",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando resposta" },
    "order-service": { status: "processing", detail: "Confirmando transação" },
    database: { status: "success", detail: "Commit único" },
  }),
  activeEdgeIds: ["write"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "0")],
  }),
  notes: ["A intenção de publicar já está durável. O broker ainda não recebeu o evento."],
});

const respond = step({
  id: "respond",
  title: "Resposta ao cliente",
  narrative:
    "A API responde 201 Created. O cliente não espera o Kafka. Quem garante a publicação posterior é a linha pendente na Outbox.",
  event: {
    id: "respond",
    type: "http.response",
    description: "201 Created devolvido ao cliente.",
    source: "order-service",
    target: "client",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Pedido e Outbox gravados" },
  }),
  activeEdgeIds: ["request"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "0")],
  }),
});

const poll = step({
  id: "poll",
  title: "Worker lê pendências",
  narrative:
    "O worker busca mensagens Pending. Este cenário usa polling. Change Data Capture é outra forma de transportar a Outbox e tem custo operacional próprio.",
  event: {
    id: "poll",
    type: "outbox.poll",
    description: "Worker lê OutboxMessages pendentes.",
    source: "database",
    target: "worker",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "processing", detail: "Leitura da Outbox" },
    worker: { status: "processing", detail: "Mensagem ob-1042" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "0")],
  }),
});

const publish = step({
  id: "publish",
  title: "Publicação no Kafka",
  narrative:
    "O worker envia OrderCreated ao Kafka. A linha da Outbox continua Pending até a atualização posterior.",
  event: {
    id: "publish",
    type: "broker.publish",
    description: "Worker produz OrderCreated.",
    source: "worker",
    target: "kafka",
    outcome: "pending",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox ainda Pending" },
    worker: { status: "processing", detail: "Publicando" },
    kafka: { status: "processing", detail: "Recebendo evento" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "1")],
  }),
});

const ack = step({
  id: "ack",
  title: "Broker confirma",
  narrative:
    "O Kafka confirma a publicação. Essa confirmação e a atualização da Outbox não formam uma transação distribuída.",
  event: {
    id: "ack",
    type: "broker.ack",
    description: "Kafka confirma o recebimento.",
    source: "kafka",
    target: "worker",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "waiting", detail: "Outbox ainda Pending" },
    worker: { status: "processing", detail: "Ack recebido" },
    kafka: { status: "success", detail: "Evento aceito" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "1")],
  }),
  notes: ["Se o worker parar aqui, a mensagem será publicada outra vez."],
});

const mark = step({
  id: "mark",
  title: "Outbox concluída",
  narrative:
    "O worker marca a mensagem como processada. Novos ciclos de polling não voltam a publicá-la.",
  event: {
    id: "mark",
    type: "outbox.mark",
    description: "OutboxMessages.ob-1042 passa a Processed.",
    source: "worker",
    target: "database",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox Processed" },
    worker: { status: "success", detail: "Publicação registrada" },
    kafka: { status: "success", detail: "Evento aceito" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processed", "1")],
  }),
});

const consume = step({
  id: "consume",
  title: "Consumo idempotente",
  narrative:
    "O consumidor grava a chave do evento antes de aplicar o efeito. Uma segunda cópia da mesma mensagem não repete o efeito.",
  event: {
    id: "consume",
    type: "consumer.handle",
    description: "Consumidor aplica OrderCreated uma vez.",
    source: "kafka",
    target: "consumer",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox Processed" },
    worker: { status: "success", detail: "Publicação registrada" },
    kafka: { status: "success", detail: "Evento entregue" },
    consumer: { status: "success", detail: "Efeito aplicado" },
  }),
  activeEdgeIds: ["deliver"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processed", "1")],
    consumerLog: [delivery("delivery-1", "Aplicado")],
  }),
});

const saved = [receive, begin, commit, respond];

const databaseDown = step({
  id: "database-down",
  title: "Banco indisponível",
  narrative:
    "A transação não chega a ser confirmada. Pedido e Outbox permanecem vazios, e a API informa a falha ao cliente.",
  event: {
    id: "database-down",
    type: "db.begin",
    description: "O banco recusa a conexão.",
    source: "order-service",
    target: "database",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "failure", detail: "Erro 503" },
    "order-service": { status: "failure", detail: "Sem transação" },
    database: { status: "failure", detail: "Indisponível" },
  }),
  activeEdgeIds: ["write"],
  tables: blank(),
  notes: ["Não há pedido parcial nem mensagem pendente para publicar."],
});

const staged = step({
  id: "staged",
  title: "Registros na transação",
  narrative:
    "Pedido e mensagem já foram escritos dentro da transação, mas o commit ainda não ocorreu. Os dois existem apenas para essa transação.",
  event: {
    id: "staged",
    type: "db.begin",
    description: "INSERT de Orders e OutboxMessages ainda não confirmado.",
    source: "order-service",
    target: "database",
    outcome: "pending",
  },
  components: stage(ids, {
    client: { status: "waiting", detail: "Aguardando resposta" },
    "order-service": { status: "processing", detail: "Transação aberta" },
    database: { status: "processing", detail: "Ainda sem commit" },
  }),
  activeEdgeIds: ["write"],
  tables: data({
    orders: [order("Não confirmado")],
    outbox: [message("Não confirmado", "0")],
  }),
});

const rollback = step({
  id: "rollback",
  title: "Rollback conjunto",
  narrative:
    "A transação falha e é revertida. O pedido e a mensagem Outbox desaparecem juntos. O Kafka não recebe evento de um pedido que não ficou gravado.",
  event: {
    id: "rollback",
    type: "db.rollback",
    description: "ROLLBACK desfaz Orders e OutboxMessages.",
    source: "database",
    target: "order-service",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "failure", detail: "Erro 500" },
    "order-service": { status: "failure", detail: "Transação revertida" },
    database: { status: "failure", detail: "Rollback" },
  }),
  activeEdgeIds: ["write"],
  tables: blank(),
  notes: ["O destino dos dois registros é o mesmo porque eles compartilham a transação."],
});

const publishFailed = step({
  id: "publish-failed",
  title: "Kafka indisponível",
  narrative:
    "A publicação falha depois do commit. O pedido continua confirmado e a mensagem permanece Pending para uma tentativa futura.",
  event: {
    id: "publish-failed",
    type: "broker.publish",
    description: "O broker não aceita a publicação.",
    source: "worker",
    target: "kafka",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox preservada" },
    worker: { status: "failure", detail: "Publicação recusada" },
    kafka: { status: "failure", detail: "Indisponível" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "1")],
  }),
});

const retryWait = step({
  id: "retry-wait",
  title: "Nova tentativa agendada",
  narrative:
    "O worker registra a tentativa e deixa a mensagem Pending. A espera, o limite e o backoff são política da aplicação, não uma garantia do Kafka.",
  event: {
    id: "retry-wait",
    type: "outbox.poll",
    description: "Worker agenda outra leitura da mensagem pendente.",
    source: "worker",
    target: "database",
    outcome: "pending",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "waiting", detail: "Mensagem Pending" },
    worker: { status: "waiting", detail: "Backoff" },
    kafka: { status: "failure", detail: "Ainda indisponível" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "1")],
  }),
});

const recoveredPublish = step({
  id: "recovered-publish",
  title: "Publicação recuperada",
  narrative:
    "O Kafka volta a aceitar a mensagem. O worker publica OrderCreated sem criar outro pedido.",
  event: {
    id: "recovered-publish",
    type: "broker.publish",
    description: "Segunda tentativa aceita pelo Kafka.",
    source: "worker",
    target: "kafka",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Pedido original preservado" },
    worker: { status: "processing", detail: "Retry aceito" },
    kafka: { status: "success", detail: "Evento aceito" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "2")],
  }),
});

const recoveredMark = step({
  id: "recovered-mark",
  title: "Pendência encerrada",
  narrative:
    "Depois do ack, o worker marca a mensagem como processada. O consumidor recebe o evento do pedido original.",
  event: {
    id: "recovered-mark",
    type: "outbox.mark",
    description: "Outbox atualizada após a recuperação.",
    source: "worker",
    target: "database",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox Processed" },
    worker: { status: "success", detail: "Retry concluído" },
    kafka: { status: "success", detail: "Evento aceito" },
    consumer: { status: "success", detail: "Efeito aplicado" },
  }),
  activeEdgeIds: ["deliver"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processed", "2")],
    consumerLog: [delivery("delivery-1", "Aplicado")],
  }),
});

const workerCrashed = step({
  id: "worker-crashed",
  title: "Worker interrompido",
  narrative:
    "O processo do worker para antes de publicar. A mensagem não depende da memória do processo: ela continua Pending no banco.",
  event: {
    id: "worker-crashed",
    type: "worker.crash",
    description: "Worker é interrompido com a mensagem ainda pendente.",
    source: "worker",
    target: "database",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox disponível" },
    worker: { status: "failure", detail: "Processo interrompido" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "0")],
  }),
});

const workerRestart = step({
  id: "worker-restart",
  title: "Worker retomado",
  narrative:
    "Um novo ciclo encontra a mesma mensagem e continua a publicação. O pedido não é gravado outra vez.",
  event: {
    id: "worker-restart",
    type: "outbox.poll",
    description: "Worker reiniciado lê a pendência.",
    source: "database",
    target: "worker",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "processing", detail: "Pendência encontrada" },
    worker: { status: "processing", detail: "Processo retomado" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "0")],
  }),
});

const crashedBeforeMark = step({
  id: "crashed-before-mark",
  title: "Ack sem atualizar a Outbox",
  narrative:
    "O Kafka já aceitou o evento, mas o worker para antes de marcar a Outbox. A mensagem continua Pending e pode ser publicada de novo.",
  event: {
    id: "crashed-before-mark",
    type: "worker.crash",
    description: "Falha entre o ack do broker e o update da Outbox.",
    source: "worker",
    target: "database",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "waiting", detail: "Outbox ainda Pending" },
    worker: { status: "failure", detail: "Parou após o ack" },
    kafka: { status: "success", detail: "Evento aceito" },
    consumer: { status: "success", detail: "Primeira cópia aplicada" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "1")],
    consumerLog: [delivery("delivery-1", "Aplicado")],
  }),
  notes: ["A confirmação do broker e o update da Outbox não são atômicos."],
});

const republish = step({
  id: "republish",
  title: "Segunda publicação",
  narrative:
    "O worker retomado vê a mensagem Pending e publica OrderCreated outra vez. O padrão não transforma essa repetição em entrega exatamente uma vez.",
  event: {
    id: "republish",
    type: "broker.publish",
    description: "A mesma mensagem Outbox é produzida novamente.",
    source: "worker",
    target: "kafka",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "waiting", detail: "Ainda Pending" },
    worker: { status: "processing", detail: "Republicando" },
    kafka: { status: "processing", detail: "Segunda cópia" },
    consumer: { status: "success", detail: "Primeira cópia aplicada" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Pending", "2")],
    consumerLog: [delivery("delivery-1", "Aplicado")],
  }),
});

const duplicateIgnored = step({
  id: "duplicate-ignored",
  title: "Duplicata ignorada",
  narrative:
    "O consumidor reconhece a chave já processada e não aplica o efeito outra vez. Em seguida o worker consegue marcar a Outbox como processada.",
  event: {
    id: "duplicate-ignored",
    type: "consumer.handle",
    description: "Consumidor ignora a cópia repetida.",
    source: "kafka",
    target: "consumer",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox Processed" },
    worker: { status: "success", detail: "Marcação concluída" },
    kafka: { status: "success", detail: "Duas cópias aceitas" },
    consumer: { status: "success", detail: "Duplicata ignorada" },
  }),
  activeEdgeIds: ["deliver"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processed", "2")],
    consumerLog: [
      delivery("delivery-1", "Aplicado"),
      delivery("delivery-2", "Ignorado pela idempotência"),
    ],
  }),
});

function rejectedAttempt(attempt: string, id: string) {
  return step({
    id,
    title: `Tentativa ${attempt} recusada`,
    narrative:
      "A mensagem é permanentemente inválida para o publicador. Cada tentativa incrementa o contador e a linha continua disponível até a política desistir.",
    event: {
      id,
      type: "broker.publish",
      description: `Tentativa ${attempt} rejeitada de forma permanente.`,
      source: "worker",
      target: "kafka",
      outcome: "failure",
    },
    components: stage(ids, {
      client: { status: "success", detail: "201 Created" },
      "order-service": { status: "success", detail: "Pedido aceito" },
      database: { status: "waiting", detail: "Mensagem problemática" },
      worker: { status: "failure", detail: `Tentativa ${attempt}` },
      kafka: { status: "failure", detail: "Rejeição permanente" },
    }),
    activeEdgeIds: ["publish"],
    tables: data({
      orders: [order("Confirmado")],
      outbox: [message("Pending", attempt)],
    }),
  });
}

const parked = step({
  id: "parked",
  title: "Mensagem retida",
  narrative:
    "Ao atingir o limite deste cenário, o worker marca a mensagem como Failed e para o retry automático. O pedido permanece confirmado e a mensagem fica disponível para inspeção.",
  event: {
    id: "parked",
    type: "outbox.fail",
    description: "OutboxMessages.ob-1042 deixa de ser republicada automaticamente.",
    source: "worker",
    target: "database",
    outcome: "failure",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "failure", detail: "Mensagem Failed" },
    worker: { status: "waiting", detail: "Retry automático encerrado" },
    kafka: { status: "inactive", detail: "Sem nova publicação" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Failed", "3")],
  }),
  notes: ["O limite de três tentativas é uma escolha deste cenário, não uma regra do padrão."],
});

const claimed = step({
  id: "claimed",
  title: "Reserva atômica",
  narrative:
    "O worker A reserva a mensagem com uma atualização condicional: só altera a linha se ela ainda estiver Pending. A reserva e a leitura precisam ser a mesma operação lógica.",
  event: {
    id: "claimed",
    type: "outbox.claim",
    description: "UPDATE condicional marca a mensagem para o worker A.",
    source: "worker",
    target: "database",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "processing", detail: "Linha reservada" },
    worker: { status: "processing", detail: "Worker A" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processing · worker-a", "1")],
  }),
  notes: ["Dois SELECT separados, sem condição de estado, não impedem trabalho duplicado."],
});

const rivalMisses = step({
  id: "rival-misses",
  title: "Segundo worker não encontra a linha",
  narrative:
    "O worker B procura mensagens Pending e não encontra ob-1042, porque ela já está Processing para o worker A.",
  event: {
    id: "rival-misses",
    type: "outbox.poll",
    description: "Worker B lê a Outbox e não recebe a mensagem reservada.",
    source: "database",
    target: "worker",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Nada livre para B" },
    worker: { status: "processing", detail: "Worker B sem mensagem" },
  }),
  activeEdgeIds: ["poll"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processing · worker-a", "1")],
  }),
});

const claimedPublish = step({
  id: "claimed-publish",
  title: "Somente o dono publica",
  narrative:
    "O worker A, dono da reserva, publica o evento. O worker B não produz uma segunda cópia por esta corrida.",
  event: {
    id: "claimed-publish",
    type: "broker.publish",
    description: "Worker A publica a mensagem reservada.",
    source: "worker",
    target: "kafka",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "processing", detail: "Reserva do worker A" },
    worker: { status: "processing", detail: "Worker A publicando" },
    kafka: { status: "success", detail: "Uma cópia" },
  }),
  activeEdgeIds: ["publish"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processing · worker-a", "1")],
  }),
});

const claimedDone = step({
  id: "claimed-done",
  title: "Reserva concluída",
  narrative: "O worker A marca a mensagem como processada e o consumidor aplica o evento uma vez.",
  event: {
    id: "claimed-done",
    type: "outbox.mark",
    description: "Worker A conclui a mensagem reservada.",
    source: "worker",
    target: "database",
    outcome: "success",
  },
  components: stage(ids, {
    client: { status: "success", detail: "201 Created" },
    "order-service": { status: "success", detail: "Pedido aceito" },
    database: { status: "success", detail: "Outbox Processed" },
    worker: { status: "success", detail: "Worker A concluiu" },
    kafka: { status: "success", detail: "Uma cópia" },
    consumer: { status: "success", detail: "Efeito aplicado" },
  }),
  activeEdgeIds: ["deliver"],
  tables: data({
    orders: [order("Confirmado")],
    outbox: [message("Processed", "1")],
    consumerLog: [delivery("delivery-1", "Aplicado")],
  }),
});

export const outboxInitial = {
  title: "Aguardando o pedido",
  narrative:
    "Nenhum pedido foi recebido. Orders e OutboxMessages estão vazias, e o worker ainda não tem o que publicar.",
  components: stage(ids, {}),
  tables: blank(),
};

export const outboxFrames = {
  happy: [receive, begin, commit, respond, poll, publish, ack, mark, consume],
  receive,
  begin,
  poll,
  saved,
  databaseDown,
  staged,
  rollback,
  publishFailed,
  retryWait,
  recoveredPublish,
  recoveredMark,
  workerCrashed,
  workerRestart,
  crashedBeforeMark,
  republish,
  duplicateIgnored,
  rejectedAttempt,
  parked,
  claimed,
  rivalMisses,
  claimedPublish,
  claimedDone,
  publish,
  ack,
  mark,
  consume,
};
