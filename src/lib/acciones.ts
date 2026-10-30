"use server";
// Acciones de servidor del incremento 2: ingreso, registro, salida, perfil,
// guardado (RF08) y comparador (RF07).
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { cerrarSesion, iniciarSesion, inicioPorRol, obtenerSesion, type Rol } from "./auth";
import { AREAS, IDIOMAS, MODALIDADES, NIVELES, PAISES, REGIONES } from "./catalogos";
import { MAX_COMPARAR, escribirComparador, leerComparador } from "./comparador";
import { aFechaCalendario } from "./fechas";
import { sincronizarAlertas } from "./alertas";
import { obtenerHoy } from "./hoy";

export type EstadoFormulario = {
  errores?: Record<string, string>;
  mensaje?: string;
  /** Valores enviados, para no obligar a escribirlos de nuevo si hay errores */
  valores?: Record<string, string | string[]>;
};

export type EstadoBoton = { mensaje: string; error?: boolean; activo: boolean } | null;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MINIMO_CLAVE = 8;

/** Solo rutas internas, para evitar redirecciones a otros sitios. */
function rutaSegura(v: FormDataEntryValue | null, porDefecto: string): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : porDefecto;
}

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function ingresar(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const email = texto(fd, "email").toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  const errores: Record<string, string> = {};
  if (!email) errores.email = "Escribe tu correo electrónico.";
  else if (!CORREO.test(email)) errores.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (!clave) errores.clave = "Escribe tu contraseña.";
  if (Object.keys(errores).length) return { errores, valores: { email } };

  const u = await prisma.usuario.findUnique({ where: { email }, include: { perfil: true } });
  if (!u || !(await bcrypt.compare(clave, u.passwordHash))) {
    return { mensaje: "El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.", valores: { email } };
  }
  await iniciarSesion({ uid: u.id, rol: u.rol as Rol });
  if (u.rol === "ciudadano") await sincronizarAlertas(prisma, u.id, await obtenerHoy());
  const volver = fd.get("volver");
  redirect(rutaSegura(volver, inicioPorRol(u.rol as Rol, !!u.perfil)));
}

export async function registrar(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const email = texto(fd, "email").toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  const clave2 = String(fd.get("clave2") ?? "");
  const errores: Record<string, string> = {};
  if (!email) errores.email = "Escribe tu correo electrónico.";
  else if (!CORREO.test(email)) errores.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (clave.length < LARGO_MINIMO_CLAVE) errores.clave = `La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`;
  else if (clave !== clave2) errores.clave2 = "Las dos contraseñas no coinciden.";
  if (fd.get("consentimiento") !== "si") {
    errores.consentimiento = "Para crear tu cuenta debes aceptar el tratamiento de tus datos personales.";
  }
  if (!errores.email && (await prisma.usuario.findUnique({ where: { email } }))) {
    errores.email = "Ya existe una cuenta con ese correo. Puedes ingresar con él.";
  }
  if (Object.keys(errores).length) return { errores, valores: { email } };

  const ahora = new Date();
  const u = await prisma.usuario.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(clave, 10),
      rol: "ciudadano",
      creadoEn: ahora,
      consentimientoEn: ahora,
    },
  });
  await iniciarSesion({ uid: u.id, rol: "ciudadano" });
  redirect("/perfil?bienvenida=1");
}

export async function salir() {
  await cerrarSesion();
  redirect("/");
}

