// Consumidor sem inbox, incompleto de propósito.
// Esta versão não guarda o identificador da mensagem.
// Se o processo parar antes do ack, a reentrega cria outra cobrança.
// Se o ack sair antes do commit, o efeito pode se perder.

dbContext.Charges.Add(Charge.For(orderCreated.OrderId));
await dbContext.SaveChangesAsync(cancellationToken);
await consumer.AcknowledgeAsync(orderCreated.MessageId, cancellationToken);
