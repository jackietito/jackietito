import { expect, test, type Page } from "@playwright/test";
import { abrirMenu, alerta, ingresar, revisarAccesibilidad } from "./utilidades";

// Incremento 4 — Alertas, panel de seguimiento, orientación y encuesta (pasos 3 y 5 del recorrido).

async function salir(page: Page) {
  await page.goto("/");
  await abrirMenu(page);
  await page.getByRole("button", { name: "Salir" }).filter({ visible: true }).click();
  // Ya estamos en «/»: se espera a que el encabezado muestre la sesión cerrada.
  await abrirMenu(page);
  await expect(page.getByRole("link", { name: "Ingresar" }).filter({ visible: true })).toBeVisible();
}

/** Fecha AAAA-MM-DD a `dias` de hoy. */
function enDias(dias: number) {
  const d = new Date(Date.now() + dias * 86_400_000);
  return d.toISOString().slice(0, 10);
}

test("la ciudadana recibe alertas de vencimiento y de nuevas oportunidades, con correo simulado", async ({ page }) => {
  await ingresar(page, "rosa@ventanilla.test");
  await page.goto("/alertas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis alertas");
  const venc = page.getByRole("article").filter({ hasText: "Beca de Cooperación Iberoamericana en Innovación Educativa" }).filter({ hasText: "Vencimiento" });
  await expect(venc).toBeVisible();
  await expect(venc).toContainText("También te lo enviamos por correo a rosa@ventanilla.test (envío simulado");
  await expect(page.getByRole("article").filter({ hasText: "Nueva oportunidad para ti: Beca para Maestría en Educación y Tecnologías" })).toBeVisible();
  await revisarAccesibilidad(page);

  const todas = page.getByRole("button", { name: "Marcar todas como leídas" });
  if (await todas.isVisible()) await todas.click();
  await expect(page.getByRole("heading", { name: "0 alertas sin leer" })).toBeVisible();
});

test("con la fecha simulada, la alerta pasa al umbral de 7 días", async ({ page, browser }) => {
  await ingresar(page, "admin@ventanilla.test");
  await page.getByLabel("Nueva fecha").fill(enDias(14));
  await page.getByRole("button", { name: "Usar esta fecha" }).click();
  await expect(page.getByRole("status")).toContainText("Actualizamos la fecha");
  try {
    await expect(page.getByRole("note", { name: "Aviso de prototipo" })).toContainText("Fecha simulada");
    await salir(page);

    await ingresar(page, "diego@ventanilla.test");
    await page.goto("/alertas");
    await expect(
      page.getByRole("article").filter({ hasText: /Cierra en [1-7] días?: Doctorado en Energías Renovables/ }),
    ).toBeVisible();
    await salir(page);
  } finally {
    // Restablece la fecha real en un contexto limpio, para no afectar a las demás pruebas.
    const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const admin = await ctx.newPage();
    await ingresar(admin, "admin@ventanilla.test");
    const volver = admin.getByRole("button", { name: "Volver a la fecha real" });
    if (await volver.isVisible()) await volver.click();
    await expect(admin.getByText(/Se usa la fecha real/)).toBeVisible();
    await ctx.close();
  }
});

test("el panel de seguimiento muestra próximas fechas, avance del checklist y estado de los trámites", async ({ page }) => {
  await ingresar(page, "diego@ventanilla.test");
  await page.goto("/panel");
  await expect(page.getByRole("heading", { name: "Próximas fechas" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Próximas fechas" }).getByRole("listitem").first()).toBeVisible();
  const tarjeta = page.getByRole("article").filter({ hasText: "Doctorado en Energías Renovables con beca de investigación" });
  await expect(tarjeta.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
  await expect(tarjeta).toContainText("Completado");
  await expect(tarjeta).toContainText("En curso");
  await expect(page.getByRole("link", { name: /alertas? sin leer/ })).toBeVisible();
  await revisarAccesibilidad(page);
});

test("consulta al orientador: preguntas frecuentes, derivación, respuesta y alerta", async ({ page }) => {
  await page.goto("/orientacion");
  await expect(page.getByRole("heading", { name: "Preguntas frecuentes" })).toBeVisible();
  await page.getByText("¿Qué es la apostilla y para qué sirve?").click();
  await expect(page.getByText(/Convenio de La Haya/)).toBeVisible();
  await expect(page.getByRole("link", { name: "ingresa", exact: true })).toBeVisible();
  await revisarAccesibilidad(page);

  const pregunta = `¿Debo apostillar también mi certificado de estudios? (prueba ${Date.now()})`;
  await ingresar(page, "rosa@ventanilla.test");
  await page.goto("/orientacion");
  await page.getByRole("button", { name: "Enviar consulta a un orientador" }).click();
  await expect(alerta(page)).toContainText("Elige el tema de tu consulta");
  await page.getByLabel("Tema", { exact: true }).selectOption("Trámites");
  await page.getByLabel("Tu consulta").fill(pregunta);
  await page.getByRole("button", { name: "Enviar consulta a un orientador" }).click();
  await expect(page.getByRole("status")).toContainText("Enviamos tu consulta");
  const mia = page.getByRole("listitem").filter({ hasText: pregunta });
  await expect(mia).toContainText("Pendiente de respuesta");
  await salir(page);

  await ingresar(page, "orientador@ventanilla.test");
  await expect(page).toHaveURL(/\/bandeja/);
  const consulta = page.getByRole("article").filter({ hasText: pregunta });
  await expect(consulta).toContainText("Persona de Ayacucho");
  await revisarAccesibilidad(page);
  await consulta.getByLabel("Tu respuesta").fill("Sí: apostilla el diploma y el certificado de estudios, después de la copia certificada.");
  await consulta.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(page.getByRole("status")).toContainText("Enviamos tu respuesta");
  await salir(page);

  await ingresar(page, "rosa@ventanilla.test");
  await page.goto("/alertas");
  await expect(page.getByRole("article").filter({ hasText: "Respondieron tu consulta sobre «Trámites»" }).first()).toBeVisible();
  await page.goto("/orientacion");
  await expect(page.getByRole("listitem").filter({ hasText: pregunta })).toContainText("Respuesta del orientador: Sí: apostilla");
});

test("la ciudadana responde la encuesta de satisfacción", async ({ page }) => {
  await ingresar(page, "rosa@ventanilla.test");
  await page.goto("/panel");
  await page.getByRole("link", { name: "Responder la encuesta" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Encuesta de satisfacción");
  await revisarAccesibilidad(page);
  await page.getByRole("button", { name: "Enviar encuesta" }).click();
  await expect(alerta(page)).toContainText("Elige un valor de 1 a 5");

  await page.getByLabel("¿Sobre qué oportunidad opinas?").selectOption({ label: "Beca de Cooperación Iberoamericana en Innovación Educativa" });
  for (const [grupo, valor] of [["Claridad", "5"], ["Suficiencia", "4"], ["Oportunidad", "4"], ["Utilidad", "5"]]) {
    await page.getByRole("group", { name: new RegExp(`^${grupo}:`) }).getByLabel(new RegExp(`^${valor} ·`)).check();
  }
  await page.getByLabel("Comentarios (opcional)").fill("La ruta me ayudó a ordenar los trámites.");
  await page.getByRole("button", { name: "Enviar encuesta" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Gracias por tu opinión!");
});
