# ADR-002 — Motor determinístico

A sequência de um cenário é uma lista de quadros. O motor só muda o índice, o status de reprodução, a velocidade e a falha ativa.

Temporizadores existem na interface para espaçar a reprodução automática. Eles não escolhem o próximo evento. A mesma definição, a mesma falha e os mesmos comandos produzem o mesmo snapshot.
