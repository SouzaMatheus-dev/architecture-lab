# ADR-008 — Inbox como segundo módulo

Transactional Inbox é o segundo laboratório completo. Ele reutiliza o contrato do motor, os controles e o diagrama. Não há um pacote novo de componentes visuais: os dois módulos ainda são desenhados pelo mesmo cliente.

A posição de um nó pertence ao caminho, no conteúdo. O mesmo identificador pode ocupar lugares diferentes no Outbox e no Inbox. O componente do diagrama não escolhe a coordenada pelo slug.

A Inbox não é descrita como entrega exatamente uma vez. O efeito e o identificador compartilham a transação local. O ack do broker fica fora dela.
