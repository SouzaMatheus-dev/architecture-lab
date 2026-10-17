# Como contribuir

1. Abra uma issue com o resultado esperado e o critério de aceite.
2. Crie um branch a partir de `main`.
3. Mantenha conteúdo, motor e interface nas fronteiras descritas em `AGENTS.md`.
4. Rode `corepack pnpm test`, `corepack pnpm typecheck` e `corepack pnpm lint`.
5. Abra um pull request para `main` usando o template. A prévia da Vercel e a revisão precedem o merge.
6. Depois do merge, publique uma GitHub Release com tag `vX.Y.Z`. As notas descrevem o que mudou para quem estuda. O site público acompanha `main`.

Mudanças em dependências, workflows e permissões pedem revisão extra. Conteúdo técnico novo precisa apontar a simplificação didática que permanece de fora.
