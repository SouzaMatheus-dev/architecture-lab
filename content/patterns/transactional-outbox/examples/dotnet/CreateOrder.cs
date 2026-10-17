// Fragmento ilustrativo. Orders e OutboxMessages usam o mesmo DbContext
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
