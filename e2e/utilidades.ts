import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** En móvil los filtros están plegados: los muestra si hace falta. */
export async function abrirFiltros(page: Page) {
  const boton = page.getByRole("button", { name: "Mostrar filtros" });
  if (await boton.isVisible()) await boton.click();
}

/** Revisión automática de accesibilidad (WCAG 2.1 A y AA) con axe-core. */
export async function revisarAccesibilidad(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const resumen = r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
  expect(resumen, "Infracciones de accesibilidad").toEqual([]);
}

export const CLAVE = "Prototipo2026!";

/** Ingresa con una cuenta y espera salir de la página de ingreso. */
export async function ingresar(page: Page, email: string, clave = CLAVE) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/ingresar/);
}

/** En móvil la navegación está dentro del menú desplegable: lo abre si hace falta. */
export async function abrirMenu(page: Page) {
  const menu = page.locator("summary", { hasText: "Menú" });
  if (await menu.isVisible()) {
    const abierto = await menu.evaluate((s) => (s.parentElement as HTMLDetailsElement).open);
    if (!abierto) await menu.click();
  }
}

/** Navegación principal visible (escritorio o móvil). */
export function navegacion(page: Page) {
  return page.getByRole("navigation", { name: /^Principal/ }).filter({ visible: true });
}

/** Mensajes de alerta de la página (excluye el anunciador de rutas de Next.js). */
export function alerta(page: Page) {
  return page.getByRole("alert").and(page.locator(":not(#__next-route-announcer__)"));
}
