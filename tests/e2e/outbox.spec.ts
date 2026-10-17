import { expect, test } from "@playwright/test";

test("abre o Outbox, avança uma etapa e aplica a falha do Kafka", async ({ page }) => {
  await page.goto("/patterns/transactional-outbox");
  await expect(page.getByRole("heading", { level: 1, name: "Transactional Outbox" })).toBeVisible();

  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByText("Etapa 1 de")).toBeVisible();

  await page.locator("label.choice", { hasText: "Kafka indisponível" }).click();
  await expect(page.getByText("Pronta para iniciar")).toBeVisible();
  await expect(page.getByText("O pedido continua confirmado.")).toBeVisible();

  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeEnabled();
});

test("compara o caminho sem Outbox", async ({ page }) => {
  await page.goto("/patterns/transactional-outbox");
  await page.locator("label.choice", { hasText: "Sem Outbox" }).click();
  await expect(page.getByText("publica direto no Kafka")).toBeVisible();
});
