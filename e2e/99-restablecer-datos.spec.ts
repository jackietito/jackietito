import { expect, test } from "@playwright/test";
import { abrirMenu, alerta, ingresar, registrarCuenta, revisarAccesibilidad } from "./utilidades";

// Restablecer los datos de prueba desde /admin (D34). Va al final: deja la base como recién cargada.

test("el administrador restablece los datos de prueba con la contraseña de restablecimiento", async ({ page }) => {
  // Una cuenta creada antes del restablecimiento debe desaparecer.
  const email = await registrarCuenta(page);
  await abrirMenu(page);
  await page.getByRole("button", { name: "Salir" }).filter({ visible: true }).click();
  await abrirMenu(page);
  await expect(page.getByRole("link", { name: "Ingresar" }).filter({ visible: true })).toBeVisible();

  await ingresar(page, "admin@ventanilla.test");
  const seccion = page.getByRole("region", { name: "Restablecer los datos de prueba" });
  await expect(seccion).toContainText("No se puede deshacer.");
  await revisarAccesibilidad(page);
  const boton = seccion.getByRole("button", { name: "Restablecer los datos de prueba" });

  // Sin confirmación ni contraseña, no hace nada.
  await boton.click();
  await expect(alerta(page)).toContainText("Marca la casilla para confirmar");
  await expect(alerta(page)).toContainText("Escribe la contraseña de restablecimiento");

  // La contraseña del administrador no sirve: se necesita la de restablecimiento.
  await seccion.getByLabel(/Entiendo que se borrarán/).check();
  await seccion.getByLabel("Contraseña de restablecimiento").fill("Prototipo2026!");
  await boton.click();
  await expect(alerta(page)).toContainText("La contraseña de restablecimiento no es correcta");

  await seccion.getByLabel(/Entiendo que se borrarán/).check();
  await seccion.getByLabel("Contraseña de restablecimiento").fill("clave-restablecer-e2e");
  await boton.click();
  await expect(page).toHaveURL(/\/ingresar\?restablecido=1/, { timeout: 60_000 });
  await expect(page.getByRole("status")).toContainText("Restablecimos los datos de prueba");

  // La cuenta creada antes ya no existe; las de prueba siguen funcionando.
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill("ClaveSegura1");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(alerta(page)).toContainText("El correo o la contraseña no son correctos");
  await ingresar(page, "admin@ventanilla.test");
  await expect(page).toHaveURL(/\/admin/);
});
