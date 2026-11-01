"use server";
// Acciones del incremento 4: alertas (RF12), orientación (RF14),
// encuesta (RF15) y fecha simulada (sección 8 de requerimientos).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerSesion } from "./auth";
import { DIMENSIONES_ENCUESTA, TEMAS_ORIENTACION } from "./catalogos";
import { prisma } from "./db";
import { desdeISO } from "./fechas";
import { CLAVE_FECHA_SIMULADA, obtenerHoy } from "./hoy";
import { CLAVE_PALETA, PALETAS } from "./paletas";
import type { EstadoFormulario } from "./acciones";

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const LARGO_MAXIMO = 1000;

async function sesionCon(rol: string, volver: string) {
  const s = await obtenerSesion();
  if (!s || s.rol !== rol) redirect(`/ingresar?volver=${encodeURIComponent(volver)}`);
  return s.uid;
}

export async function marcarAlertaLeida(fd: FormData) {
  const uid = await sesionCon("ciudadano", "/alertas");
  await prisma.alerta.updateMany({ where: { id: texto(fd, "id"), usuarioId: uid }, data: { leida: true } });
  revalidatePath("/", "layout");
}

export async function marcarTodasLeidas() {
  const uid = await sesionCon("ciudadano", "/alertas");
  await prisma.alerta.updateMany({ where: { usuarioId: uid, leida: false }, data: { leida: true } });
  revalidatePath("/", "layout");
}

/** Oportunidad opcional de un formulario: debe estar guardada por el usuario. */
async function oportunidadDelUsuario(uid: string, id: string): Promise<string | null> {
  if (!id) return null;
  const g = await prisma.guardada.findUnique({ where: { usuarioId_oportunidadId: { usuarioId: uid, oportunidadId: id } } });
  return g ? id : null;
}

export async function enviarConsulta(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const uid = await sesionCon("ciudadano", "/orientacion");
  const v = { tema: texto(fd, "tema"), pregunta: texto(fd, "pregunta"), oportunidadId: texto(fd, "oportunidadId") };
  const errores: Record<string, string> = {};
  if (!(TEMAS_ORIENTACION as readonly string[]).includes(v.tema)) errores.tema = "Elige el tema de tu consulta.";
  if (v.pregunta.length < 10) errores.pregunta = "Escribe tu consulta (al menos 10 caracteres).";
  else if (v.pregunta.length > LARGO_MAXIMO) errores.pregunta = `Usa como máximo ${LARGO_MAXIMO} caracteres.`;
  if (Object.keys(errores).length) return { errores, valores: v };
  await prisma.consulta.create({
    data: {
      usuarioId: uid,
      tema: v.tema,
      pregunta: v.pregunta,
      oportunidadId: await oportunidadDelUsuario(uid, v.oportunidadId),
      creadaEn: new Date(),
    },
  });
  redirect("/orientacion?enviada=1#mis-consultas");
}

export async function responderConsulta(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const uid = await sesionCon("orientador", "/bandeja");
  const id = texto(fd, "consultaId");
  const respuesta = texto(fd, "respuesta");
  if (respuesta.length < 10) return { errores: { [`respuesta-${id}`]: "Escribe una respuesta (al menos 10 caracteres)." } };
  if (respuesta.length > LARGO_MAXIMO) return { errores: { [`respuesta-${id}`]: `Usa como máximo ${LARGO_MAXIMO} caracteres.` } };
  const c = await prisma.consulta.findUnique({ where: { id }, include: { usuario: true } });
  if (!c || c.respuesta) return { mensaje: "Esta consulta ya fue respondida o no existe." };
  const hoy = await obtenerHoy();
  await prisma.consulta.update({ where: { id }, data: { respuesta, respondidaEn: new Date(), orientadorId: uid } });
  // Avisa al ciudadano dentro de la plataforma y simula el correo (RF12, RF14).
  await prisma.alerta.create({
    data: {
      usuarioId: c.usuarioId,
      tipo: "respuesta",
      clave: `resp-${c.id}`,
      titulo: `Respondieron tu consulta sobre «${c.tema}»`,
      mensaje: "Un orientador respondió tu consulta. Revisa la respuesta en el canal de orientación.",
      enlace: "/orientacion#mis-consultas",
      creadaEn: hoy,
      correoSimulado: c.usuario.email,
      oportunidadId: c.oportunidadId,
    },
  });
  redirect("/bandeja?respondida=1");
}

