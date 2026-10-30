import { expect, test } from "@playwright/test";
import { abrirFiltros, revisarAccesibilidad } from "./utilidades";

// Incremento 1 — Catálogo, ficha, buscador y filtros (pasos 1 y 3 del recorrido).

test("la página de inicio reúne oportunidades de varias fuentes y muestra el banner del prototipo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note", { name: "Aviso de prototipo" })).toContainText("Prototipo académico – datos ficticios");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("en un solo lugar");
  await expect(page.getByRole("heading", { name: "Convocatorias próximas a cerrar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Oportunidades destacadas" })).toBeVisible();
  const entidades = page.getByRole("region", { name: "Entidades que publican información" }).getByRole("listitem");
  await expect(entidades).toHaveCount(5);
  await revisarAccesibilidad(page);
});

test("el banner sigue visible al desplazarse", async ({ page }) => {
  await page.goto("/catalogo");
  await page.mouse.wheel(0, 3000);
  await expect(page.getByRole("note", { name: "Aviso de prototipo" })).toBeInViewport();
});

test("el catálogo lista oportunidades con su fuente y fecha de actualización", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.getByRole("status")).toHaveText("36 oportunidades encontradas");
  const primera = page.getByRole("article").first();
  await expect(primera).toContainText("Fuente:");
  await expect(primera).toContainText("Actualizada el");
  await revisarAccesibilidad(page);
});

test("filtra por país, estado y texto libre", async ({ page }) => {
  await page.goto("/catalogo");
  await abrirFiltros(page);
  await page.getByLabel("País").selectOption("España");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/pais=Espa/);
  const tarjetas = page.getByRole("article");
  const n = await tarjetas.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) await expect(tarjetas.nth(i)).toContainText("España");

  await page.getByRole("link", { name: /País: España/ }).click();
  await expect(page.getByRole("status")).toHaveText("36 oportunidades encontradas");

  await page.goto("/catalogo?estado=cerrada");
  const cerradas = page.getByRole("article");
  expect(await cerradas.count()).toBeGreaterThan(0);
  await expect(cerradas.first()).toContainText("Convocatoria cerrada");

  await page.goto("/catalogo?q=ecologia%20amazonica");
  await expect(page.getByRole("status")).toHaveText("1 oportunidad encontrada");
});

test("filtra por costo total, financiamiento y fecha de inicio", async ({ page }) => {
  await page.goto("/catalogo?costoMax=10000&financiamiento=ninguno&inicioDesde=2000-01-01");
  await expect(page.getByRole("list", { name: "Filtros aplicados" }).getByRole("listitem")).toHaveCount(3);
  const tarjetas = page.getByRole("article");
  const n = await tarjetas.count();
  for (let i = 0; i < n; i++) await expect(tarjetas.nth(i)).toContainText("Sin financiamiento");
  await page.goto("/catalogo?inicioHasta=2000-01-01");
  await expect(page.getByText("No encontramos oportunidades con esos filtros.")).toBeVisible();
});

test("la ficha muestra todos los grupos de la ficha estándar y el enlace oficial", async ({ page }) => {
  await page.goto("/catalogo?q=Innovación Educativa");
  await page.getByRole("link", { name: "Beca de Cooperación Iberoamericana en Innovación Educativa", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Beca de Cooperación Iberoamericana en Innovación Educativa");
  for (const titulo of ["Datos académicos", "Convocatoria", "Costos", "Financiamiento", "Requisitos", "Trámites nacionales asociados", "Fuente y actualización"]) {
    await expect(page.getByRole("heading", { name: titulo, level: 2 })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Ir a la convocatoria oficial/ })).toHaveAttribute("href", /^https:\/\/example\.org\//);
  await revisarAccesibilidad(page);
});
