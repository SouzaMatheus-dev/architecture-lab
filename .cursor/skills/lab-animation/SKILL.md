---
name: lab-animation
description: Faz a animação ensinar o fluxo do Architecture Lab a quem é novo na área, leigo ou da área de negócio. Use ao criar ou alterar simulação, diagrama, roteiro, falha, página de padrão ou qualquer movimento visual do laboratório.
---

# Animação que ensina

A animação é a aula. Quem assiste pode nunca ter visto Kafka, transação ou outbox. O traço aceso precisa mostrar sozinho o que quebrou e o que o padrão muda. O parágrafo ao lado nomeia esse movimento.

## Antes de alterar um fluxo

1. Leia a regra em `AGENTS.md` e em `.cursor/rules/lab-animation.mdc`.
2. Aplique a mesma decisão em Outbox, Inbox e em qualquer padrão já publicado.
3. Escreva a decisão nesses dois lugares antes de abrir exceção.

## O que a etapa mostra

- A aresta acesa segue o evento da etapa, da origem para o destino.
- A linha sai do lado do nó que aponta para o destino. A volta da resposta, do ack e da marcação percorre o caminho curto.
- Outra aresta pode acompanhar um segundo movimento do mesmo passo. As duas permanecem visíveis.
- Cada caminho tem o próprio desenho. Sem o padrão, o diagrama não reaproveita o vão de um componente que aquele caminho não tem.
- Um segundo participante de uma corrida é um nó próprio. O primeiro permanece na tela enquanto o segundo se move.
- Se o texto da etapa diz que algo se moveu, uma aresta ativa liga a origem e o destino desse evento.
- `prefers-reduced-motion` tira o tracejado e mantém a aresta acesa.

## Como conferir

No conteúdo, todo quadro com evento tem uma aresta ativa cujas pontas são a origem e o destino, em qualquer sentido. O diagrama orienta o sentido pelo evento.

No navegador, percorra os dois laboratórios publicados:

- uma volta, como a resposta ao cliente, a confirmação do broker ou o ack do consumidor;
- o caminho sem o padrão;
- a falha que anima uma corrida entre dois participantes.

O tracejado anda da origem para o destino. O texto e as tabelas continuam dizendo a mesma coisa que a linha.
