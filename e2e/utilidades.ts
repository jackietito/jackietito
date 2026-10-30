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
