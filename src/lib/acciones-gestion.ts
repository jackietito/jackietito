"use server";
// Gestión de contenidos (RF16): el gestor de cada entidad crea, edita, publica o
// despublica las fichas y trámites de su entidad. Se validan los campos
// obligatorios de la ficha estándar y se registra la fecha de actualización.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioActual } from "./auth";
import {
  AREAS, CATEGORIAS_REQUISITO, FINANCIAMIENTOS, IDIOMAS, MODALIDADES, MONEDAS, NIVELES, TIPOS,
} from "./catalogos";
import { prisma } from "./db";
import { desdeISO } from "./fechas";
import { obtenerHoy } from "./hoy";
import type { EstadoFormulario } from "./acciones";

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const URL_OFICIAL = /^https:\/\/[^\s]+\.[^\s]+$/;

async function gestor() {
  const u = await usuarioActual();
  if (!u || u.rol !== "gestor" || !u.entidadId) redirect("/ingresar?volver=/gestion");
  return u as typeof u & { entidadId: string };
}

function numero(v: string, errores: Record<string, string>, campo: string, nombre: string, entero = false) {
  const n = Number(v.replace(",", "."));
  if (v === "" || Number.isNaN(n) || n < 0 || (entero && !Number.isInteger(n))) {
    errores[campo] = `Escribe ${nombre} (un número${entero ? " entero" : ""} mayor o igual a 0).`;
    return 0;
  }
  return n;
}

function fecha(v: string, errores: Record<string, string>, campo: string, nombre: string) {
  const f = desdeISO(v);
  if (!f) errores[campo] = `Indica la fecha de ${nombre}.`;
  return f;
}

const enLista = (v: string, lista: readonly string[]) => lista.includes(v);

