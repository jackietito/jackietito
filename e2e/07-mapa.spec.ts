import { expect, test } from "@playwright/test";
import { abrirFiltros, cerrarFiltros, revisarAccesibilidad } from "./utilidades";

// Mapa mundial del catálogo (D47): totales por continente y país; un clic filtra el catálogo.

test("el mapa muestra totales por continente y país, y filtra el catálogo al elegir un país", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByRole("link", { name: "Ver en el mapa mundial" }).click();
  await expect(page).toHaveURL(/\/catalogo\/mapa$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mapa de oportunidades");
  await expect(page.getByText(/47 oportunidades en 14 países/)).toBeVisible();

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

test("la lista y el mapa comparten los mismos filtros", async ({ page }) => {
  // Filtro aplicado en la lista: se conserva al pasar al mapa.
  await page.goto("/catalogo?nivel=doctorado&estado=abierta");
  const enLista = Number((await page.getByRole("status").innerText()).match(/\d+/)![0]);
  await page.getByRole("link", { name: "Ver en el mapa mundial" }).click();
  await expect(page).toHaveURL(/\/catalogo\/mapa\?.*nivel=doctorado/);
  await expect(page.getByText(new RegExp(`^${enLista} oportunidad(es)? en \\d+ pa(í|i)s(es)? con los filtros aplicados`))).toBeVisible();
  const aplicados = page.getByRole("list", { name: "Filtros aplicados" }).getByRole("listitem");
  await expect(aplicados).toHaveCount(2);
  await revisarAccesibilidad(page);

  // El formulario del mapa filtra el mapa.
  await abrirFiltros(page);
  await page.locator("summary", { hasText: /^Idioma/ }).click();
  await page.getByRole("group", { name: /^Idioma/ }).getByLabel("Inglés", { exact: true }).check();
  await expect(page).toHaveURL(/\/catalogo\/mapa\?.*idioma=Ingl/);
  await cerrarFiltros(page);
  await expect(aplicados).toHaveCount(3);

  // Un país del mapa abre la lista con los mismos filtros y ese país.
  await page.getByRole("table").getByRole("link").first().click();
  await expect(page).toHaveURL(/\/catalogo\?/);
  await expect(page).toHaveURL(/nivel=doctorado/);
  await expect(page).toHaveURL(/estado=abierta/);
  await expect(page).toHaveURL(/idioma=Ingl/);
  await expect(page).toHaveURL(/pais=/);
  const tarjetas = page.getByRole("article");
  for (let i = 0; i < (await tarjetas.count()); i++) {
    await expect(tarjetas.nth(i)).toContainText("Doctorado");
    await expect(tarjetas.nth(i)).toContainText("Convocatoria abierta");
  }
});

test("Estados Unidos aparece en el mapa con sus oportunidades", async ({ page }) => {
  await page.goto("/catalogo/mapa");
  const eeuu = page.getByRole("link", { name: /^Estados Unidos: \d+ oportunidades/ });
  const n = Number((await eeuu.getAttribute("aria-label"))!.match(/\d+/)![0]);
  expect(n).toBeGreaterThanOrEqual(10);
});
