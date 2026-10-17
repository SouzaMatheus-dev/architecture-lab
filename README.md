# Architecture Lab

[![Site](https://img.shields.io/badge/site-no%20ar-9a3412)](https://architecture-lab-gamma.vercel.app)
[![Autor](https://img.shields.io/badge/autor-mathneves.com-7c2d12)](https://mathneves.com/)
[![Licença](https://img.shields.io/badge/licença-tutela%20do%20autor-1d1a16)](LICENSE)
[![Node](https://img.shields.io/badge/node-22-1f6b45)](.node-version)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-1e4d6b)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-10-a16207)](package.json)

![Marca do Architecture Lab](apps/web/app/icon.svg)

Plataforma para estudar padrões de arquitetura de software. Cada módulo mostra o problema, o fluxo, uma falha conhecida, os trade-offs e um exemplo de referência. A simulação roda no navegador: não há API, banco da plataforma nem broker real.

O catálogo já reserva lugar para consistência, modelo, resiliência, dados e borda. O **Transactional Outbox** é o primeiro laboratório completo. Os demais entram como nova definição e novo conteúdo, sem reescrever o motor, os controles ou o diagrama.

`consistência` · `modelo` · `resiliência` · `dados` · `borda`

## Módulos

| Módulo | Tema | Situação |
| --- | --- | --- |
| [Transactional Outbox](https://architecture-lab-gamma.vercel.app/patterns/transactional-outbox) | Consistência | Disponível |
| Saga | Consistência | Planejado |
| CQRS | Modelo | Planejado |
| Event Sourcing | Modelo | Planejado |
| Circuit Breaker | Resiliência | Planejado |
| Retry | Resiliência | Planejado |
| Cache-Aside | Dados | Planejado |
| API Gateway | Borda | Planejado |

O módulo disponível hoje é o Transactional Outbox. Ali, o pedido e a intenção de publicar compartilham uma transação local. Isso não produz entrega exatamente uma vez: o consumidor precisa ser idempotente.

## Licença

Código, textos, diagramas, simulações, exemplos e marca pertencem a Matheus Pereira de Souza Neves e permanecem sob a tutela do autor. Consultar o repositório e usar o site para estudo é permitido. Copiar, modificar, redistribuir ou explorar o material exige autorização prévia e por escrito. O texto completo está em [LICENSE](LICENSE).

## Requisitos

- Node.js 22 ou superior
- pnpm 10

## Começar

```bash
corepack pnpm install
corepack pnpm dev
```

A aplicação abre em `http://localhost:3000`. O catálogo fica em `/patterns`.

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
- `content`: catálogo, roteiros de cada padrão e exemplos .NET.
- `docs/adr`: decisões registradas.
- `docs/agents`: instruções dos papéis especializados.
- `AGENTS.md`: regras comuns para quem implementa no repositório.

## Publicação

O site público está em [architecture-lab-gamma.vercel.app](https://architecture-lab-gamma.vercel.app). O projeto é um monorepo. Na Vercel, o diretório raiz da aplicação é `apps/web`. O passo a passo está em `docs/development/vercel.md`.

Defina `NEXT_PUBLIC_SITE_URL` com a URL pública para metadados e sitemap.
