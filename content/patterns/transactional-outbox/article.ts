export const createOrderSource = `// Fragmento ilustrativo. Orders e OutboxMessages usam o mesmo DbContext
// e a mesma transação do banco. Isto não é uma transação distribuída.

await using var transaction =
    await dbContext.Database.BeginTransactionAsync(cancellationToken);

var order = Order.Create(request.CustomerId);

dbContext.Orders.Add(order);
dbContext.OutboxMessages.Add(
    OutboxMessage.Create(
        eventType: "OrderCreated",
        payload: JsonSerializer.Serialize(new OrderCreated(order.Id))));

await dbContext.SaveChangesAsync(cancellationToken);
await transaction.CommitAsync(cancellationToken);
`;

export const dispatcherSource = `// Dispatcher simplificado de propósito.
// Esta versão não reserva a mensagem com atualização condicional,
// não limita tentativas e não trata a falha entre o ack do broker
// e a atualização da Outbox.

var pending = await dbContext.OutboxMessages
    .Where(message => message.Status == OutboxStatus.Pending)
    .OrderBy(message => message.OccurredAt)
    .Take(20)
    .ToListAsync(cancellationToken);

foreach (var message in pending)
{
    await producer.ProduceAsync(
        topic: "orders",
        key: message.Id.ToString(),
        payload: message.Payload,
        cancellationToken);

    message.MarkProcessed();
}

await dbContext.SaveChangesAsync(cancellationToken);
`;

export const transactionalOutboxArticle = {
  problem: {
    id: "problema",
    title: "Problema",
    paragraphs: [
      "Um serviço precisa gravar uma mudança de negócio e avisar outros serviços. Se a gravação e a publicação são operações separadas, qualquer falha no meio deixa um dos lados sem o outro.",
      "No pedido, isso aparece como uma linha em Orders sem o evento OrderCreated, ou como uma tentativa de retry que cria um segundo pedido. O cliente e os consumidores passam a enxergar histórias diferentes.",
    ],
  },
  comparison: {
    id: "antes-e-depois",
    title: "Antes e depois",
    paragraphs: [
      "Sem Outbox, o Order Service confirma o pedido e depois chama o Kafka. A resposta da API também pode ficar presa à disponibilidade do broker.",
      "Com Outbox, o serviço grava o pedido e a mensagem na mesma transação local. A API responde em seguida. Um worker publica as mensagens pendentes e marca o que já foi enviado.",
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
      "A intenção de publicar sobrevive a uma falha do broker ou do worker.",
      "A resposta da API deixa de depender da publicação no Kafka.",
      "Pedido e mensagem são revertidos juntos quando a transação local falha.",
    ],
    cons: [
      "Surge um worker, com concorrência, tentativas, observação e mensagens retidas.",
      "A publicação pode acontecer mais de uma vez.",
      "Polling adiciona atraso e leitura no banco. CDC reduz o polling, mas acrescenta outro componente para operar.",
    ],
  },
  whenToUse: {
    id: "quando-usar",
    title: "Quando usar",
    paragraphs: [
      "Use o padrão quando perder o evento causa divergência de negócio e a publicação precisa ocorrer depois de um commit local bem-sucedido.",
    ],
    use: [
      "A alteração e o evento precisam ser aceitos ou recusados juntos.",
      "O consumidor consegue tratar uma entrega repetida.",
      "O time consegue operar o dispatcher e investigar mensagens que não avançam.",
    ],
    avoid: [
      "Uma chamada síncrona já oferece a consistência de que o caso precisa.",
      "O evento é apenas informativo e pode ser perdido sem efeito relevante.",
      "Ainda não existe um consumidor idempotente nem uma política para mensagens problemáticas.",
    ],
  },
  example: {
    intro:
      "Os dois registros usam o mesmo contexto e a mesma transação do banco. O dispatcher abaixo é intencionalmente incompleto: falta a reserva atômica, o limite de tentativas e o tratamento da falha entre o ack e a atualização da Outbox.",
    files: [
      { filename: "CreateOrder.cs", source: createOrderSource },
      { filename: "OutboxDispatcher.cs", source: dispatcherSource },
    ],
  },
  accuracy: {
    id: "precisao",
    title: "O que o Outbox não garante",
    items: [
      "Não garante, sozinho, entrega exatamente uma vez.",
      "Uma mensagem pode ser publicada mais de uma vez se o processo falhar depois do ack e antes de atualizar a Outbox.",
      "Consumidores idempotentes reduzem o efeito dessa repetição. Idempotência não é opcional neste desenho.",
      "O dispatcher precisa reservar mensagens, limitar tentativas e separar o que é falha transitória do que está permanentemente inválido.",
      "A confirmação do broker e a atualização da Outbox não formam uma transação atômica.",
      "Polling e CDC transportam a mesma tabela por caminhos diferentes. O cenário mostra polling.",
      "O limite de três tentativas e os nomes das tabelas são escolhas didáticas.",
    ],
  },
  exercise: {
    question:
      "O Kafka confirmou a publicação, mas o worker parou antes de marcar a Outbox como processada. O que o consumidor precisa garantir quando a mensagem reaparecer?",
    answer:
      "Idempotência. A mesma mensagem pode ser publicada outra vez, porque o ack do broker e a atualização da Outbox não acontecem na mesma transação. O consumidor deve reconhecer a cópia já aplicada e não repetir o efeito.",
  },
};