export async function guardarOportunidad(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const u = await gestor();
  const id = texto(fd, "id");
  const valores: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$")) valores[k] = v;
  valores.tramites = fd.getAll("tramites").map(String);
  valores.publicada = fd.get("publicada") === "si" ? "si" : "no";
  valores.cubreManutencion = fd.get("cubreManutencion") === "si" ? "si" : "no";
  const t = (k: string) => texto(fd, k);
  const e: Record<string, string> = {};

  if (!(t("tipo") in TIPOS)) e.tipo = "Elige el tipo de oportunidad.";
  if (!t("nombre")) e.nombre = "Escribe el nombre de la oportunidad.";
  if (!t("institucion")) e.institucion = "Escribe la institución oferente.";
  if (!t("pais")) e.pais = "Escribe el país.";
  if (!t("ciudad")) e.ciudad = "Escribe la ciudad.";
  if (!t("descripcion")) e.descripcion = "Escribe una descripción breve.";
  if (!enLista(t("area"), AREAS)) e.area = "Elige el área de estudio.";
  if (!(t("nivel") in NIVELES)) e.nivel = "Elige el nivel.";
  if (!(t("modalidad") in MODALIDADES)) e.modalidad = "Elige la modalidad.";
  if (!enLista(t("idioma"), IDIOMAS)) e.idioma = "Elige el idioma.";
  const duracionMeses = numero(t("duracionMeses"), e, "duracionMeses", "la duración en meses", true);
  if (!e.duracionMeses && duracionMeses < 1) e.duracionMeses = "La duración debe ser de al menos 1 mes.";
  const fechaInicio = fecha(t("fechaInicio"), e, "fechaInicio", "inicio de clases");
  const fechaApertura = fecha(t("fechaApertura"), e, "fechaApertura", "apertura de la convocatoria");
  const fechaCierre = fecha(t("fechaCierre"), e, "fechaCierre", "cierre de la convocatoria");
  if (fechaApertura && fechaCierre && fechaCierre < fechaApertura) e.fechaCierre = "El cierre no puede ser antes de la apertura.";
  const costoMatricula = numero(t("costoMatricula"), e, "costoMatricula", "el costo de matrícula");
  const costoVidaMensual = numero(t("costoVidaMensual"), e, "costoVidaMensual", "el costo de vida mensual");
  const otrosCostos = numero(t("otrosCostos"), e, "otrosCostos", "los otros costos");
  if (!enLista(t("moneda"), MONEDAS)) e.moneda = "Elige la moneda.";
  if (!(t("financiamientoTipo") in FINANCIAMIENTOS)) e.financiamientoTipo = "Elige el tipo de financiamiento.";
  if (t("financiamientoTipo") && t("financiamientoTipo") !== "ninguno" && !t("cobertura")) {
    e.cobertura = "Indica qué cubre el financiamiento.";
  }
  if (!URL_OFICIAL.test(t("enlaceOficial"))) e.enlaceOficial = "Escribe el enlace oficial completo, que empiece con https://";
  // Cobertura estructurada para «Pagarías aprox.» (D59); vacío equivale a 0.
  const coberturaMatriculaPct = t("coberturaMatriculaPct") === "" ? 0 : numero(t("coberturaMatriculaPct"), e, "coberturaMatriculaPct", "el porcentaje de matrícula cubierto", true);
  if (!e.coberturaMatriculaPct && coberturaMatriculaPct > 100) e.coberturaMatriculaPct = "El porcentaje va de 0 a 100.";

  const requisitos = Object.keys(CATEGORIAS_REQUISITO).flatMap((c) =>
    t(`requisitos_${c}`).split("\n").map((r) => r.trim()).filter(Boolean).map((descripcion) => ({ categoria: c, descripcion })),
  );
  if (!requisitos.length) e.requisitos_academico = "Escribe al menos un requisito (uno por línea).";

  const tramitesValidos = await prisma.tramite.findMany({ where: { id: { in: valores.tramites as string[] } }, select: { id: true } });
  if (Object.keys(e).length) return { errores: e, valores };

  if (id) {
    const actual = await prisma.oportunidad.findFirst({ where: { id, entidadId: u.entidadId } });
    if (!actual) return { mensaje: "No puedes editar esta ficha: pertenece a otra entidad." };
  }

  const hoy = await obtenerHoy();
  const datos = {
    tipo: t("tipo"), nombre: t("nombre"), institucion: t("institucion"), pais: t("pais"), ciudad: t("ciudad"),
    descripcion: t("descripcion"), area: t("area"), nivel: t("nivel"), modalidad: t("modalidad"), idioma: t("idioma"),
    duracionMeses, fechaInicio: fechaInicio!, fechaApertura: fechaApertura!, fechaCierre: fechaCierre!,
    costoMatricula, costoVidaMensual, otrosCostos, otrosCostosDetalle: t("otrosCostosDetalle"), moneda: t("moneda"),
    financiamientoTipo: t("financiamientoTipo"), cobertura: t("cobertura"), entidadFinanciadora: t("entidadFinanciadora"),
    coberturaMatriculaPct, cubreManutencion: fd.get("cubreManutencion") === "si",
    enlaceOficial: t("enlaceOficial"), publicada: fd.get("publicada") === "si",
    actualizadoEn: hoy, responsableActualizacion: u.nombre ?? u.email,
  };

  let oportunidadId = id;
  if (id) {
    await prisma.oportunidad.update({ where: { id }, data: datos });
    // Requisitos: se conservan los que no cambian, para no romper los checklists ya generados.
    const previos = await prisma.requisito.findMany({ where: { oportunidadId: id } });
    const clave = (r: { categoria: string; descripcion: string }) => `${r.categoria}|${r.descripcion}`;
    const nuevos = new Set(requisitos.map(clave));
    await prisma.requisito.deleteMany({ where: { id: { in: previos.filter((r) => !nuevos.has(clave(r))).map((r) => r.id) } } });
    const existentes = new Set(previos.map(clave));
    for (const [i, r] of requisitos.entries()) {
      const previo = previos.find((p) => clave(p) === clave(r));
      if (previo) await prisma.requisito.update({ where: { id: previo.id }, data: { orden: i + 1 } });
      else if (!existentes.has(clave(r))) await prisma.requisito.create({ data: { ...r, orden: i + 1, oportunidadId: id } });
    }
    await prisma.oportunidadTramite.deleteMany({ where: { oportunidadId: id } });
  } else {
    const creada = await prisma.oportunidad.create({
      data: {
        ...datos, creadaEn: hoy, entidadId: u.entidadId,
        requisitos: { create: requisitos.map((r, i) => ({ ...r, orden: i + 1 })) },
      },
    });
    oportunidadId = creada.id;
  }
  if (tramitesValidos.length) {
    await prisma.oportunidadTramite.createMany({ data: tramitesValidos.map((tr) => ({ oportunidadId, tramiteId: tr.id })) });
  }
  revalidatePath("/", "layout");
  redirect(`/gestion?guardada=${encodeURIComponent(datos.nombre)}`);
}

