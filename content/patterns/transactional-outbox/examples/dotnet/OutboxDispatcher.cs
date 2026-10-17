// Dispatcher simplificado de propósito.
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
