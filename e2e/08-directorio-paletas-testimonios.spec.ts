import { expect, test, type Page } from "@playwright/test";
import { abrirMenu, ingresar, revisarAccesibilidad } from "./utilidades";

// Mejoras de noviembre (2/2): directorio oficial y financiamiento (D48), tonalidades (D49) y testimonios (D50).

async function salir(page: Page) {
  await page.goto("/");
  await abrirMenu(page);
  await page.getByRole("button", { name: "Salir" }).filter({ visible: true }).click();
  await abrirMenu(page);
  await expect(page.getByRole("link", { name: "Ingresar" }).filter({ visible: true })).toBeVisible();
}

test("orientación incluye el directorio oficial y dónde buscar financiamiento", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByRole("link", { name: /Mira dónde buscar becas/ }).click();
  await expect(page).toHaveURL(/\/orientacion#financiamiento/);

  const directorio = page.getByRole("region", { name: "Directorio oficial de entidades" });
  await expect(directorio.getByRole("listitem").filter({ has: page.getByRole("heading") })).toHaveCount(6);
  await expect(directorio.getByRole("link", { name: /^gob\.pe\/rree/ })).toHaveAttribute("href", "https://www.gob.pe/rree");
  await expect(directorio.getByRole("link", { name: /antecedentes policiales para uso en el extranjero/ })).toHaveAttribute("href", "https://www.gob.pe/324");
  await expect(directorio).toContainText("Enlaces verificados el");

  const financiamiento = page.getByRole("region", { name: "Dónde buscar financiamiento" });
  await expect(financiamiento.getByRole("heading", { level: 3 })).toHaveCount(6);
  await expect(financiamiento.getByRole("link", { name: /^fulbright\.pe/ })).toHaveAttribute("href", "https://www.fulbright.pe");
  await expect(financiamiento.getByRole("link", { name: /^fulbright\.pe/ })).toHaveAttribute("target", "_blank");
});

test("el administrador cambia las tonalidades de la plataforma", async ({ page }) => {
  await ingresar(page, "admin@ventanilla.test");
  const seccion = page.getByRole("region", { name: "Tonalidades de la plataforma" });
  try {
    await seccion.getByLabel("Azul", { exact: true }).check();
    await seccion.getByRole("button", { name: "Aplicar tonalidad" }).click();
    await expect(page.getByRole("status")).toContainText("Actualizamos las tonalidades");
    await expect(page.locator("html")).toHaveAttribute("data-paleta", "azul");
    const color = await page.locator("header").evaluate((h) => getComputedStyle(h).backgroundColor);
    expect(color).toBe("rgb(23, 37, 84)");
    await revisarAccesibilidad(page);
  } finally {
    await page.goto("/admin");
    await page.getByRole("region", { name: "Tonalidades de la plataforma" }).getByLabel(/^Azul marino/).check();
    await page.getByRole("region", { name: "Tonalidades de la plataforma" }).getByRole("button", { name: "Aplicar tonalidad" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-paleta", "marino");
  }
});

test("testimonios: ilustrativos rotulados y reales solo con autorización y aprobación", async ({ page }) => {
  await page.goto("/");
  const experiencias = page.getByRole("region", { name: "Experiencias" });
  await expect(experiencias.getByRole("listitem")).toHaveCount(3);
  await expect(experiencias.getByText(/Testimonio (ilustrativo|real)/).first()).toBeVisible();

  const comentario = `Encontré mi beca y ordené mis trámites a tiempo (prueba ${Date.now()}).`;
  await ingresar(page, "lucia@ventanilla.test");
  await page.goto("/encuesta");
  for (const grupo of ["Claridad", "Suficiencia", "Oportunidad", "Utilidad"]) {
    await page.getByRole("group", { name: new RegExp(`^${grupo}:`) }).getByLabel(/^5 ·/).check();
  }
  await page.getByLabel("Comentarios (opcional)").fill(comentario);
  await page.getByLabel(/Autorizo publicar mi comentario/).check();
  await page.getByRole("button", { name: "Enviar encuesta" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Gracias por tu opinión!");
  await expect(page.getByText(/Recibimos tu autorización para publicar tu comentario/)).toBeVisible();
  // Aún no aparece: falta la aprobación.
  await page.goto("/");
  await expect(page.getByText(comentario)).toHaveCount(0);
  await salir(page);

  await ingresar(page, "admin@ventanilla.test");
  await expect(page.getByText(/esperando tu aprobación/)).toBeVisible();
  const pendiente = page.getByRole("region", { name: /Testimonios por aprobar/ }).getByRole("listitem").filter({ hasText: comentario });
  await expect(pendiente).toContainText("Persona de Arequipa");
  await pendiente.getByRole("button", { name: /^Aprobar/ }).click();
  await expect(pendiente).toHaveCount(0);
  await page.goto("/");
  const real = page.getByRole("region", { name: "Experiencias" }).getByRole("listitem").filter({ hasText: comentario });
  await expect(real).toContainText("Testimonio real, publicado con autorización.");
  await expect(real).toContainText("Persona de Arequipa");
  await expect(real).not.toContainText("lucia@");
});
