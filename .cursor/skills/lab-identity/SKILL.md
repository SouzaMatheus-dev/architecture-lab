---
name: lab-identity
description: Aplica a identidade do Architecture Lab a todo módulo publicado e a padrões novos. Use ao alterar laboratório, página de padrão, exercício, roteiro de falha, UX, design ou quando um apontamento de aluno pedir uma melhoria. Para o movimento do diagrama, siga também a skill lab-animation.
---

# Identidade do Architecture Lab

Atue como especialista sênior em design, frontend, UX e backend. Uma melhoria entra em todos os módulos já publicados e fica pronta para o próximo.

## Quando um apontamento chegar

1. Trate o apontamento como regra de produto, não como correção da tela que o motivou.
2. Procure a mesma lacuna em Outbox e Inbox antes de editar.
3. Escreva a regra em `AGENTS.md` e, se for de interface, em `docs/agents/frontend-ux.md`.
4. Implemente nos módulos publicados. O componente compartilhado é o lugar certo quando a tela é a mesma.
5. Cubra com teste de conteúdo ou de tela. Verifique os dois laboratórios no navegador.

## Ordem da página de padrão

1. Título e resumo.
2. "Como ler a simulação", antes de qualquer controle. Os quatro passos são os da home: Cenário, Percurso, Agora, Registros. A fonte única é `LabReadingSteps`. O texto de abertura usa a largura da página. Os quatro passos ficam numa faixa abaixo.
3. Laboratório.
4. Problema, comparação, trade-offs, exemplo e precisão.
5. Conjunto de exercícios.

## Animação

A animação é a aula para quem é novo na área, leigo ou da área de negócio. O movimento mostra a causa e o efeito. O texto nomeia o que a tela já mostrou. Siga `.cursor/skills/lab-animation/SKILL.md` ao criar ou alterar qualquer fluxo.

## Laboratório

- O percurso mostra a trilha inteira, sem rolagem horizontal. Cada etapa é um botão com o nome. A frase da etapa atual fica numa faixa abaixo da trilha, na largura da página, com uma marca que permanece. O número distingue o que já passou, a etapa atual e o que vem depois.
- Chips de cenário e falha usam ponteiro e o mesmo hover dos botões.
- Controles e velocidade ficam na mesma linha. O rótulo alinha pelo centro dos botões.
- Cada troca de etapa destaca o painel Agora: número da etapa, marca persistente e animação curta. `prefers-reduced-motion` remove a animação e mantém a marca.
- A narrativa continua em `aria-live`. A tela não rola a janela para perseguir a etapa.
- Estados não dependem só da cor.

## Roteiro

- Uma falha substitui o roteiro inteiro e reinicia.
- Sem o padrão, as duas ordens da operação partida existem. Outbox: pedido sem evento e evento sem pedido. Inbox: efeito repetido e ack sem efeito.
- O cenário mostra o problema e o que queremos melhorar nos dois caminhos. "Em tela" marca o caminho do diagrama.
- A aresta acesa segue o evento da etapa, da origem para o destino, saindo do lado do nó que aponta para o destino. Cada caminho tem o próprio desenho. Um segundo participante de uma corrida é um nó próprio, e o primeiro permanece visível.
- Não escrever que Outbox ou Inbox garantem entrega exatamente uma vez.
- O ack do broker fica fora da transação local.

## Exercícios

Pelo menos quatro questões por módulo publicado. Cada uma é numerada e abre a própria resposta. O conjunto pergunta as duas ordens da operação partida e o que o padrão não garante.

## Atalhos e catálogo

- Espaço e setas avançam o laboratório só com o foco fora de botão, link, campo e do resumo do exercício.
- Catálogo e home ligam todo padrão, inclusive o planejado, à própria página. A home mostra a lista inteira.
- O catálogo não pula de título. Copiar inclui o arquivo. O zoom do diagrama está em português. A página inexistente tem título próprio.

## Padrão novo

Entra como definição, conteúdo e página no contrato atual. Não reescreva motor, controles nem diagrama para caber o módulo.