/** Publica o despublica una ficha de la entidad del gestor. */
export async function alternarPublicacion(fd: FormData) {
  const u = await gestor();
  const o = await prisma.oportunidad.findFirst({ where: { id: texto(fd, "id"), entidadId: u.entidadId } });
  if (o) await prisma.oportunidad.update({ where: { id: o.id }, data: { publicada: !o.publicada } });
  revalidatePath("/", "layout");
  redirect(`/gestion?${o?.publicada ? "despublicada" : "publicada"}=${encodeURIComponent(o?.nombre ?? "")}`);
}

/** Confirma que la ficha sigue vigente sin cambiar sus datos: renueva la fecha de actualización. */
export async function confirmarVigencia(fd: FormData) {
  const u = await gestor();
  const hoy = await obtenerHoy();
  const o = await prisma.oportunidad.findFirst({ where: { id: texto(fd, "id"), entidadId: u.entidadId } });
  if (o) {
    await prisma.oportunidad.update({
      where: { id: o.id },
      data: { actualizadoEn: hoy, responsableActualizacion: u.nombre ?? u.email },
    });
  }
  revalidatePath("/", "layout");
  redirect(`/gestion?revisada=${encodeURIComponent(o?.nombre ?? "")}`);
}

export async function guardarTramite(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const u = await gestor();
  const id = texto(fd, "id");
  const valores: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$")) valores[k] = v;
  valores.publicado = fd.get("publicado") === "si" ? "si" : "no";
  const t = (k: string) => texto(fd, k);
  const e: Record<string, string> = {};
  if (!t("nombre")) e.nombre = "Escribe el nombre del trámite.";
  if (!t("entidadResponsable")) e.entidadResponsable = "Indica ante qué entidad se realiza.";
  if (!t("descripcion")) e.descripcion = "Escribe una descripción breve.";
  if (!t("documentos")) e.documentos = "Escribe al menos un documento (uno por línea).";
  const plazoDias = numero(t("plazoDias"), e, "plazoDias", "el plazo referencial en días", true);
  // El costo puede no ser un monto fijo: entonces va vacío y se explica en la nota (D42).
  const costoReferencial = t("costoReferencial") === "" ? null : numero(t("costoReferencial"), e, "costoReferencial", "el costo referencial");
  if (costoReferencial === null && !t("costoNota")) {
    e.costoNota = "Si el costo no es un monto fijo, explica de qué depende (por ejemplo, «Según el TUPA de tu universidad»).";
  }
  const orden = numero(t("orden"), e, "orden", "el orden en la ruta", true);
  const anticipacionDias = numero(t("anticipacionDias"), e, "anticipacionDias", "la anticipación en días", true);
  if (!URL_OFICIAL.test(t("enlaceOficial"))) e.enlaceOficial = "Escribe el enlace oficial completo, que empiece con https://";
  const lineasEnlaces = t("enlaces").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lineasEnlaces.some((l) => { const [texto, url] = l.split("|").map((x) => x.trim()); return !texto || !URL_OFICIAL.test(url ?? ""); })) {
    e.enlaces = "Cada enlace va en una línea con la forma «texto | https://…».";
  }
  if (Object.keys(e).length) return { errores: e, valores };

  const datos = {
    enlaces: lineasEnlaces.join("\n"),
    nombre: t("nombre"), entidadResponsable: t("entidadResponsable"), descripcion: t("descripcion"),
    documentos: t("documentos").split("\n").map((d) => d.trim()).filter(Boolean).join("\n"),
    plazoDias, plazoTexto: t("plazoTexto"), costoReferencial, costoNota: t("costoNota"),
    orden, anticipacionDias, enlaceOficial: t("enlaceOficial"),
    publicado: fd.get("publicado") === "si", actualizadoEn: await obtenerHoy(),
  };
  if (id) {
    const actual = await prisma.tramite.findFirst({ where: { id, entidadId: u.entidadId } });
    if (!actual) return { mensaje: "No puedes editar este trámite: pertenece a otra entidad." };
    await prisma.tramite.update({ where: { id }, data: datos });
  } else {
    await prisma.tramite.create({ data: { ...datos, entidadId: u.entidadId } });
  }
  revalidatePath("/", "layout");
  redirect(`/gestion?guardada=${encodeURIComponent(datos.nombre)}#tramites`);
}
