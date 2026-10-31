import { expect, test, type Page } from "@playwright/test";
import { abrirMenu, alerta, ingresar, revisarAccesibilidad } from "./utilidades";

// Incremento 5 — Gestión de contenidos, tablero de indicadores y reporte a entidades
// (criterio de aceptación: el gestor crea y actualiza una ficha y el administrador ve el efecto).

async function salir(page: Page) {
  await page.goto("/");
  await abrirMenu(page);
  await page.getByRole("button", { name: "Salir" }).filter({ visible: true }).click();
  await abrirMenu(page);
  await expect(page.getByRole("link", { name: "Ingresar" }).filter({ visible: true })).toBeVisible();
}

/** Lee «N de M fichas publicadas» del indicador de fichas completas del tablero. */
async function fichasCompletas(page: Page) {
  await page.goto("/admin");
  const texto = await page.getByRole("listitem").filter({ hasText: "Oportunidades publicadas con ficha estándar completa" }).innerText();
  const m = texto.match(/(\d+) de (\d+) fichas publicadas/);
  expect(m, texto).not.toBeNull();
  return { completas: Number(m![1]), publicadas: Number(m![2]) };
}

const en = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });

test("el gestor ve sus fichas con avisos de incompletas y desactualizadas", async ({ page }) => {
  await ingresar(page, "gestor.fonabep@ventanilla.test");
  await expect(page).toHaveURL(/\/gestion/);
  const ficha = page.getByRole("article").filter({ hasText: "Crédito Educativo para Maestría en Agronegocios" });
  await expect(ficha).toContainText("Incompleta");
  await expect(ficha).toContainText("Falta: cobertura del financiamiento.");
  await revisarAccesibilidad(page);

  // No puede editar fichas de otra entidad.
  await page.goto(`/catalogo?q=${encodeURIComponent("Beca de Cooperación Iberoamericana en Innovación Educativa")}`);
  await page.getByRole("link", { name: "Beca de Cooperación Iberoamericana en Innovación Educativa", exact: true }).click();
  await expect(page).toHaveURL(/\/oportunidades\//);
  const id = page.url().split("/").pop();
  await page.goto(`/gestion/oportunidades/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("No encontramos esta página");
});

test("el gestor confirma la vigencia de una ficha desactualizada", async ({ page }) => {
  await ingresar(page, "gestor.uhor@ventanilla.test");
  const boton = page.getByRole("button", { name: /^Confirmar que sigue vigente:/ }).first();
  test.skip(!(await boton.isVisible()), "No quedan fichas desactualizadas en esta base de pruebas");
  const nombre = (await boton.getAttribute("aria-label"))!.replace("Confirmar que sigue vigente: ", "");
  await boton.click();
  await expect(page.getByRole("status")).toHaveText(`Confirmamos que «${nombre}» sigue vigente.`);
  await expect(page.getByRole("article").filter({ hasText: nombre })).not.toContainText("Desactualizada");
});

test("el gestor crea y actualiza una ficha, y el administrador ve el efecto en el tablero", async ({ page }) => {
  await ingresar(page, "admin@ventanilla.test");
  const antes = await fichasCompletas(page);
  await salir(page);

  const nombre = `Maestría en Gobierno Abierto ${Date.now()}`;
  await ingresar(page, "gestor.fonabep@ventanilla.test");
  await page.getByRole("link", { name: "Nueva ficha" }).click();
  await revisarAccesibilidad(page);

  // Validación de campos obligatorios.
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  await expect(alerta(page)).toContainText("Escribe el nombre de la oportunidad");
  await expect(campo(page, "Nombre de la oportunidad")).toHaveAttribute("aria-invalid", "true");

  await campo(page, "Tipo").selectOption("programa_con_beca");
  await campo(page, "Nombre de la oportunidad").fill(nombre);
  await campo(page, "Institución oferente").fill("Universidad de Valdemora");
  await campo(page, "País").fill("España");
  await campo(page, "Ciudad").fill("Sevilla");
  await campo(page, "Descripción breve").fill("Maestría ficticia creada en la prueba de gestión de contenidos.");
  await campo(page, "Área de estudio").selectOption("Gestión pública y políticas");
  await campo(page, "Nivel").selectOption("maestria");
  await campo(page, "Modalidad").selectOption("virtual");
  await campo(page, "Idioma").selectOption("Español");
  await campo(page, "Duración (meses)").fill("12");
  await campo(page, "Inicio de clases").fill(en(200));
  await campo(page, "Fecha de apertura").fill(en(-5));
  await campo(page, "Fecha de cierre").fill(en(40));
  await campo(page, "Moneda").selectOption("EUR");
  await campo(page, "Matrícula del programa completo").fill("6000");
  await campo(page, "Costo de vida mensual estimado (0 si es virtual)").fill("0");
  await campo(page, "Otros costos (seguro, visa, fondo de garantía)").fill("0");
  await campo(page, "Tipo de financiamiento").selectOption("parcial");
  await campo(page, "Requisitos: académico").fill("Grado de bachiller\nExperiencia de 2 años en el sector público");
  await page.getByLabel("Apostillar documentos académicos").check();
  await campo(page, "Enlace oficial de la convocatoria").fill("https://example.org/convocatorias/gobierno-abierto");
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  // Falta la cobertura, obligatoria si hay financiamiento; los demás datos se conservan.
  await expect(alerta(page)).toContainText("Indica qué cubre el financiamiento");
  await expect(campo(page, "Nombre de la oportunidad")).toHaveValue(nombre);
  await campo(page, "Cobertura (obligatoria si hay financiamiento)").fill("50 % de la matrícula");
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  await expect(page.getByRole("status")).toHaveText(`Guardamos «${nombre}».`);

  // Aparece en el catálogo con su fuente y fecha de actualización.
  await page.goto(`/catalogo?q=${encodeURIComponent(nombre)}`);
  await expect(page.getByRole("status")).toHaveText("1 oportunidad encontrada");
  await expect(page.getByRole("article")).toContainText("Fuente: Fondo Nacional de Becas de Posgrado");
  await salir(page);

  await ingresar(page, "admin@ventanilla.test");
  const despues = await fichasCompletas(page);
  expect(despues.publicadas).toBe(antes.publicadas + 1);
  expect(despues.completas).toBe(antes.completas + 1);
  await salir(page);

  // El gestor actualiza la ficha y luego la despublica.
  await ingresar(page, "gestor.fonabep@ventanilla.test");
  await page.getByRole("link", { name: `Editar: ${nombre}` }).click();
  await expect(campo(page, "Requisitos: académico")).toHaveValue("Grado de bachiller\nExperiencia de 2 años en el sector público");
  await campo(page, "Cobertura (obligatoria si hay financiamiento)").fill("70 % de la matrícula");
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  await expect(page.getByRole("status")).toHaveText(`Guardamos «${nombre}».`);
  await page.goto(`/catalogo?q=${encodeURIComponent(nombre)}`);
  await page.getByRole("link", { name: nombre, exact: true }).click();
  await expect(page.getByText("70 % de la matrícula")).toBeVisible();

  await page.goto("/gestion");
  await page.getByRole("button", { name: `Despublicar: ${nombre}` }).click();
  await expect(page.getByRole("status")).toHaveText(`Retiramos «${nombre}» del catálogo.`);
  await page.goto(`/catalogo?q=${encodeURIComponent(nombre)}`);
  await expect(page.getByRole("status")).toHaveText("0 oportunidades encontradas");
});

test("el tablero muestra los cuatro indicadores y la desagregación por región", async ({ page }) => {
  await ingresar(page, "admin@ventanilla.test");
  await expect(page).toHaveURL(/\/admin/);
  for (const t of [
    "Oportunidades publicadas con ficha estándar completa",
    "Usuarios registrados que generan su checklist",
    "Usuarios que califican la información como clara, oportuna y útil",
    "Fichas actualizadas dentro del plazo acordado",
  ]) {
    await expect(page.getByRole("heading", { name: t })).toBeVisible();
  }
  const regiones = page.getByRole("table", { name: /por región/ });
  await expect(regiones.getByRole("rowheader", { name: "Ayacucho" })).toBeVisible();
  await expect(regiones.getByRole("rowheader", { name: "Lima" })).toBeVisible();
  await revisarAccesibilidad(page);
});

test("reporte por entidad con resultados de la encuesta y comentarios", async ({ page }) => {
  await ingresar(page, "admin@ventanilla.test");
  await page.goto("/reporte");
  await page.getByLabel("Entidad").selectOption("FONABEP");
  await page.getByRole("button", { name: "Ver reporte" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reporte para Fondo Nacional de Becas de Posgrado (FONABEP)");
  await expect(page.getByRole("heading", { name: /^Resumen \(\d+ respuestas?\)/ })).toBeVisible();
  await expect(page.getByText("«Desde Ayacucho no sabía que existía esta beca.»")).toBeVisible();
  await revisarAccesibilidad(page);
  await salir(page);

  // El gestor solo ve el reporte de su propia entidad.
  await ingresar(page, "gestor.orae@ventanilla.test");
  await page.goto("/reporte?entidad=FONABEP");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reporte para Oficina de Relaciones Académicas Exteriores (ORAE)");
  await expect(page.getByText("«La ficha no indicaba si aceptan títulos de bachiller.»")).toBeVisible();
});
