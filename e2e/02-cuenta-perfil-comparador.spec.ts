import { expect, test } from "@playwright/test";
import { abrirMenu, alerta, ingresar, navegacion, revisarAccesibilidad } from "./utilidades";

// Incremento 2 — Registro, perfil, recomendaciones, comparador y guardado (pasos 2 y 3 del recorrido).

test("una persona se registra con consentimiento, define su perfil y recibe recomendaciones", async ({ page }) => {
  await page.goto("/registro");
  await revisarAccesibilidad(page);
  const email = `prueba-${Date.now()}-${test.info().project.name}@ventanilla.test`;

  // Sin consentimiento no se crea la cuenta.
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("ClaveSegura1");
  await page.getByLabel("Repite la contraseña").fill("ClaveSegura1");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(alerta(page)).toContainText("debes aceptar el tratamiento de tus datos personales");
  await expect(page.getByLabel(/Acepto el tratamiento/)).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Contraseña", { exact: true }).fill("ClaveSegura1");
  await page.getByLabel("Repite la contraseña").fill("ClaveSegura1");
  await page.getByLabel(/Acepto el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/perfil\?bienvenida=1/);
  await expect(page.getByRole("status")).toContainText("Tu cuenta está lista");

  // Perfil incompleto: muestra los errores.
  await page.getByRole("button", { name: "Guardar perfil y ver recomendaciones" }).click();
  await expect(alerta(page)).toContainText("Marca al menos un país de interés");

  await page.getByLabel("Área de estudio").selectOption("Educación");
  await page.getByLabel("Nivel").selectOption("maestria");
  // Modalidades e idiomas admiten varias opciones.
  const modalidades = page.getByRole("group", { name: "Modalidades que te interesan" });
  await modalidades.getByLabel("Presencial", { exact: true }).check();
  await modalidades.getByLabel("Virtual", { exact: true }).check();
  const idiomas = page.getByRole("group", { name: "Idiomas en que quieres estudiar" });
  await idiomas.getByLabel("Español", { exact: true }).check();
  await idiomas.getByLabel("Inglés", { exact: true }).check();
  await page.getByLabel("España").check();
  await page.getByLabel("Chile").check();
  await page.getByLabel("¿Cuánto podrías pagar en total?").selectOption("30000");
  await page.getByLabel("Sí").check();
  await page.getByLabel("Región donde vives").selectOption("Puno");
  await page.getByLabel("Universidad donde estudiaste").fill("Universidad del Altiplano (ficticia)");
  await revisarAccesibilidad(page);
  await page.getByRole("button", { name: "Guardar perfil y ver recomendaciones" }).click();

  await expect(page).toHaveURL(/\/recomendaciones/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Recomendaciones para ti");
  const primera = page.getByRole("article").first();
  await expect(primera).toContainText("Coincide en 7 de 7 criterios");
  await expect(primera.getByRole("list", { name: /Criterios coincidentes/ })).toContainText("Área: Educación");
  await revisarAccesibilidad(page);

  // El perfil guardado se puede volver a editar.
  await page.goto("/perfil");
  await expect(page.getByLabel("Región donde vives")).toHaveValue("Puno");
  await expect(page.getByLabel("España")).toBeChecked();
  await expect(page.getByRole("group", { name: "Modalidades que te interesan" }).getByLabel("Virtual", { exact: true })).toBeChecked();
  await expect(page.getByRole("group", { name: "Idiomas en que quieres estudiar" }).getByLabel("Inglés", { exact: true })).toBeChecked();
});

test("ingreso con contraseña incorrecta y correcta; el encabezado cambia según la sesión", async ({ page }) => {
  await page.goto("/ingresar");
  await revisarAccesibilidad(page);
  await page.getByLabel("Correo electrónico").fill("rosa@ventanilla.test");
  await page.getByLabel("Contraseña").fill("otra-clave");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(alerta(page)).toContainText("El correo o la contraseña no son correctos");

  await ingresar(page, "rosa@ventanilla.test");
  await expect(page).toHaveURL(/\/recomendaciones/);
  await abrirMenu(page);
  const nav = navegacion(page);
  for (const enlace of ["Catálogo", "Recomendaciones", "Mi panel", "Mi perfil"]) {
    await expect(nav.getByRole("link", { name: enlace })).toBeVisible();
  }
  await page.getByRole("button", { name: "Salir" }).filter({ visible: true }).click();
  await expect(page).toHaveURL("/");
  await abrirMenu(page);
  await expect(page.getByRole("link", { name: "Ingresar" }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Crear cuenta" }).filter({ visible: true })).toBeVisible();
});

test("las páginas personales piden ingresar y respetan el rol", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/ingresar\?volver=%2Fperfil/);
  await page.getByLabel("Correo electrónico").fill("lucia@ventanilla.test");
  await page.getByLabel("Contraseña").fill("Prototipo2026!");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/perfil$/);

  await page.goto("/gestion");
  await expect(page).toHaveURL(/acceso=denegado/);
  await expect(alerta(page)).toContainText("No tienes permiso");
});

