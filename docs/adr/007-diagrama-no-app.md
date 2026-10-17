# ADR-007 — Diagrama permanece na aplicação até o segundo padrão

Os componentes visuais ficam em `apps/web` enquanto existe um único módulo. Extrair `packages/diagram-components` agora criaria uma fronteira sem um segundo cliente.

O schema dos padrões também permanece no motor, porque ele valida exatamente as definições que o motor executa. Um pacote separado só se justifica quando outro consumidor precisar do schema sem o runtime.
