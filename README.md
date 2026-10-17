# Architecture Lab

Plataforma pública para estudar padrões de arquitetura de software. O aluno percorre um fluxo, pausa em cada evento, injeta uma falha conhecida e compara o caminho com e sem o padrão.

O primeiro módulo é o **Transactional Outbox**. A simulação roda no navegador. Não há API, banco da plataforma nem broker real.

## Requisitos

- Node.js 22 ou superior
- pnpm 10

## Começar

```bash
corepack pnpm install
corepack pnpm dev
```

A aplicação abre em `http://localhost:3000`. O laboratório fica em `/patterns/transactional-outbox`.

## Comandos

| Comando | Uso |
| --- | --- |
| `corepack pnpm dev` | Sobe o Next.js |
| `corepack pnpm test` | Testes do motor e dos cenários |
| `corepack pnpm typecheck` | Verificação de tipos |
| `corepack pnpm lint` | Biome |
| `corepack pnpm build` | Build de produção |
| `corepack pnpm test:e2e` | Playwright nos fluxos principais |

## Estrutura

- `apps/web`: páginas, diagramas e experiência do laboratório.
- `packages/simulation-engine`: estados, eventos, transições e falhas. Não depende de React.
- `content`: catálogo, roteiros do Outbox e exemplos .NET.
- `docs/adr`: decisões registradas.
- `docs/agents`: instruções dos papéis especializados.
- `AGENTS.md`: regras comuns para quem implementa no repositório.

## Publicação

O projeto é um monorepo. Na Vercel, o diretório raiz da aplicação é `apps/web`. O passo a passo está em `docs/development/vercel.md`.

Defina `NEXT_PUBLIC_SITE_URL` com a URL pública para metadados e sitemap.

## Precisão do Outbox

A simulação mostra que o pedido e a intenção de publicar compartilham uma transação local. Ela também mostra que isso não produz entrega exatamente uma vez. Uma falha depois do ack do broker pode publicar a mensagem de novo, e o consumidor precisa ser idempotente.
