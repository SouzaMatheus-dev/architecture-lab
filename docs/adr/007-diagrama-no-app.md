# ADR-007 — Diagrama permanece na aplicação até haver outro cliente

Os componentes visuais ficam em `apps/web`. Outbox e Inbox são desenhados pelo mesmo cliente. Extrair `packages/diagram-components` criaria uma fronteira sem um segundo consumidor.

A coordenada de cada nó fica no conteúdo do caminho. O componente do diagrama lê esse mapa e não cita o slug do padrão. Um nó sem coordenada cai na grade reserva, e o teste do módulo publicado exige coordenada para todo nó.

O schema dos padrões permanece no motor, porque ele valida exatamente as definições que o motor executa. Um pacote separado só se justifica quando outro consumidor precisar do schema sem o runtime.
