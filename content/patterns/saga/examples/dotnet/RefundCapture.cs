// A compensação é outra chamada, com a própria transação do pagamento.
// Ela não desfaz a captura já confirmada. Se o estorno falhar,
// a saga permanece bloqueada e precisa de intervenção.

await payment.RefundAsync(orderId, captureId, cancellationToken);
