import { expect, test } from "@playwright/test";
import { abrirMenu, ingresar, navegacion, registrarCuenta, revisarAccesibilidad } from "./utilidades";

// Incremento 3 — Mapa de trámites, ruta paso a paso y checklist (paso 4 del recorrido).

const OPORTUNIDAD = "Beca de Cooperación Iberoamericana en Innovación Educativa";

test("el mapa de trámites muestra los trámites con entidad, plazo y costo referenciales", async ({ page }) => {
  await page.goto("/");
  await abrirMenu(page);
  await navegacion(page).getByRole("link", { name: "Trámites" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mapa de trámites");
  const tramites = page.getByRole("article");
  await expect(tramites).toHaveCount(8);
  await expect(tramites.first()).toContainText("Plazo referencial");
  await expect(tramites.first()).toContainText("Costo referencial");
  await expect(tramites.first()).toContainText("Ante:");
  // Las entidades peruanas responsables se nombran con su nombre real (D36).
  await expect(page.getByRole("article").filter({ hasText: "Apostillar documentos académicos" })).toContainText("Ministerio de Relaciones Exteriores (Cancillería)");
  await expect(page.getByRole("article").filter({ hasText: "Obtener constancia de inscripción del grado" })).toContainText("SUNEDU");
  await expect(page.getByRole("main").getByText(/verifícalos en el sitio oficial/)).toBeVisible();
  // Valores referenciales (D42): montos exactos, gratuitos y costos que no son un monto.
  const tramite = (nombre: string) => page.getByRole("article").filter({ hasText: nombre });
  await expect(tramite("Obtener certificado de antecedentes penales")).toContainText("Poder Judicial");
  await expect(tramite("Obtener certificado de antecedentes penales")).toContainText("S/ 40.40");
  await expect(tramite("Obtener certificado de antecedentes penales")).toContainText("Descarga inmediata si no hay observaciones");
  await expect(tramite("Obtener certificado de antecedentes policiales")).toContainText("S/ 133.28 (para uso en el extranjero)");
  await expect(tramite("Obtener certificado de antecedentes policiales")).toContainText("Entrega en 24 horas");
  await expect(tramite("Apostillar documentos académicos")).toContainText("Gratuito");
  await expect(tramite("Obtener constancia de inscripción del grado")).toContainText("Aprox. 1 día hábil");
  await expect(tramite("Solicitar copia certificada del diploma de grado")).toContainText("Según el TUPA de tu universidad");
  await expect(tramite("Rendir un examen internacional de idioma")).toContainText("Según el examen elegido (TOEFL, IELTS u otro)");
  await expect(tramite("Traducir oficialmente los documentos")).toContainText("Traductores públicos juramentados");
  await expect(tramite("Traducir oficialmente los documentos")).toContainText("Tarifa del traductor");
  // Los costos que no son un monto no se suman: el total es «desde».
  await expect(page.getByText(/el costo referencial sería desde S\/\s173\.68/)).toBeVisible();
  await revisarAccesibilidad(page);
});

test("sin cuenta, preparar la postulación pide ingresar", async ({ page }) => {
  await page.goto(`/catalogo?q=${encodeURIComponent(OPORTUNIDAD)}`);
  await page.getByRole("link", { name: OPORTUNIDAD, exact: true }).click();
  await page.getByRole("link", { name: "Preparar mi postulación" }).click();
  await expect(page).toHaveURL(/\/ingresar\?volver=%2Fruta%2F/);
});

test("genera la ruta y el checklist, marca avances y se conservan", async ({ page }) => {
  await registrarCuenta(page);
  await page.goto(`/catalogo?q=${encodeURIComponent(OPORTUNIDAD)}`);
  await page.getByRole("link", { name: OPORTUNIDAD, exact: true }).click();
  await page.getByRole("link", { name: "Preparar mi postulación" }).click();
  await expect(page).toHaveURL(/\/ruta\//);
  await revisarAccesibilidad(page);
  await page.getByRole("button", { name: "Generar mi ruta y checklist" }).click();
  await expect(page.getByRole("status")).toContainText("generamos tu ruta y tu checklist");

  // Ruta: pasos ordenados con fecha calculada desde el cierre; el último es la postulación oficial.
  const pasos = page.getByRole("region", { name: "Ruta paso a paso" }).getByRole("article");
  const n = await pasos.count();
  expect(n).toBeGreaterThan(2);
  await expect(pasos.first()).toContainText("Empieza a más tardar el");
  await expect(pasos.nth(n - 1)).toContainText("Postular en el canal oficial");
  await expect(pasos.nth(n - 1).getByRole("link", { name: /Ir a la convocatoria oficial/ })).toHaveAttribute("href", /example\.org/);

  // Checklist: marcar un requisito actualiza el avance.
  const avance = page.getByRole("region", { name: "Mi avance" });
  await expect(avance).toContainText(/Tienes 0 de \d+ requisitos listos \(0%\)/);
  const checklist = page.getByRole("region", { name: "Mi checklist" });
  const primera = checklist.getByRole("checkbox").first();
  await primera.check();
  await expect(avance).toContainText(/Tienes 1 de \d+ requisitos listos/);

  // Estado autodeclarado de un trámite.
  const selector = pasos.first().getByLabel(/Mi avance/);
  await selector.selectOption("en_curso");
  await expect(pasos.first().getByText("Guardado: En curso.")).toBeVisible();
  await revisarAccesibilidad(page);

  await page.reload();
  await expect(page.getByRole("region", { name: "Mi checklist" }).getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByRole("region", { name: "Ruta paso a paso" }).getByRole("article").first().getByLabel(/Mi avance/)).toHaveValue("en_curso");

  // La oportunidad queda guardada en el panel con su porcentaje.
  await page.goto("/panel");
  await expect(page.getByRole("link", { name: /Ver mi ruta y checklist \(\d+% listo\)/ })).toBeVisible();
});

test("una ruta con avances previos muestra el progreso", async ({ page }) => {
  await ingresar(page, "diego@ventanilla.test");
  await page.goto("/panel");
  await page.getByRole("link", { name: /Ver mi ruta y checklist/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Doctorado en Energías Renovables con beca de investigación");
  await expect(page.getByRole("region", { name: "Mi avance" })).toContainText(/Tienes 3 de \d+ requisitos listos/);
  await expect(page.getByRole("progressbar", { name: /Checklist/ })).toBeVisible();
});

test("no se arma una ruta para una convocatoria cerrada", async ({ page }) => {
  await ingresar(page, "lucia@ventanilla.test");
  await page.goto("/catalogo?estado=cerrada");
  await page.getByRole("article").first().getByRole("heading").getByRole("link").click();
  await expect(page).toHaveURL(/\/oportunidades\//);
  await expect(page.getByRole("link", { name: "Preparar mi postulación" })).toHaveCount(0);
  const id = page.url().split("/").pop();
  await page.goto(`/ruta/${id}`);
  await expect(page.getByText("Esta convocatoria ya cerró, por eso no podemos armar una ruta.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generar mi ruta y checklist" })).toHaveCount(0);
});
