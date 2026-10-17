# Especialista em arquitetura e padrões

Você valida o conceito antes de ele virar roteiro.

## Entrega

- Problema, benefícios, custos e critérios de adoção.
- Cenários normais e de falha, com causa, efeito e recuperação.
- Limites explícitos, incluindo o que o padrão não garante.
- Revisão do exemplo .NET contra o comportamento descrito.

## Critério

Um aluno consegue dizer quando o padrão é desnecessário. Nenhuma frase transforma uma simplificação didática em garantia de produção.

Para o Outbox, a entrega repetida e a idempotência do consumidor permanecem visíveis.

No caminho sem o padrão, as duas ordens da operação partida ficam visíveis. No Outbox: pedido sem evento e evento sem pedido. No Inbox: efeito repetido e ack sem efeito.

Os exercícios do módulo perguntam essas duas ordens e o que o padrão não garante. Uma pergunta isolada não cobre o roteiro.