export async function guardarPerfil(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const s = await obtenerSesion();
  if (!s || s.rol !== "ciudadano") redirect("/ingresar?volver=/perfil");

  const v = {
    area: texto(fd, "area"),
    nivel: texto(fd, "nivel"),
    paises: fd.getAll("paises").map(String).filter((p) => (PAISES as readonly string[]).includes(p)),
    modalidad: texto(fd, "modalidad"),
    idioma: texto(fd, "idioma"),
    costoMaxUsd: texto(fd, "costoMaxUsd"),
    necesitaFinanciamiento: texto(fd, "necesitaFinanciamiento"),
    region: texto(fd, "region"),
    universidadOrigen: texto(fd, "universidadOrigen"),
  };
  const errores: Record<string, string> = {};
  if (!(AREAS as readonly string[]).includes(v.area)) errores.area = "Elige el área que te interesa.";
  if (!(v.nivel in NIVELES)) errores.nivel = "Elige el nivel de estudios.";
  if (v.paises.length === 0) errores.paises = "Marca al menos un país de interés.";
  if (!(v.modalidad in MODALIDADES)) errores.modalidad = "Elige una modalidad.";
  if (!(IDIOMAS as readonly string[]).includes(v.idioma)) errores.idioma = "Elige un idioma.";
  const costo = Number(v.costoMaxUsd);
  if (v.costoMaxUsd === "" || Number.isNaN(costo) || costo < 0) errores.costoMaxUsd = "Elige un rango de costo.";
  if (v.necesitaFinanciamiento !== "si" && v.necesitaFinanciamiento !== "no") {
    errores.necesitaFinanciamiento = "Indica si necesitas financiamiento.";
  }
  if (!(REGIONES as readonly string[]).includes(v.region)) errores.region = "Elige tu región de residencia.";
  if (!v.universidadOrigen) errores.universidadOrigen = "Escribe el nombre de tu universidad de origen.";
  else if (v.universidadOrigen.length > 120) errores.universidadOrigen = "Usa como máximo 120 caracteres.";
  if (Object.keys(errores).length) return { errores, valores: v };

  const datos = {
    area: v.area,
    nivel: v.nivel,
    paises: v.paises.join("|"),
    modalidad: v.modalidad,
    idioma: v.idioma,
    costoMaxUsd: costo,
    necesitaFinanciamiento: v.necesitaFinanciamiento === "si",
    region: v.region,
    universidadOrigen: v.universidadOrigen,
    actualizadoEn: aFechaCalendario(new Date()),
  };
  await prisma.perfil.upsert({ where: { usuarioId: s.uid }, create: { ...datos, usuarioId: s.uid }, update: datos });
  redirect("/recomendaciones?perfil=guardado");
}

/**
 * Guarda o quita una oportunidad del panel personal (RF08). No se revalida la
 * página: en el panel, la tarjeta quitada sigue visible (con el botón «Guardar»)
 * para poder deshacer sin perder el foco.
 */
export async function alternarGuardada(_: EstadoBoton, fd: FormData): Promise<EstadoBoton> {
  const s = await obtenerSesion();
  if (!s || s.rol !== "ciudadano") {
    return { mensaje: "Ingresa con tu cuenta de ciudadano para guardar oportunidades.", error: true, activo: false };
  }
  const oportunidadId = texto(fd, "oportunidadId");
  const clave = { usuarioId_oportunidadId: { usuarioId: s.uid, oportunidadId } };
  const existente = await prisma.guardada.findUnique({ where: clave });
  if (existente) {
    await prisma.guardada.delete({ where: clave });
    return { mensaje: "Quitaste la oportunidad de tus guardadas.", activo: false };
  }
  const o = await prisma.oportunidad.findFirst({ where: { id: oportunidadId, publicada: true } });
  if (!o) return { mensaje: "Esta oportunidad ya no está disponible.", error: true, activo: false };
  await prisma.guardada.create({ data: { usuarioId: s.uid, oportunidadId, creadaEn: new Date() } });
  return { mensaje: "Guardaste la oportunidad en tu panel.", activo: true };
}

/** Agrega o quita una ficha del comparador, con un máximo de tres (RF07). */
export async function alternarComparar(_: EstadoBoton, fd: FormData): Promise<EstadoBoton> {
  const id = texto(fd, "oportunidadId");
  const ids = await leerComparador();
  if (ids.includes(id)) {
    await escribirComparador(ids.filter((x) => x !== id));
    revalidatePath("/", "layout");
    return { mensaje: "Quitaste la ficha del comparador.", activo: false };
  }
  if (ids.length >= MAX_COMPARAR) {
    return {
      mensaje: `El comparador admite hasta ${MAX_COMPARAR} fichas. Quita una para agregar otra.`,
      error: true,
      activo: false,
    };
  }
  await escribirComparador([...ids, id]);
  revalidatePath("/", "layout");
  return { mensaje: `Agregaste la ficha al comparador (${ids.length + 1} de ${MAX_COMPARAR}).`, activo: true };
}

export async function vaciarComparador() {
  await escribirComparador([]);
  revalidatePath("/", "layout");
}
