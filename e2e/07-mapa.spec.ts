import { expect, test } from "@playwright/test";
import { revisarAccesibilidad } from "./utilidades";

// Mapa mundial del catálogo (D47): totales por continente y país; un clic filtra el catálogo.

test("el mapa muestra totales por continente y país, y filtra el catálogo al elegir un país", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByRole("link", { name: "Ver en el mapa mundial" }).click();
  await expect(page).toHaveURL(/\/catalogo\/mapa$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mapa de oportunidades");
  await expect(page.getByText(/36 oportunidades en 13 países/)).toBeVisible();

  const europa = page.getByRole("region", { name: "Por continente" }).getByRole("link", { name: /Europa/ });
  await expect(europa).toContainText("15");
  await revisarAccesibilidad(page);

  // Cada país del mapa es un enlace con su total.
  const espana = page.getByRole("link", { name: /^España: \d+ oportunidad/ });
  const n = Number((await espana.getAttribute("aria-label"))!.match(/\d+/)![0]);
  await espana.click();
  await expect(page).toHaveURL(/\/catalogo\?pais=Espa/);
  await expect(page.getByRole("status")).toHaveText(n === 1 ? "1 oportunidad encontrada" : `${n} oportunidades encontradas`);

  // Un continente filtra por todos sus países.
  await page.goto("/catalogo/mapa");
  await europa.click();
  await expect(page.getByRole("status")).toHaveText("15 oportunidades encontradas");
});

test("el mapa puede mostrar solo convocatorias abiertas", async ({ page }) => {
  await page.goto("/catalogo/mapa");
  await page.getByRole("link", { name: "Solo convocatorias abiertas" }).click();
  await expect(page.getByText(/oportunidades con convocatoria abierta en \d+ países/)).toBeVisible();
  const tabla = page.getByRole("table");
  await tabla.getByRole("link").first().click();
  await expect(page).toHaveURL(/estado=abierta/);
});
