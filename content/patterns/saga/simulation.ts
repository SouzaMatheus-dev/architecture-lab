import { parseSimulationDefinition } from "@architecture-lab/simulation-engine";
import { naiveEdges, naiveNodes, naiveTables, withEdges, withNodes, withTables } from "./diagram";
import { sagaFrames, sagaInitial } from "./with-saga";
import { naiveFrames, naiveInitial } from "./without-saga";

export const withSagaSimulation = parseSimulationDefinition({
  id: "saga-orchestration",
  title: "Com Saga",
  summary:
    "O orquestrador grava cada passo e pede a compensação quando um passo seguinte falha. Cada serviço usa a própria transação.",
  lesson:
    "A saga coordena passos locais e compensa com outro passo. Ela não torna o processo exatamente uma vez nem isolado.",
  nodes: [...withNodes],
  edges: [...withEdges],
  tables: [...withTables],
  initial: sagaInitial,
  frames: sagaFrames.happy,
  failures: [
    {
      id: "stock-rejected",
      name: "Estoque recusa",
      description: "A captura fica feita, o estoque recusa e o estorno conclui.",
      lesson: "A compensação é outro passo local. O pedido não segue quando a reserva falha.",
      frames: sagaFrames.stockRejected,
    },
    {
      id: "crash-before-saga-log",
      name: "Queda antes do registro",
      description:
        "A captura acontece antes de a saga gravar o passo. A repetição não cobra de novo.",
      lesson:
        "A janela entre o commit do participante e o registro do orquestrador pode repetir o passo. O pagamento precisa reconhecer a mesma captura.",
      frames: sagaFrames.crashBeforeLog,
    },
    {
      id: "compensation-rejected",
      name: "Estorno recusado",
      description: "O estoque recusa e o estorno também falha. A saga fica bloqueada.",
      lesson:
        "A compensação também pode falhar. A saga permanece bloqueada e não aparece como concluída.",
      frames: sagaFrames.compensationRejected,
    },
  ],
});

export const withoutSagaSimulation = parseSimulationDefinition({
  id: "direct-checkout",
  title: "Sem Saga",
  summary: "O caixa chama pagamento, estoque e envio sem guardar um processo durável.",
  lesson:
    "Sem a saga, a captura pode ficar sem continuação nem compensação, ou o fluxo pode seguir sem a captura.",
  nodes: [...naiveNodes],
  edges: [...naiveEdges],
  tables: [...naiveTables],
  initial: naiveInitial,
  frames: naiveFrames.happy,
  failures: [
    {
      id: "payment-without-process",
      name: "Captura sem processo",
      description: "A captura fica feita e ninguém continua nem compensa.",
      lesson: "Efeito sem o processo: a captura existe e não há saga para retomar ou estornar.",
      frames: naiveFrames.paymentWithoutProcess,
    },
    {
      id: "process-without-effect",
      name: "Fluxo sem captura",
      description: "O caixa segue para o estoque sem a captura ter ocorrido.",
      lesson: "Processo sem o efeito: o fluxo avança e o pagamento não foi capturado.",
      frames: naiveFrames.processWithoutEffect,
    },
  ],
});
