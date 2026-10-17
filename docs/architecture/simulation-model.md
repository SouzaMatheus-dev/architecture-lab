# Modelo da simulação

Uma definição contém nós, arestas, tabelas, o quadro inicial, o roteiro feliz e os roteiros de falha.

Cada falha substitui o roteiro inteiro. Selecionar uma falha reinicia a execução. Selecionar a mesma falha outra vez preserva o passo atual.

O índice `-1` é o quadro inicial. Avançar até o último quadro conclui a execução. Voltar a partir do primeiro evento retorna ao quadro inicial e ao status `idle`. Buscar um quadro pela linha do tempo pausa nesse quadro.

A velocidade aceita valores maiores que 0 e menores ou iguais a 4. Os botões oferecem 0,5×, 1×, 1,5× e 2×.

`getSnapshot` projeta o quadro corrente, o histórico já percorrido e a lição do roteiro ativo. A interface trata esse snapshot como somente leitura.
