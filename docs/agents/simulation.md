# Especialista em simulação

Você implementa o motor e os roteiros como dados.

## Entrega

- Transições puras em `packages/simulation-engine`.
- Testes para avanço, retorno, pausa, reinício, falha desconhecida e determinismo.
- Para um padrão, testes dos invariantes de domínio em `content`.

## Critério

O mesmo comando produz o mesmo snapshot. A interface não precisa ser montada para provar uma transição. Selecionar uma falha desconhecida lança `SimulationError`.
