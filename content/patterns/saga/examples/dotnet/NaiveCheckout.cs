// Caixa sem saga, incompleto de propósito.
// Não há processo durável. Se a captura ficar feita e o caixa cair,
// ninguém continua nem compensa. Se a captura falhar e o fluxo seguir,
// o estoque muda sem pagamento.

await payment.CaptureAsync(orderId, captureId, cancellationToken);
await inventory.ReserveAsync(orderId, reservationId, cancellationToken);
await shipping.CreateAsync(orderId, shipmentId, cancellationToken);
