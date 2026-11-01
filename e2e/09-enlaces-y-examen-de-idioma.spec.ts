import { expect, test, type Page } from "@playwright/test";
import { registrarCuenta, revisarAccesibilidad } from "./utilidades";

// Enlaces oficiales de trámites (D56) y examen de idioma según el perfil (D57).

const SUNEDU = [
  ["Hacer el trámite en línea en la SUNEDU", "https://enlinea.sunedu.gob.pe/"],
  ["Pagar S/ 13.10 en Pagalo.pe", "https://pagalo.pe/"],
  ["Más información en gob.pe", "https://www.gob.pe/490-constancia-de-verificacion-de-firmas-para-grados-y-titulos-o-documentos-academicos-bachiller-titulo-segunda-especialidad-maestro-o-doctor"],
];
const CANCILLERIA = [
  ["Hacer el trámite en línea en Cancillería", "https://serviciosalciudadano.rree.gob.pe/psc_webapp/"],
  ["Más información en gob.pe", "https://www.gob.pe/37288-apostilla-y-legalizacion"],
];

test("el mapa de trámites muestra los enlaces oficiales de la SUNEDU y de Cancillería", async ({ page }) => {
  await page.goto("/tramites");
  for (const [nombre, enlaces] of [["Obtener constancia de verificación de firma", SUNEDU], ["Apostillar documentos académicos", CANCILLERIA]] as const) {
    const tarjeta = page.getByRole("article").filter({ hasText: nombre });
    await expect(tarjeta.getByRole("heading", { name: "Enlaces oficiales" })).toBeVisible();
    for (const [texto, url] of enlaces) {
      const enlace = tarjeta.getByRole("link", { name: new RegExp(`^${texto.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}`) });
      await expect(enlace).toHaveAttribute("href", url);
      await expect(enlace).toHaveAttribute("target", "_blank");
    }
    await expect(tarjeta.getByRole("link", { name: /Enlace de ejemplo/ })).toHaveCount(0);
  }
  await revisarAccesibilidad(page);
});

/** Completa el perfil mínimo; `acredita` marca los idiomas que se acreditan con certificado. */
async function completarPerfil(page: Page, acredita: string[]) {
  await page.goto("/perfil");
  await page.getByLabel("Área de estudio").selectOption("Economía y negocios");
  await page.getByLabel("Nivel").selectOption("maestria");
  await page.getByLabel("Estados Unidos").check();
  await page.getByRole("group", { name: "Modalidades que te interesan" }).getByLabel("Presencial", { exact: true }).check();
  await page.getByRole("group", { name: "Idiomas en que quieres estudiar" }).getByLabel("Inglés", { exact: true }).check();
  const acreditados = page.getByRole("group", { name: "Idiomas que ya acreditas con un certificado vigente" });
  for (const idioma of ["Inglés", "Francés"]) {
    const casilla = acreditados.getByLabel(idioma, { exact: true });
    if (acredita.includes(idioma)) await casilla.check();
    else await casilla.uncheck();
  }
  await page.getByLabel("Sin beca (con recursos propios)").check();
  await page.getByLabel("Región donde vives").selectOption("Lima");
  await page.getByLabel("Universidad donde estudiaste").fill("Universidad Metropolitana de Lima (ficticia)");
  await page.getByRole("button", { name: "Guardar perfil y ver recomendaciones" }).click();
  await expect(page).toHaveURL(/\/recomendaciones/);
}

test("la ruta omite el examen de idioma si el perfil acredita el idioma de la oportunidad", async ({ page }) => {
  await registrarCuenta(page);
  await completarPerfil(page, ["Inglés"]);

  await page.goto(`/catalogo?q=${encodeURIComponent("Maestría en Analítica de Negocios")}`);
  await page.getByRole("link", { name: "Maestría en Analítica de Negocios", exact: true }).click();
  await page.getByRole("link", { name: "Preparar mi postulación" }).first().click();
  await page.getByRole("button", { name: "Generar mi ruta y checklist" }).click();
  const ruta = page.getByRole("region", { name: "Ruta paso a paso" });
  await expect(ruta).toContainText("No incluimos el examen de idioma porque en tu perfil indicaste que acreditas inglés");
  await expect(ruta.getByRole("article").filter({ hasText: "Rendir un examen internacional de idioma" })).toHaveCount(0);
  // Los enlaces oficiales también están en la ruta.
  await expect(ruta.getByRole("list", { name: "Enlaces oficiales de Apostillar documentos académicos" }).getByRole("link")).toHaveCount(2);
  await revisarAccesibilidad(page);
  const url = page.url();

  // Sin la acreditación, el examen vuelve a la ruta.
  await completarPerfil(page, []);
  await page.goto(url);
  await expect(page.getByRole("region", { name: "Ruta paso a paso" }).getByRole("article").filter({ hasText: "Rendir un examen internacional de idioma" })).toHaveCount(1);
});