test("cada rol del personal ve sus enlaces", async ({ page }) => {
  const casos = [
    ["gestor.pronabec@ventanilla.test", "/gestion", "Gestión de contenidos"],
    ["orientador@ventanilla.test", "/bandeja", "Bandeja de consultas"],
    ["admin@ventanilla.test", "/admin", "Tablero de indicadores"],
  ] as const;
  for (const [email, ruta, enlace] of casos) {
    await ingresar(page, email);
    await expect(page).toHaveURL(new RegExp(`${ruta}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(enlace);
    await abrirMenu(page);
    await expect(navegacion(page).getByRole("link", { name: enlace })).toBeVisible();
    await expect(navegacion(page).getByRole("link", { name: "Mi panel" })).toHaveCount(0);
    await page.getByRole("button", { name: "Salir" }).filter({ visible: true }).click();
    await expect(page).toHaveURL("/");
  }
});

test("una ciudadana guarda una oportunidad y la ve en su panel", async ({ page }) => {
  await ingresar(page, "rosa@ventanilla.test");
  await page.goto("/catalogo?q=Gestión Educativa Rural");
  await page.getByRole("link", { name: "Maestría en Gestión Educativa Rural" }).click();
  const guardar = page.getByRole("button", { name: /^Guardar: Maestría en Gestión Educativa Rural/ });
  // Espera a que la página sea interactiva antes de pulsar (el botón guarda sin recargar).
  await page.waitForLoadState("networkidle");
  await guardar.click();
  await expect(page.getByText("Guardaste la oportunidad en tu panel.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Guardada: Maestría en Gestión Educativa Rural/ })).toBeVisible();

  await page.goto("/panel");
  await expect(page.getByRole("heading", { name: /Oportunidades guardadas/ })).toBeVisible();
  const tarjeta = page.getByRole("article").filter({ hasText: "Maestría en Gestión Educativa Rural" });
  await expect(tarjeta).toBeVisible();
  await revisarAccesibilidad(page);

  // Quitarla deja el panel como estaba.
  await tarjeta.getByRole("button", { name: /Guardada:/ }).click();
  await expect(page.getByText("Quitaste la oportunidad de tus guardadas.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("article").filter({ hasText: "Maestría en Gestión Educativa Rural" })).toHaveCount(0);
});

test("sin cuenta, el botón de guardar lleva a ingresar", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByRole("link", { name: /^Ingresa para guardar/ }).first().click();
  await expect(page).toHaveURL(/\/ingresar\?volver=%2Fcatalogo/);
});

test("compara hasta tres fichas y resalta las diferencias", async ({ page }) => {
  await page.goto("/comparador");
  await expect(page.getByText("Aún no agregaste fichas al comparador.")).toBeVisible();

  await page.goto("/catalogo");
  const tarjetas = page.getByRole("article");
  for (let i = 0; i < 3; i++) {
    await tarjetas.nth(i).getByRole("button", { name: /^Comparar:/ }).click();
    await expect(tarjetas.nth(i).getByText(`(${i + 1} de 3)`)).toBeVisible();
  }
  // La cuarta no entra.
  await tarjetas.nth(3).getByRole("button", { name: /^Comparar:/ }).click();
  await expect(tarjetas.nth(3).getByText("El comparador admite hasta 3 fichas")).toBeVisible();

  await abrirMenu(page);
  await navegacion(page).getByRole("link", { name: "Comparador (3)" }).click();
  await expect(page).toHaveURL(/\/comparador/);
  const tabla = page.getByRole("table");
  await expect(tabla.getByRole("columnheader")).toHaveCount(4);
  await expect(tabla.getByRole("rowheader", { name: /Costo total estimado/ })).toBeVisible();
  await expect(tabla.getByText("Diferente").first()).toBeVisible();
  await expect(tabla.getByText("Menor costo total")).toHaveCount(1);
  await revisarAccesibilidad(page);

  // Quitar una ficha desde el comparador.
  await tabla.getByRole("button", { name: /^Quitar:/ }).first().click();
  await expect(page.getByRole("table").getByRole("columnheader")).toHaveCount(3);
  await page.getByRole("button", { name: "Vaciar el comparador" }).click();
  await expect(page.getByText("Aún no agregaste fichas al comparador.")).toBeVisible();
});
