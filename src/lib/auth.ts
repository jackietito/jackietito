// Sesión propia: un JWT firmado (jose) en una cookie httpOnly.
// Las contraseñas se guardan cifradas con bcrypt. Sin límite de usuarios:
// cada persona que se registra obtiene su propia cuenta y sesión.
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

export type Rol = "ciudadano" | "gestor" | "orientador" | "admin";
export type Sesion = { uid: string; rol: Rol };

const COOKIE = "ventanilla_sesion";
const DURACION_S = 60 * 60 * 24 * 7;

function clave() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto && process.env.NODE_ENV === "production") {
    throw new Error("Falta la variable de entorno SESSION_SECRET");
  }
  return new TextEncoder().encode(secreto ?? "clave-solo-para-desarrollo");
}

export async function iniciarSesion(s: Sesion) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_S}s`)
    .sign(clave());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_S,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave());
    return { uid: String(payload.uid), rol: payload.rol as Rol };
  } catch {
    return null;
  }
}

/** Usuario de la sesión actual (o null). Verifica que siga existiendo en la base. */
export async function usuarioActual() {
  const s = await obtenerSesion();
  if (!s) return null;
  return prisma.usuario.findUnique({
    where: { id: s.uid },
    include: { perfil: true, entidad: true },
  });
}

/**
 * Exige sesión con alguno de los roles indicados. Sin sesión, lleva al
 * ingreso y luego de vuelta a `volverA`; con otro rol, a la página de inicio.
 */
export async function exigirRol(roles: Rol[], volverA = "/") {
  const u = await usuarioActual();
  if (!u) redirect(`/ingresar?volver=${encodeURIComponent(volverA)}`);
  if (!roles.includes(u.rol as Rol)) redirect("/?acceso=denegado");
  return u;
}

/** Página de llegada según el rol, después de ingresar. */
export function inicioPorRol(rol: Rol, tienePerfil: boolean): string {
  switch (rol) {
    case "gestor": return "/gestion";
    case "orientador": return "/bandeja";
    case "admin": return "/admin";
    default: return tienePerfil ? "/recomendaciones" : "/perfil";
  }
}
