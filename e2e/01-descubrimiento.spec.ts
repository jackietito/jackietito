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
  // Cada entidad enlaza a sus oportunidades o a sus trámites (D41).
  for (let i = 0; i < (await entidades.count()); i++) {
    await expect(entidades.nth(i).getByRole("link", { name: /^Ver sus \d+ (oportunidad|trámite)/ }).first()).toBeVisible();
  }
  await revisarAccesibilidad(page);
});

test("los enlaces de las entidades llevan a su catálogo o a sus trámites", async ({ page }) => {
  await page.goto("/");
  const entidades = page.getByRole("region", { name: "Entidades que publican información" }).getByRole("listitem");
  const conOportunidades = entidades.filter({ has: page.getByRole("link", { name: /oportunidad/ }) }).first();
  const enlace = conOportunidades.getByRole("link", { name: /oportunidad/ });
  const n = Number((await enlace.innerText()).match(/\d+/)![0]);
  await enlace.click();
  await expect(page).toHaveURL(/\/catalogo\?entidad=/);
  await expect(page.getByRole("status")).toHaveText(n === 1 ? "1 oportunidad encontrada" : `${n} oportunidades encontradas`);

  await page.goto("/");
  const conTramites = entidades.filter({ has: page.getByRole("link", { name: /trámite/ }) }).first();
  const enlaceT = conTramites.getByRole("link", { name: /trámite/ });
  const m = Number((await enlaceT.innerText()).match(/\d+/)![0]);
  await enlaceT.click();
  await expect(page).toHaveURL(/\/tramites\?entidad=/);
  await expect(page.getByRole("article")).toHaveCount(m);
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
  await page.locator("summary", { hasText: /^País/ }).click();
  await page.getByRole("group", { name: /^País/ }).getByLabel("España", { exact: true }).check();
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

test("filtra con varias opciones a la vez en país, nivel, modalidad, idioma y financiamiento", async ({ page }) => {
  await page.goto("/catalogo");
  await abrirFiltros(page);
  await page.locator("summary", { hasText: /^País/ }).click();
  const paises = page.getByRole("group", { name: /^País/ });
  await paises.getByLabel("España", { exact: true }).check();
  await paises.getByLabel("Chile", { exact: true }).check();
  await page.locator("summary", { hasText: /^Nivel/ }).click();
  const niveles = page.getByRole("group", { name: /^Nivel/ });
  await niveles.getByLabel("Maestría", { exact: true }).check();
  await niveles.getByLabel("Especialización", { exact: true }).check();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/pais=Chile/);
  await expect(page).toHaveURL(/pais=Espa/);

  const aplicados = page.getByRole("list", { name: "Filtros aplicados" }).getByRole("listitem");
  await expect(aplicados).toHaveCount(4);
  const tarjetas = page.getByRole("article");
  const n = await tarjetas.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    await expect(tarjetas.nth(i)).toContainText(/España|Chile/);
    await expect(tarjetas.nth(i)).toContainText(/Maestría|Especialización/);
  }
  // Al volver, las casillas elegidas siguen marcadas y el grupo indica cuántas.
  await abrirFiltros(page);
  await expect(page.locator("summary", { hasText: /^País/ })).toContainText("2 elegidos");
  await expect(paises.getByLabel("Chile", { exact: true })).toBeChecked();
  await revisarAccesibilidad(page);

  // Quitar una sola opción deja las demás.
  await page.getByRole("link", { name: /País: Chile/ }).click();
  await expect(aplicados).toHaveCount(3);
  await expect(page).not.toHaveURL(/pais=Chile/);

  await page.goto("/catalogo?modalidad=virtual&modalidad=semipresencial&idioma=Inglés&idioma=Francés&financiamiento=integral&financiamiento=parcial");
  await expect(page.getByRole("list", { name: "Filtros aplicados" }).getByRole("listitem")).toHaveCount(6);
  const otras = page.getByRole("article");
  for (let i = 0; i < (await otras.count()); i++) {
    await expect(otras.nth(i)).toContainText(/Virtual|Semipresencial/);
    await expect(otras.nth(i)).toContainText(/Inglés|Francés/);
    await expect(otras.nth(i)).toContainText(/Beca integral|Beca parcial/);
  }
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

test("la guía visual de uso se abre desde el pie de página, con sus capturas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Guía de uso/ }).click();
  await expect(page).toHaveURL(/\/guia$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Encuentra, compara y prepara");
  await expect(page.getByRole("note")).toContainText("Prototipo académico – datos ficticios");
  const pasos = page.locator("section.paso");
  await expect(pasos).toHaveCount(6);
  // Todas las capturas cargan.
  const imagenes = page.locator("img");
  const n = await imagenes.count();
  for (let i = 0; i < n; i++) {
    await imagenes.nth(i).scrollIntoViewIfNeeded();
    await expect.poll(() => imagenes.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await page.getByRole("link", { name: /Abrir Talento sin Fronteras/ }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test("la guía visual cumple la revisión de accesibilidad", async ({ page }) => {
  await page.goto("/guia");
  await revisarAccesibilidad(page);
});
