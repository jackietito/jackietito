"use server";
// Restablecer los datos de prueba desde el panel del administrador (D34).
// Exige sesión de administrador y una contraseña propia (CLAVE_RESTABLECER),
// distinta de las cuentas de prueba, que son públicas en el README.
import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cerrarSesion, obtenerSesion } from "./auth";
import { prisma } from "./db";
import { aFechaCalendario } from "./fechas";
import { sembrar } from "./seed/sembrar";
import type { EstadoFormulario } from "./acciones";

/** Compara en tiempo constante (sobre los hash, para no revelar la longitud). */
function claveCorrecta(escrita: string, esperada: string): boolean {
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(escrita), h(esperada));
}

export async function restablecerDatos(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const s = await obtenerSesion();
  if (!s || s.rol !== "admin") redirect("/ingresar?volver=/admin");
  const esperada = process.env.CLAVE_RESTABLECER;
  if (!esperada) return { mensaje: "El restablecimiento no está habilitado: falta configurar CLAVE_RESTABLECER." };

  const errores: Record<string, string> = {};
  if (fd.get("confirmo") !== "si") errores.confirmo = "Marca la casilla para confirmar que entiendes que se borrarán los datos.";
  const clave = String(fd.get("claveRestablecer") ?? "");
  if (!clave) errores.claveRestablecer = "Escribe la contraseña de restablecimiento.";
  if (Object.keys(errores).length) return { errores };
  if (!claveCorrecta(clave, esperada)) {
    // Pequeña espera para dificultar los intentos repetidos.
    await new Promise((r) => setTimeout(r, 1500));
    return { errores: { claveRestablecer: "La contraseña de restablecimiento no es correcta." } };
  }

  await sembrar(prisma, aFechaCalendario(new Date()));
  // Las cuentas se recrean con otros identificadores: la sesión actual deja de valer.
  await cerrarSesion();
  redirect("/ingresar?restablecido=1");
}
