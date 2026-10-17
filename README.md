# Architecture Lab

[![Site](https://img.shields.io/badge/site-no%20ar-1c1916?style=flat-square)](https://architecture-lab-gamma.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/SouzaMatheus-dev/architecture-lab/ci.yml?branch=main&style=flat-square&label=ci)](https://github.com/SouzaMatheus-dev/architecture-lab/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SouzaMatheus-dev/architecture-lab?style=flat-square&label=release)](https://github.com/SouzaMatheus-dev/architecture-lab/releases)
[![Node](https://img.shields.io/badge/node-22-1f6b45?style=flat-square)](.node-version)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-1e4d6b?style=flat-square)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-10.18-a16207?style=flat-square)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16-111111?style=flat-square)](apps/web/package.json)
[![Licença](https://img.shields.io/badge/licença-tutela%20do%20autor-9a3412?style=flat-square)](LICENSE)

![Selo do Architecture Lab](apps/web/app/icon.svg)

Laboratório para estudar padrões de arquitetura de software. Cada módulo mostra o problema, o fluxo, uma falha, o que ficou gravado e um exemplo de referência em .NET. A simulação roda no navegador: não há API, banco da plataforma nem broker real.

O conceito é independente de linguagem. O exemplo concreto não redefine o conceito.

## Temas

| Tema | O que o catálogo cobre |
| --- | --- |
| Consistência | Outbox, Inbox, Saga |
| Modelo | CQRS, Event Sourcing |
| Resiliência | Circuit Breaker, Retry |
| Dados | Cache-Aside |
| Borda | API Gateway |

## Módulos

| Módulo | Tema | Situação |
| --- | --- | --- |
| [Transactional Outbox](https://architecture-lab-gamma.vercel.app/patterns/transactional-outbox) | Consistência | Disponível |
| [Transactional Inbox](https://architecture-lab-gamma.vercel.app/patterns/transactional-inbox) | Consistência | Disponível |
| Saga | Consistência | Planejado |
| CQRS | Modelo | Planejado |
| Event Sourcing | Modelo | Planejado |
| Circuit Breaker | Resiliência | Planejado |
| Retry | Resiliência | Planejado |
| Cache-Aside | Dados | Planejado |
| API Gateway | Borda | Planejado |

No Outbox, o pedido e a intenção de publicar compartilham uma transação local. Na Inbox, o efeito e o identificador da mensagem fazem o mesmo. O ack do broker fica fora dessas transações. Nenhum dos dois produz entrega exatamente uma vez.

## Como estudar

A bancada de cada módulo se lê em quatro passos:

1. **Cenário.** Escolha o desenho com o padrão ou sem ele, e uma falha. A falha troca o roteiro inteiro.
2. **Percurso.** Avance pela trilha de eventos. A velocidade só muda o ritmo visual.
3. **Agora.** Leia a frase da etapa ao lado do diagrama.
4. **Registros.** Confira nas tabelas o que ficou gravado.

## Começar

Requisitos: Node.js 22 ou superior e pnpm 10.

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

| Caminho | Papel |
| --- | --- |
| `apps/web` | Páginas, diagrama e bancada do laboratório |
| `packages/simulation-engine` | Estados, eventos, transições e falhas. Sem React |
| `content` | Catálogo, roteiros e exemplos .NET |
| `docs/adr` | Decisões registradas |
| `docs/agents` | Instruções dos papéis especializados |
| `AGENTS.md` | Regras comuns de implementação |

## Publicação

O site público está em [architecture-lab-gamma.vercel.app](https://architecture-lab-gamma.vercel.app). Na Vercel, o diretório raiz da aplicação é `apps/web`. O passo a passo está em `docs/development/vercel.md`.

Mudanças entram em `main` por pull request. Cada publicação gera uma [GitHub Release](https://github.com/SouzaMatheus-dev/architecture-lab/releases). A versão atual do produto é `0.2.4`.

Defina `NEXT_PUBLIC_SITE_URL` com a URL pública para metadados e sitemap.

## Autoria

Matheus Pereira de Souza Neves. Site: [mathneves.com](https://mathneves.com/). GitHub: [@SouzaMatheus-dev](https://github.com/SouzaMatheus-dev).

## Licença

Código, textos, diagramas, simulações, exemplos e marca pertencem a Matheus Pereira de Souza Neves e permanecem sob a tutela do autor. Consultar o repositório e usar o site para estudo é permitido. Copiar, modificar, redistribuir ou explorar o material exige autorização prévia e por escrito. O texto completo está em [LICENSE](LICENSE).
