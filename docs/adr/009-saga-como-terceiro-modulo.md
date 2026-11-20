# ADR-009 — Saga como terceiro módulo

A Saga é o terceiro laboratório completo. Ela reutiliza o motor, os controles e o diagrama. O desenho abaixo é o que a simulação percorre.

## O que o aluno vê

Um pedido só termina quando pagamento, estoque e envio concordam. Cada um tem a própria transação local. O laboratório usa orquestração: um orquestrador grava o passo concluído e chama o próximo serviço. Coreografia fica de fora deste módulo, para o desenho ter um único lugar que lembra o processo.

Sem a saga, o caixa chama os serviços e não guarda um processo durável. As duas ordens da operação partida ficam visíveis:

- efeito sem o processo: a captura fica feita e ninguém continua nem compensa;
- processo sem o efeito: o fluxo segue sem a captura ter ocorrido.

Com a saga, a falha de um passo seguinte pede a compensação do que já aconteceu. A compensação é outro passo local. Ela não desfaz a transação do participante.

A saga não torna o processo exatamente uma vez nem isolado. Um participante pode ver o estoque reservado por uma saga que ainda não terminou. A repetição de um passo continua possível, e a compensação também pode falhar.

## Caminhos

O caminho com a saga tem orquestrador. O caminho sem a saga não desenha esse nó no vão de outro.

Com a saga, os nós e as coordenadas são:

| Nó | x | y |
| --- | --- | --- |
| client | 0 | 100 |
| orchestrator | 260 | 100 |
| payment | 540 | 0 |
| inventory | 540 | 140 |
| shipping | 540 | 280 |

As arestas são `request` (client → orchestrator), `charge` (orchestrator → payment), `reserve` (orchestrator → inventory) e `ship` (orchestrator → shipping). A volta da confirmação, do estorno e da recusa percorre a mesma aresta, no sentido do evento.

Sem a saga, os nós e as coordenadas são:

| Nó | x | y |
| --- | --- | --- |
| checkout | 0 | 100 |
| payment | 280 | 0 |
| inventory | 280 | 160 |
| shipping | 560 | 80 |

As arestas são `charge` (checkout → payment), `reserve` (checkout → inventory) e `ship` (checkout → shipping).

As tabelas do caminho com a saga são o processo, o pagamento, o estoque e o envio. O caminho sem a saga não tem a tabela do processo.

## Falhas

No caminho sem a saga, as duas ordens são as falhas `payment-without-process` e `process-without-effect`. O modo declara esses dois identificadores.

No caminho com a saga, o roteiro feliz conclui os três passos. As falhas substituem o roteiro inteiro:

- `stock-rejected`: a captura fica feita, o estoque recusa e o orquestrador pede o estorno. O estorno conclui. O pedido não segue.
- `crash-before-saga-log`: o pagamento confirma e o orquestrador ainda não gravou o passo. A recuperação repete o pedido de captura. O pagamento reconhece a repetição e não captura de novo.
- `compensation-rejected`: o estoque recusa e o estorno também falha. A saga permanece bloqueada, à espera de intervenção. A tela não marca o processo como concluído.

## Exemplo e exercícios

O exemplo .NET ilustra o orquestrador gravando o estado da saga e chamando o pagamento fora dessa transação. O comentário diz que faltam a reserva condicional do passo, o limite de espera e o caminho de intervenção quando a compensação falha. O laboratório não executa esse código.

Os exercícios perguntam as duas ordens, o que a compensação não desfaz, e por que uma repetição ainda pode chegar ao participante.

## Fora deste módulo

Não há transação distribuída, isolamento entre os passos, nem garantia de conclusão exatamente uma vez. Timeout, fila de dead-letter e operação humana aparecem como limite nomeado na falha `compensation-rejected`, não como um segundo produto.
