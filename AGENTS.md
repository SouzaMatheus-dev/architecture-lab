# AGENTS.md

Regras comuns para agentes e revisores do Architecture Lab. Instruções de papel ficam em `docs/agents/` e não podem contradizer este arquivo.

## Produto

Ensinar padrões de arquitetura com simulações reproduzíveis, cenários de falha e exemplos em .NET. O conceito é independente de linguagem. O exemplo concreto não redefine o conceito.

O MVP é uma aplicação web estática e interativa. Não adicionar autenticação, banco da plataforma, execução de código enviado pelo usuário, Kafka real ou geração autônoma de conteúdo em produção.

## Stack

- Next.js e TypeScript em `apps/web`
- Motor puro em `packages/simulation-engine`
- Conteúdo em `content`
- Zod nos contratos do motor
- Vitest para regras e transições
- Playwright para os fluxos de tela
- Biome para lint e formato
- pnpm como gerenciador

## Separação

- Conteúdo explica o problema, os trade-offs e o exemplo.
- A definição da simulação descreve componentes, eventos e falhas.
- A interface desenha o estado. Ela não decide a próxima verdade do cenário.
- O motor não importa React.
- Temporizadores só controlam a velocidade visual. A sequência vem dos comandos `stepForward`, `stepBack`, `goTo` e da falha selecionada.

## Código

- Identificadores, arquivos e tipos em inglês.
- Texto visível ao aluno em português do Brasil.
- Cada padrão tem um slug estável e uma URL `/patterns/<slug>`.
- Uma falha ativa substitui o roteiro inteiro e reinicia a execução.
- Falhas do mesmo padrão são mutuamente exclusivas.
- Mudança de arquitetura relevante entra em `docs/adr` antes de se espalhar pelo código.

## Precisão técnica

- Não afirmar que o Transactional Outbox garante entrega exatamente uma vez.
- Deixar visível a janela entre o ack do broker e a atualização da Outbox.
- Tratar consumidor idempotente como parte do desenho, não como detalhe opcional.
- Nomear simplificações didáticas, inclusive limites de retry e a escolha entre polling e CDC.
- O exemplo .NET deve usar a mesma transação local para o pedido e a mensagem. O dispatcher simplificado deve dizer o que falta para produção.
- No caminho sem o padrão, as duas ordens da operação partida ficam visíveis. No Outbox: pedido sem evento e evento sem pedido. No Inbox: efeito repetido e ack sem efeito.

## Interface

- Os controles de reprodução são botões com nome acessível. A velocidade fica na mesma linha, com o rótulo alinhado ao centro dos botões.
- O estado dos componentes existe em texto, além do diagrama.
- A narrativa da etapa atual usa uma região `aria-live`.
- O laboratório funciona com teclado: Espaço e setas. O atalho fica inativo com o foco em botão, link, campo ou no resumo de um exercício.
- Respeitar `prefers-reduced-motion`.
- O diagrama pode ser ampliado. A lista de estados continua disponível em telas estreitas.
- O laboratório se lê em quatro passos: cenário, percurso, o que acontece agora e registros.
- A seção "Como ler a simulação" fica antes do laboratório, em toda página de padrão, com os mesmos quatro passos da home.
- Cada troca de etapa destaca o painel ao lado do diagrama. O destaque traz o número da etapa e uma marca persistente. A animação some quando o usuário pede menos movimento.
- Cada padrão publicado tem um conjunto de exercícios. As questões cobrem o que o padrão não garante e as duas ordens da operação partida. Cada questão é numerada e abre a própria resposta.
- Catálogo e home ligam cada padrão, inclusive o planejado, à própria página. A home mostra a lista inteira. No catálogo, o título da página é seguido pelos títulos dos módulos, sem pular nível.
- O botão de copiar exemplo inclui o nome do arquivo. O zoom do diagrama fala português: Ampliar, Reduzir e Ajustar à tela.
- A página inexistente usa o título "Página não encontrada".
- A marca do cabeçalho e o ícone do site usam o mesmo selo.

## Comandos oficiais

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm test:e2e
```

## Pull request

Uma tarefa só termina com evidência:

- testes do comportamento alterado passando;
- `pnpm typecheck` e `pnpm lint` sem erro;
- build quando a mudança afeta a aplicação;
- para fluxo de tela, verificação no navegador ou Playwright;
- descrição do que mudou e de como foi validado.

Não misturar dependência nova, workflow e conteúdo didático no mesmo pull request sem necessidade. Não colocar segredo no repositório.

## Publicação

Toda mudança entra em `main` por pull request. A branch principal não recebe commit direto.

Cada publicação gera uma GitHub Release com tag `vX.Y.Z`. As notas dizem o que o aluno passa a ver e apontam o site. A Vercel publica a partir de `main` depois do merge. Não fazer deploy de produção por fora desse fluxo.

## Conclusão

O motor está pronto para outro padrão quando Saga, CQRS ou Circuit Breaker puderem ser adicionados como nova definição e novo conteúdo, sem reescrever estados, controles ou o diagrama.
