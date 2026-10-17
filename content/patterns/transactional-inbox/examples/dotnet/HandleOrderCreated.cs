// Fragmento ilustrativo. Charges e InboxMessages usam o mesmo DbContext
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
