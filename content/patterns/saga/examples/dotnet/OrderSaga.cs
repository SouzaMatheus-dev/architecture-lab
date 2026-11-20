// Fragmento ilustrativo. O estado da saga usa a transação local do orquestrador.
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
