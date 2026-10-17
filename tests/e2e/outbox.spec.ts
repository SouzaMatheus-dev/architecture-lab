import { expect, test } from "@playwright/test";

test("abre o Outbox, avança uma etapa e aplica a falha do Kafka", async ({ page }) => {
  await page.goto("/patterns/transactional-outbox");
  await expect(page.getByRole("heading", { level: 1, name: "Transactional Outbox" })).toBeVisible();

  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByText("Etapa 1 de")).toBeVisible();

  await page.locator("label.choice", { hasText: "Kafka indisponível" }).click();
  await expect(page.getByText("Pronta para iniciar")).toBeVisible();
  await expect(page.getByText("O pedido continua confirmado.")).toBeVisible();

  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeEnabled();
});

test("abre o Inbox e mostra que a queda antes do ack não duplica a cobrança", async ({ page }) => {
  await page.goto("/patterns/transactional-inbox");
  await expect(page.getByRole("heading", { level: 1, name: "Transactional Inbox" })).toBeVisible();
  await page.locator("label.choice", { hasText: "Queda antes do ack" }).click();
  await expect(page.getByText("não duplica a cobrança")).toBeVisible();
});

test("compara o caminho sem Outbox", async ({ page }) => {
  await page.goto("/patterns/transactional-outbox");
  await page.locator("label.choice", { hasText: "Sem Outbox" }).click();
  await expect(page.getByText("publica direto no Kafka")).toBeVisible();
});

test("o exercício abre a resposta sem iniciar a simulação", async ({ page }) => {
  await page.goto("/patterns/transactional-outbox");
  const summary = page.locator(".exercise-item summary").first();
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("Idempotência.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar", exact: true })).toBeEnabled();
  await expect(page.getByText("Etapa atual, ainda não iniciada")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Etapa atual, ainda não iniciada")).toBeVisible();
});

test("copiar nomeia o arquivo e o zoom fala português", async ({ page }) => {
  await page.goto("/patterns/transactional-outbox");
  await expect(page.getByRole("button", { name: "Copiar CreateOrder.cs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar OutboxDispatcher.cs" })).toBeVisible();
  await expect(page.locator(".react-flow__controls-zoomin")).toHaveAttribute(
    "aria-label",
    "Ampliar",
  );
  await expect(page.locator(".react-flow__controls-zoomout")).toHaveAttribute(
    "aria-label",
    "Reduzir",
  );
  await expect(page.locator(".react-flow__controls-fitview")).toHaveAttribute(
    "aria-label",
    "Ajustar à tela",
  );
});

test("catálogo e home levam aos módulos planejados", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 3, name: "Retry" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Cache-Aside" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "API Gateway" })).toBeVisible();

  await page.goto("/patterns");
  await expect(page.getByRole("heading", { level: 2, name: "Saga" })).toBeVisible();
  await page.getByRole("link", { name: /Saga/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Saga" })).toBeVisible();
  await expect(page.getByText("Este módulo ainda não tem simulação.")).toBeVisible();
});

test("a página inexistente tem título próprio", async ({ page }) => {
  await page.goto("/rota-inexistente");
  await expect(page).toHaveTitle("Página não encontrada · Architecture Lab");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Esta página não está no laboratório.",
  );
});
