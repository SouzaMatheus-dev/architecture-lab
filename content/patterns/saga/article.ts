export const orchestratorSource = `// Fragmento ilustrativo. O estado da saga usa a transação local do orquestrador.
// A chamada ao pagamento fica fora dessa transação.
// Esta versão não reserva o passo com atualização condicional,
// não limita a espera e não trata a falha da compensação.

await using var transaction =
    await dbContext.Database.BeginTransactionAsync(cancellationToken);

var saga = await dbContext.Sagas.SingleAsync(item => item.Id == sagaId, cancellationToken);
saga.MarkChargeRequested();

await dbContext.SaveChangesAsync(cancellationToken);
await transaction.CommitAsync(cancellationToken);

await payment.CaptureAsync(orderId, captureId, cancellationToken);
`;

export const compensationSource = `// A compensação é outra chamada, com a própria transação do pagamento.
// Ela não desfaz a captura já confirmada. Se o estorno falhar,
// a saga permanece bloqueada e precisa de intervenção.

await payment.RefundAsync(orderId, captureId, cancellationToken);
`;

export const naiveCheckoutSource = `// Caixa sem saga, incompleto de propósito.
// Não há processo durável. Se a captura ficar feita e o caixa cair,
// ninguém continua nem compensa. Se a captura falhar e o fluxo seguir,
// o estoque muda sem pagamento.

await payment.CaptureAsync(orderId, captureId, cancellationToken);
await inventory.ReserveAsync(orderId, reservationId, cancellationToken);
await shipping.CreateAsync(orderId, shipmentId, cancellationToken);
`;

export const sagaArticle = {
  problem: {
    id: "problema",
    title: "Problema",
    paragraphs: [
      "Um pedido só termina quando pagamento, estoque e envio concordam. Cada serviço confirma na própria transação. Sem um processo durável, a falha no meio deixa um efeito feito e o resto parado, ou faz o fluxo seguir sem o efeito.",
      "A captura pode ficar feita e ninguém continua nem compensa. Na outra ordem, o caixa segue para o estoque mesmo sem a captura ter ocorrido.",
    ],
  },
  comparison: {
    id: "antes-e-depois",
    title: "Antes e depois",
    paragraphs: [
      "Sem Saga, o caixa chama os serviços e guarda o andamento só na memória do processo. A queda depois da captura abandona o pagamento. A continuação depois de uma captura recusada reserva estoque sem pagamento.",
      "Com Saga, o orquestrador grava o passo concluído e chama o próximo serviço fora dessa transação. Se a reserva falha, ele pede o estorno. O estorno é outro passo local.",
    ],
  },
  flow: {
    id: "fluxo",
    title: "Como ler a simulação",
    paragraphs: [
      "Os controles percorrem eventos já definidos. O relógio da tela só regula a velocidade visual. A sequência não depende de pagamento, estoque ou envio reais.",
      "Ative uma falha para trocar o roteiro inteiro. A troca recomeça a execução, para que o estado mostrado continue correspondente ao cenário escolhido.",
    ],
  },
  tradeoffs: {
    id: "tradeoffs",
    title: "Prós e contras",
    pros: [
      "O processo tem um lugar que lembra o passo já concluído.",
      "Uma falha seguinte pode pedir a compensação do que já aconteceu.",
      "Cada serviço continua com a própria transação local.",
    ],
    cons: [
      "A compensação é outro passo, e também pode falhar.",
      "Os passos intermediários ficam visíveis para o resto do sistema. A saga não isola o estoque.",
      "Uma repetição pode chegar ao participante se o orquestrador cair antes de gravar a resposta.",
    ],
  },
  whenToUse: {
    id: "quando-usar",
    title: "Quando usar",
    paragraphs: [
      "Use a saga quando o processo atravessa serviços e uma falha no meio precisa compensar os passos já confirmados.",
    ],
    use: [
      "Cada passo tem uma compensação de negócio, não só um rollback local.",
      "Os participantes conseguem reconhecer uma repetição da mesma operação.",
      "O time consegue intervir quando a compensação falha.",
    ],
    avoid: [
      "Uma transação local já cobre todos os efeitos.",
      "O passo não tem compensação possível.",
      "O processo precisa parecer isolado para os outros pedidos.",
    ],
  },
  example: {
    intro:
      "O orquestrador grava o passo e chama o pagamento fora dessa transação. O estorno é outra chamada. Falta a reserva condicional do passo, o limite de espera e o caminho de intervenção quando a compensação falha.",
    files: [
      { filename: "OrderSaga.cs", source: orchestratorSource },
      { filename: "RefundCapture.cs", source: compensationSource },
      { filename: "NaiveCheckout.cs", source: naiveCheckoutSource },
    ],
  },
  accuracy: {
    id: "precisao",
    title: "O que a Saga não garante",
    items: [
      "Não torna o processo exatamente uma vez.",
      "Não isola os passos. Outro pedido pode ver o estoque reservado por uma saga que ainda não terminou.",
      "A compensação não desfaz a transação do participante. Ela é outro passo local.",
      "A compensação também pode falhar. A saga fica bloqueada e precisa de intervenção.",
      "A janela entre o commit do participante e o registro do orquestrador pode repetir o passo.",
      "O participante precisa reconhecer essa repetição. A saga não faz isso sozinha.",
      "Coreografia, tempo de espera e a operação humana aparecem como limite, não como um segundo módulo.",
    ],
  },
  exercise: [
    {
      question:
        "Sem Saga, a captura fica feita e o caixa cai antes de pedir a reserva. O que acontece com o pagamento?",
      answer:
        "A captura permanece e ninguém pede o estorno. Não há um processo durável para continuar ou compensar. É o efeito sem o processo.",
    },
    {
      question:
        "Sem Saga, o pagamento recusa a captura e o caixa ainda assim reserva o estoque. O que ficou inconsistente?",
      answer:
        "O estoque mudou e a captura não ocorreu. O fluxo seguiu sem o efeito do pagamento. É o processo sem o efeito.",
    },
    {
      question:
        "O estoque recusa a reserva e o pagamento estorna a captura. A compensação desfez a transação original?",
      answer:
        "Não. A captura já tinha sido confirmada na transação do pagamento. O estorno é outro passo, com a própria transação.",
    },
    {
      question:
        "O pagamento confirma a captura e o orquestrador cai antes de gravar o passo. A recuperação pede a captura de novo. O que o pagamento precisa fazer?",
      answer:
        "Reconhecer pay-1042 e devolver a mesma captura. A saga não impede a repetição sozinha. Sem esse reconhecimento, a recuperação criaria outra cobrança.",
    },
    {
      question: "O estorno também falha. A saga pode aparecer como concluída?",
      answer:
        "Não. A captura continua feita e a saga fica bloqueada, à espera de intervenção. Marcar o processo como concluído esconderia o efeito que ninguém compensou.",
    },
  ],
};
