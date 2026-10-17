# Vercel

1. Importe o repositório GitHub.
2. Defina o diretório raiz como `apps/web`.
3. A Vercel deve detectar pnpm e Next.js. O comando de instalação continua na raiz do monorepo, para que os workspaces sejam ligados.
4. O comando de build é `pnpm build`, executado em `apps/web`, ou o build padrão do Next.js se a detecção do workspace estiver correta.
5. Produção publica a branch `main`. Pull requests recebem preview. Cada publicação de `main` também gera uma GitHub Release.
6. Configure `NEXT_PUBLIC_SITE_URL` com a URL pública.

O build precisa incluir `packages/simulation-engine` e `content`. `transpilePackages` e `outputFileTracingRoot` apontam para a raiz do monorepo a partir de `apps/web`.

Não há variáveis secretas no MVP.
