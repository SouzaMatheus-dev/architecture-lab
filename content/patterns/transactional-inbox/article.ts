export const handleOrderSource = `// Fragmento ilustrativo. Charges e InboxMessages usam o mesmo DbContext
// e a mesma transação do banco. O ack do broker fica fora dessa transação.

await using var transaction =
    await dbContext.Database.BeginTransactionAsync(cancellationToken);

var seen = await dbContext.InboxMessages
    .AnyAsync(message => message.Id == orderCreated.MessageId, cancellationToken);

if (!seen)
{
    dbContext.InboxMessages.Add(
        InboxMessage.Create(orderCreated.MessageId, "OrderCreated"));
    dbContext.Charges.Add(Charge.For(orderCreated.OrderId));
    await dbContext.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
}

await consumer.AcknowledgeAsync(orderCreated.MessageId, cancellationToken);
`;

export const naiveHandlerSource = `// Consumidor sem inbox, incompleto de propósito.
// Esta versão não guarda o identificador da mensagem.
// Se o processo parar antes do ack, a reentrega cria outra cobrança.
// Se o ack sair antes do commit, o efeito pode se perder.

dbContext.Charges.Add(Charge.For(orderCreated.OrderId));
await dbContext.SaveChangesAsync(cancellationToken);
await consumer.AcknowledgeAsync(orderCreated.MessageId, cancellationToken);
`;

export const transactionalInboxArticle = {
  problem: {
    id: "problema",
    title: "Problema",
    paragraphs: [
      "Um consumidor recebe a mesma mensagem mais de uma vez. Se cada entrega aplica o efeito de novo, o pedido gera duas cobranças, dois e-mails ou dois débitos.",
      "O broker entrega ao menos uma vez. A janela entre gravar o efeito e confirmar o offset é o lugar em que a repetição aparece.",
    ],
  },
  comparison: {
    id: "antes-e-depois",
    title: "Antes e depois",
    paragraphs: [
      "Sem Inbox, o Billing grava a cobrança e só depois confirma o Kafka. Nada no banco lembra o identificador da mensagem. Uma reentrega repete a cobrança.",
      "Com Inbox, a cobrança e o identificador entram na mesma transação local. O ack sai depois do commit. A próxima entrega encontra a mensagem e não repete o efeito.",
    ],
  },
  flow: {
    id: "fluxo",
    title: "Como ler a simulação",
    paragraphs: [
      "Os controles percorrem eventos já definidos. O relógio da tela só regula a velocidade visual. A sequência não depende de um Kafka real nem de temporizadores para decidir o resultado.",
      "Ative uma falha para trocar o roteiro inteiro. A troca recomeça a execução, para que o estado mostrado continue correspondente ao cenário escolhido.",
    ],
  },
  tradeoffs: {
    id: "tradeoffs",
    title: "Prós e contras",
    pros: [
      "Uma entrega repetida não repete o efeito já confirmado.",
      "A queda entre o commit e o ack deixa a cobrança única.",
      "Cobrança e identificador são revertidos juntos quando a transação local falha.",
    ],
    cons: [
      "A tabela de inbox precisa de retenção, chave única e observação.",
      "Dois consumidores exigem que a inserção da chave seja a reserva, não uma consulta anterior.",
      "O padrão não recupera um efeito que nunca foi gravado porque o ack saiu antes.",
    ],
  },
  whenToUse: {
    id: "quando-usar",
    title: "Quando usar",
    paragraphs: [
      "Use o padrão quando o efeito do consumidor não pode acontecer duas vezes e o broker pode entregar a mensagem de novo.",
    ],
    use: [
      "O efeito e o registro da mensagem precisam ser aceitos ou recusados juntos.",
      "O identificador da mensagem, ou uma chave de negócio, cabe numa restrição única.",
      "O time consegue investigar mensagens retidas sem marcá-las como processadas.",
    ],
    avoid: [
      "O efeito já é naturalmente idempotente e repetir a operação não muda o resultado.",
      "A operação é uma leitura, sem efeito para proteger.",
      "O consumidor confirma o broker antes de saber se o efeito foi gravado.",
    ],
  },
  example: {
    intro:
      "A cobrança e a inbox usam a mesma transação. A consulta antes do INSERT é intencionalmente incompleta: em produção, a chave única da mensagem precisa recusar a segunda inserção. O ack continua fora da transação. O consumidor sem inbox mostra o que falta.",
    files: [
      { filename: "HandleOrderCreated.cs", source: handleOrderSource },
      { filename: "NaiveChargeHandler.cs", source: naiveHandlerSource },
    ],
  },
  accuracy: {
    id: "precisao",
    title: "O que a Inbox não garante",
    items: [
      "Não transforma a entrega do broker em exatamente uma vez.",
      "O ack depois do commit ainda pode acontecer mais de uma vez. A inbox é o que impede o segundo efeito.",
      "Confirmar o broker antes do commit pode perder o efeito. A inbox não corrige essa ordem.",
      "Consultar a inbox e inserir em outro comando abre corrida entre consumidores. A reserva é a inserção única.",
      "Uma mensagem inválida não deve ser marcada como processada. Senão o efeito ausente parece concluído.",
      "A retenção das linhas, o nome das tabelas e o limite de três tentativas são escolhas didáticas.",
    ],
  },
  exercise: {
    question:
      "A cobrança e a inbox já foram confirmadas, mas o processo parou antes de enviar o ack. O Kafka entrega a mesma mensagem outra vez. O que o consumidor deve fazer?",
    answer:
      "Encontrar msg-1042 na inbox e não criar outra cobrança. Depois pode confirmar o offset. A repetição veio do broker; o efeito já está protegido pela transação local.",
  },
};