export async function enviarEncuesta(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const uid = await sesionCon("ciudadano", "/encuesta");
  const valores: Record<string, string> = {
    comentario: texto(fd, "comentario"),
    oportunidadId: texto(fd, "oportunidadId"),
    publicar: fd.get("publicar") === "si" ? "si" : "",
  };
  const errores: Record<string, string> = {};
  const notas: Record<string, number> = {};
  for (const d of Object.keys(DIMENSIONES_ENCUESTA)) {
    valores[d] = texto(fd, d);
    const n = Number(valores[d]);
    if (!Number.isInteger(n) || n < 1 || n > 5) errores[d] = `Elige un valor de 1 a 5 en «${d === "oportunidadInfo" ? "oportunidad" : d}».`;
    else notas[d] = n;
  }
  if (valores.comentario.length > LARGO_MAXIMO) errores.comentario = `Usa como máximo ${LARGO_MAXIMO} caracteres.`;
  if (Object.keys(errores).length) return { errores, valores };

  const oportunidadId = await oportunidadDelUsuario(uid, valores.oportunidadId);
  const datos = {
    claridad: notas.claridad,
    suficiencia: notas.suficiencia,
    oportunidadInfo: notas.oportunidadInfo,
    utilidad: notas.utilidad,
    comentario: valores.comentario,
    // Solo se ofrece para publicar si autorizó y escribió un comentario; lo aprueba el administrador.
    publicacion: fd.get("publicar") === "si" && valores.comentario ? "pendiente" : "no",
    creadaEn: await obtenerHoy(),
  };
  // Una respuesta por persona y oportunidad (o general): si responde de nuevo, se actualiza (D27).
  const previa = await prisma.encuesta.findFirst({ where: { usuarioId: uid, oportunidadId } });
  if (previa) await prisma.encuesta.update({ where: { id: previa.id }, data: datos });
  else await prisma.encuesta.create({ data: { ...datos, usuarioId: uid, oportunidadId } });
  redirect("/encuesta?gracias=1");
}

export async function cambiarFechaSimulada(fd: FormData) {
  await sesionCon("admin", "/admin");
  const fecha = desdeISO(texto(fd, "fecha"));
  if (fecha && fd.get("accion") !== "real") {
    const valor = fecha.toISOString().slice(0, 10);
    await prisma.configuracion.upsert({
      where: { clave: CLAVE_FECHA_SIMULADA },
      create: { clave: CLAVE_FECHA_SIMULADA, valor },
      update: { valor },
    });
  } else {
    await prisma.configuracion.deleteMany({ where: { clave: CLAVE_FECHA_SIMULADA } });
  }
  revalidatePath("/", "layout");
  redirect("/admin?fecha=actualizada");
}

/** Cambia las tonalidades de toda la plataforma (D49). */
export async function cambiarPaleta(fd: FormData) {
  await sesionCon("admin", "/admin");
  const valor = texto(fd, "paleta");
  if (valor in PALETAS) {
    await prisma.configuracion.upsert({ where: { clave: CLAVE_PALETA }, create: { clave: CLAVE_PALETA, valor }, update: { valor } });
  }
  revalidatePath("/", "layout");
  redirect("/admin?paleta=actualizada#tonalidades");
}

/** El administrador aprueba o rechaza un testimonio antes de publicarlo (D50). */
export async function moderarTestimonio(fd: FormData) {
  await sesionCon("admin", "/admin");
  const decision = texto(fd, "decision");
  if (decision === "aprobado" || decision === "rechazado") {
    await prisma.encuesta.updateMany({ where: { id: texto(fd, "id"), publicacion: "pendiente" }, data: { publicacion: decision } });
  }
  revalidatePath("/", "layout");
  redirect("/admin#testimonios");
}
