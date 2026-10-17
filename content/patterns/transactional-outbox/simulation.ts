import { parseSimulationDefinition } from "@architecture-lab/simulation-engine";
import { naiveEdges, naiveNodes, naiveTables, withEdges, withNodes, withTables } from "./diagram";
import { outboxFrames, outboxInitial } from "./with-outbox";
import { naiveFrames, naiveInitial } from "./without-outbox";

export const withOutboxSimulation = parseSimulationDefinition({
  id: "transactional-outbox",
  title: "Com Transactional Outbox",
  summary:
    "O pedido e a intenção de publicar são confirmados na mesma transação. O worker publica depois, sem prender a resposta da API ao Kafka.",
  lesson:
    "A Outbox torna durável a intenção de publicar. Ela não cria uma transação distribuída com o broker e não garante entrega exatamente uma vez.",
  nodes: [...withNodes],
  edges: [...withEdges],
  tables: [...withTables],
  initial: outboxInitial,
  frames: outboxFrames.happy,
  failures: [
    {
      id: "database-unavailable",
      name: "Banco indisponível",
      description: "A transação não é confirmada.",
      lesson: "Sem commit, não existem pedido nem mensagem. Não há publicação para desfazer.",
      frames: [outboxFrames.receive, outboxFrames.databaseDown],
    },
    {
      id: "transaction-failure",
      name: "Falha na transação",
      description: "Pedido e Outbox são revertidos juntos.",
      lesson:
        "Os dois registros compartilham a transação local. O rollback desfaz o pedido e a intenção de publicar.",
      frames: [
        outboxFrames.receive,
        outboxFrames.begin,
        outboxFrames.staged,
        outboxFrames.rollback,
      ],
    },
    {
      id: "kafka-unavailable",
      name: "Kafka indisponível",
      description: "O evento permanece pendente e é publicado depois.",
      lesson:
        "O pedido continua confirmado. A mensagem Pending permite tentar de novo sem gravar outro pedido.",
      frames: [
        ...outboxFrames.saved,
        outboxFrames.poll,
        outboxFrames.publishFailed,
        outboxFrames.retryWait,
        outboxFrames.recoveredPublish,
        outboxFrames.recoveredMark,
      ],
    },
    {
      id: "worker-interrupted",
      name: "Worker interrompido",
      description: "A pendência sobrevive ao processo.",
      lesson: "A mensagem está no banco, não na memória do worker. Outro ciclo pode publicá-la.",
      frames: [
        ...outboxFrames.saved,
        outboxFrames.workerCrashed,
        outboxFrames.workerRestart,
        outboxFrames.publish,
        outboxFrames.mark,
        outboxFrames.consume,
      ],
    },
    {
      id: "duplicate-publish",
      name: "Publicação duplicada",
      description: "O ack acontece, mas a Outbox não é atualizada.",
      lesson:
        "Broker e Outbox não compartilham uma transação. A repetição é possível, então o consumidor precisa ser idempotente.",
      frames: [
        ...outboxFrames.saved,
        outboxFrames.poll,
        outboxFrames.publish,
        outboxFrames.ack,
        outboxFrames.firstCopy,
        outboxFrames.crashedBeforeMark,
        outboxFrames.republish,
        outboxFrames.duplicateIgnored,
      ],
    },
    {
      id: "poison-message",
      name: "Mensagem problemática",
      description: "O retry para após o limite do cenário.",
      lesson:
        "Tentativas precisam de limite. A mensagem retida não apaga o pedido; ela espera inspeção ou correção.",
      frames: [
        ...outboxFrames.saved,
        outboxFrames.poll,
        outboxFrames.rejectedAttempt("1", "poison-1"),
        outboxFrames.rejectedAttempt("2", "poison-2"),
        outboxFrames.rejectedAttempt("3", "poison-3"),
        outboxFrames.parked,
      ],
    },
    {
      id: "concurrent-workers",
      name: "Dois workers",
      description: "A reserva atômica impede o segundo worker de pegar a mesma linha.",
      lesson:
        "A reivindicação precisa ser condicional e atômica. Ler a pendência em um comando e atualizá-la em outro abre corrida.",
      frames: [
        ...outboxFrames.saved,
        outboxFrames.claimed,
        outboxFrames.rivalMisses,
        outboxFrames.claimedPublish,
        outboxFrames.claimedDone,
      ],
    },
  ],
});

export const withoutOutboxSimulation = parseSimulationDefinition({
  id: "direct-publish",
  title: "Sem Outbox",
  summary:
    "O serviço grava o pedido e depois publica no Kafka. As duas operações não compartilham uma transação.",
  lesson:
    "Gravar e publicar em separado abre duas janelas. O pedido pode ficar sem evento, ou o evento pode ficar sem o pedido. Não há uma pendência durável para retomar.",
  nodes: [...naiveNodes],
  edges: [...naiveEdges],
  tables: [...naiveTables],
  initial: naiveInitial,
  frames: naiveFrames.happy,
  failures: [
    {
      id: "database-unavailable",
      name: "Banco indisponível",
      description: "O pedido não chega a ser gravado.",
      lesson: "A falha acontece antes da publicação. O estado permanece vazio.",
      frames: [naiveFrames.receive, naiveFrames.databaseDown],
    },
    {
      id: "message-without-order",
      name: "Mensagem sem pedido",
      description: "O Kafka aceita o evento e a transação local falha.",
      lesson:
        "Publicar antes do commit deixa um evento sem o pedido. O consumidor pode aplicar um efeito para uma mudança que não existe.",
      frames: [
        naiveFrames.receive,
        naiveFrames.publishAhead,
        naiveFrames.ackAhead,
        naiveFrames.transactionRolledBack,
        naiveFrames.ghostConsume,
      ],
    },
    {
      id: "kafka-unavailable",
      name: "Kafka indisponível",
      description: "O pedido fica gravado e o evento se perde.",
      lesson:
        "Sem a intenção registrada, não há retry seguro. Repetir o POST pode duplicar o pedido; tratar o erro como pedido inexistente esconde uma gravação que já ocorreu.",
      frames: [
        naiveFrames.receive,
        naiveFrames.commit,
        naiveFrames.publishFailed,
        naiveFrames.inconsistent,
      ],
    },
  ],
});
