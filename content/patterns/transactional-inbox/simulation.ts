import { parseSimulationDefinition } from "@architecture-lab/simulation-engine";
import { naiveEdges, naiveNodes, naiveTables, withEdges, withNodes, withTables } from "./diagram";
import { inboxFrames, inboxInitial } from "./with-inbox";
import { naiveFrames, naiveInitial } from "./without-inbox";

export const withInboxSimulation = parseSimulationDefinition({
  id: "transactional-inbox",
  title: "Com Transactional Inbox",
  summary:
    "A cobrança e o identificador da mensagem são confirmados na mesma transação. O ack do Kafka sai depois.",
  lesson:
    "A Inbox torna o efeito idempotente diante de uma entrega repetida. Ela não transforma o broker em entrega exatamente uma vez.",
  nodes: [...withNodes],
  edges: [...withEdges],
  tables: [...withTables],
  initial: inboxInitial,
  frames: inboxFrames.happy,
  failures: [
    {
      id: "database-unavailable",
      name: "Banco indisponível",
      description: "Nada é gravado e o offset não é confirmado.",
      lesson: "Sem commit, a mensagem pode ser entregue de novo. Não há efeito para desfazer.",
      frames: [inboxFrames.delivered, inboxFrames.databaseDown],
    },
    {
      id: "transaction-failure",
      name: "Falha na transação",
      description: "Cobrança e inbox são revertidas juntas.",
      lesson:
        "Os dois registros compartilham a transação local. O rollback desfaz o efeito e o identificador.",
      frames: [
        inboxFrames.delivered,
        inboxFrames.begun,
        inboxFrames.staged,
        inboxFrames.rolledBack,
      ],
    },
    {
      id: "crash-before-ack",
      name: "Queda antes do ack",
      description: "O commit sobrevive e a reentrega não duplica a cobrança.",
      lesson:
        "A queda antes do ack não duplica a cobrança, porque o identificador já está na inbox.",
      frames: [
        inboxFrames.delivered,
        inboxFrames.begun,
        inboxFrames.committed,
        inboxFrames.crashed,
        inboxFrames.redelivered,
        inboxFrames.ignored,
        inboxFrames.acked,
      ],
    },
    {
      id: "duplicate-delivery",
      name: "Entrega duplicada",
      description: "A segunda cópia encontra a mensagem já processada.",
      lesson: "Uma segunda entrega da mesma mensagem não cria outra cobrança.",
      frames: [...inboxFrames.happy, inboxFrames.redelivered, inboxFrames.ignored],
    },
    {
      id: "poison-message",
      name: "Mensagem problemática",
      description: "A falha de negócio não marca a inbox como processada.",
      lesson:
        "Uma cobrança inválida não pode parecer consumo concluído. A mensagem fica retida depois do limite.",
      frames: [
        inboxFrames.delivered,
        inboxFrames.rejection("1", "reject-1"),
        inboxFrames.rejection("2", "reject-2"),
        inboxFrames.rejection("3", "reject-3"),
        inboxFrames.parked,
      ],
    },
    {
      id: "concurrent-consumers",
      name: "Dois consumidores",
      description: "A chave única impede a segunda cobrança.",
      lesson:
        "A reserva da mensagem precisa ser a própria inserção única. Consultar e inserir em comandos separados abre corrida.",
      frames: [
        inboxFrames.delivered,
        inboxFrames.claimed,
        inboxFrames.rivalLoses,
        inboxFrames.acked,
      ],
    },
  ],
});

export const withoutInboxSimulation = parseSimulationDefinition({
  id: "direct-consume",
  title: "Sem Inbox",
  summary: "O consumidor grava a cobrança sem registrar o identificador da mensagem.",
  lesson:
    "Sem o identificador gravado com o efeito, uma reentrega repete a cobrança. Um ack adiantado pode perder o efeito.",
  nodes: [...naiveNodes],
  edges: [...naiveEdges],
  tables: [...naiveTables],
  initial: naiveInitial,
  frames: naiveFrames.happy,
  failures: [
    {
      id: "database-unavailable",
      name: "Banco indisponível",
      description: "A cobrança não chega a ser gravada.",
      lesson:
        "A falha acontece antes do efeito. O estado permanece vazio e o offset segue sem ack.",
      frames: [naiveFrames.delivered, naiveFrames.databaseDown],
    },
    {
      id: "redelivery-duplicates",
      name: "Reentrega duplica",
      description: "A cobrança existe, mas a mensagem não foi lembrada.",
      lesson: "A reentrega duplica a cobrança, porque nada registra que msg-1042 já foi aplicada.",
      frames: [
        naiveFrames.delivered,
        naiveFrames.committed,
        naiveFrames.crashed,
        naiveFrames.duplicated,
      ],
    },
    {
      id: "ack-before-effect",
      name: "Ack antes do efeito",
      description: "O broker esquece a mensagem antes da cobrança existir.",
      lesson:
        "Confirmar o broker antes do commit pode perder o efeito. A inbox não corrige essa ordem.",
      frames: [naiveFrames.delivered, naiveFrames.ackedFirst, naiveFrames.lost],
    },
  ],
});
