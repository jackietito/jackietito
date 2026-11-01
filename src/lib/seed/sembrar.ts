// Carga (o recarga) todos los datos de prueba. Usado por `npm run db:seed`
// y por el botón "Restablecer datos de demostración" del administrador.
// Usa importaciones relativas para poder ejecutarse con tsx fuera de Next.js.
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sumarDias } from "../fechas";
import { generarRuta } from "../ruta";
import {
  CIUDADANOS,
  CLAVE_PRUEBA,
  ENTIDADES,
  OPORTUNIDADES,
  PERSONAL,
  POBLACION_SIMULADA,
  TRAMITES,
  otrosCostosDetalle,
  requisitosDe,
  tramitesDe,
} from "./datos";

export async function borrarTodo(db: PrismaClient) {
  // Orden inverso a las dependencias.
  await db.alerta.deleteMany();
  await db.encuesta.deleteMany();
  await db.consulta.deleteMany();
  await db.itemChecklist.deleteMany();
  await db.avanceTramite.deleteMany();
  await db.guardada.deleteMany();
  await db.perfil.deleteMany();
  await db.usuario.deleteMany();
  await db.oportunidadTramite.deleteMany();
  await db.requisito.deleteMany();
  await db.oportunidad.deleteMany();
  await db.tramite.deleteMany();
  await db.entidad.deleteMany();
  await db.configuracion.deleteMany();
}

export async function sembrar(db: PrismaClient, hoy: Date) {
  await borrarTodo(db);
  const d = (dias: number) => sumarDias(hoy, dias);

  // Entidades
  const entidad: Record<string, string> = {};
  for (const e of ENTIDADES) {
    const creada = await db.entidad.create({
      data: { ...e, enlace: `https://example.org/entidades/${e.sigla.toLowerCase()}` },
    });
    entidad[e.sigla] = creada.id;
  }

  // Trámites
  const tramite: Record<string, string> = {};
  for (const { clave, entidad: sigla, ...t } of TRAMITES) {
    const creado = await db.tramite.create({
      data: {
        ...t,
        enlaceOficial: `https://example.org/tramites/${clave}`,
        actualizadoEn: d(-30),
        entidadId: entidad[sigla],
      },
    });
    tramite[clave] = creado.id;
  }

  // Oportunidades
  const responsable = Object.fromEntries(PERSONAL.map((p) => [p.entidad, p.nombre]));
  const opPorNombre: Record<string, string> = {};
  for (const o of OPORTUNIDADES) {
    const slug = o.nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const creada = await db.oportunidad.create({
      data: {
        tipo: o.tipo,
        nombre: o.nombre,
        institucion: o.inst,
        pais: o.pais,
        ciudad: o.ciudad,
        descripcion: `${o.nombre} de ${o.inst} (${o.ciudad}, ${o.pais}). Ficha ilustrativa elaborada con datos ficticios para el prototipo Talento sin Fronteras.`,
        area: o.area,
        nivel: o.nivel,
        modalidad: o.mod,
        idioma: o.idioma,
        duracionMeses: o.dur,
        fechaInicio: d(o.ini),
        fechaApertura: d(o.ap),
        fechaCierre: d(o.ci),
        costoMatricula: o.mat,
        costoVidaMensual: o.vida,
        otrosCostos: o.otros,
        otrosCostosDetalle: otrosCostosDetalle(o),
        moneda: o.mon,
        financiamientoTipo: o.fin,
        cobertura: o.incompleta ? "" : (o.cob ?? ""),
        entidadFinanciadora: o.financ ?? "",
        enlaceOficial: `https://example.org/convocatorias/${slug}`,
        destacada: o.dest ?? false,
        creadaEn: o.nueva ? d(-o.act) : d(-o.act - 60),
        actualizadoEn: d(-o.act),
        responsableActualizacion: responsable[o.ent] ?? "Gestor de contenidos",
        entidadId: entidad[o.ent],
        requisitos: {
          create: requisitosDe(o).map((r, i) => ({ ...r, orden: i + 1 })),
        },
        tramites: {
          create: tramitesDe(o).map((c) => ({ tramiteId: tramite[c] })),
        },
      },
    });
    opPorNombre[o.nombre] = creada.id;
  }

  // Usuarios
  const hash = await bcrypt.hash(CLAVE_PRUEBA, 10);
  const usuario: Record<string, string> = {};
  for (const p of PERSONAL) {
    const u = await db.usuario.create({
      data: {
        email: p.email,
        nombre: p.nombre,
        passwordHash: hash,
        rol: p.rol,
        creadoEn: d(-200),
        entidadId: entidad[p.entidad],
      },
    });
    usuario[p.email] = u.id;
  }
  for (const c of [...CIUDADANOS, ...POBLACION_SIMULADA]) {
    const { email, paises, modalidades, idiomas, ...perfil } = c;
    const u = await db.usuario.create({
      data: {
        email,
        passwordHash: hash,
        rol: "ciudadano",
        creadoEn: d(-30),
        consentimientoEn: d(-30),
        perfil: {
          create: {
            ...perfil,
            paises: paises.join("|"),
            modalidad: modalidades.join("|"),
            idioma: idiomas.join("|"),
            actualizadoEn: d(-30),
          },
        },
      },
    });
    usuario[email] = u.id;
  }

  const op = (nombre: string) => {
    const id = opPorNombre[nombre];
    if (!id) throw new Error(`Oportunidad no encontrada en el seed: ${nombre}`);
    return id;
  };

  // Rosa: tiene una oportunidad guardada, aún sin ruta.
  await db.guardada.create({
    data: {
      usuarioId: usuario["rosa@ventanilla.test"],
      oportunidadId: op("Beca de Cooperación Iberoamericana en Innovación Educativa"),
      creadaEn: d(-5),
    },
  });

  // Diego: ruta generada con avances parciales.
  const diego = usuario["diego@ventanilla.test"];
  const doctorado = op("Doctorado en Energías Renovables con beca de investigación");
  await generarRuta(db, diego, doctorado, d(-10));
  const itemsDiego = await db.itemChecklist.findMany({ where: { usuarioId: diego }, take: 3 });
  await db.itemChecklist.updateMany({
    where: { id: { in: itemsDiego.map((i) => i.id) } },
    data: { completado: true },
  });
  await db.avanceTramite.updateMany({
    where: { usuarioId: diego, tramiteId: tramite.idioma },
    data: { estado: "completado" },
  });
  await db.avanceTramite.updateMany({
    where: { usuarioId: diego, tramiteId: tramite.diploma },
    data: { estado: "en_curso" },
  });

  // Población simulada: rutas, encuestas y consultas para alimentar el tablero.
  const actividad: { email: string; oportunidad: string; ruta: boolean; encuesta?: [number, number, number, number, string] }[] = [
    { email: "usuario01@ventanilla.test", oportunidad: "Especialización en Salud Pública Digital", ruta: true, encuesta: [5, 4, 5, 5, "La ruta me ayudó a saber por dónde empezar con la apostilla."] },
    { email: "usuario02@ventanilla.test", oportunidad: "Beca de Doctorado en Ecología Amazónica", ruta: true, encuesta: [4, 3, 3, 4, "Me enteré tarde: la convocatoria cerraba en pocos días."] },
    { email: "usuario03@ventanilla.test", oportunidad: "Crédito Educativo para Maestría en Políticas Públicas", ruta: false, encuesta: [3, 3, 4, 3, "Falta detallar mejor las condiciones del crédito."] },
    { email: "usuario04@ventanilla.test", oportunidad: "Especialización en Didáctica del Francés", ruta: true, encuesta: [5, 5, 4, 5, "Muy claro, sobre todo el comparador."] },
    { email: "usuario05@ventanilla.test", oportunidad: "Maestría en Ciudades Inteligentes con beca completa", ruta: true },
    { email: "usuario06@ventanilla.test", oportunidad: "Máster en Dirección Pública y Gobernanza", ruta: false, encuesta: [4, 4, 4, 4, ""] },
    { email: "usuario07@ventanilla.test", oportunidad: "Beca de Doctorado en Estudios Andinos", ruta: true, encuesta: [5, 4, 5, 5, "Desde Ayacucho no sabía que existía esta beca."] },
    { email: "usuario08@ventanilla.test", oportunidad: "Beca de Investigación en Patrimonio Cultural", ruta: false, encuesta: [2, 2, 3, 3, "La ficha no indicaba si aceptan títulos de bachiller."] },
    { email: "usuario09@ventanilla.test", oportunidad: "Especialización en Atención Primaria de Salud", ruta: true },
  ];
  for (const a of actividad) {
    const uid = usuario[a.email];
    const oid = op(a.oportunidad);
    if (a.ruta) await generarRuta(db, uid, oid, d(-12));
    else await db.guardada.create({ data: { usuarioId: uid, oportunidadId: oid, creadaEn: d(-12) } });
    if (a.encuesta) {
      const [claridad, suficiencia, oportunidadInfo, utilidad, comentario] = a.encuesta;
      await db.encuesta.create({
        data: { usuarioId: uid, oportunidadId: oid, claridad, suficiencia, oportunidadInfo, utilidad, comentario, creadaEn: d(-4) },
      });
    }
  }

  // Consultas de orientación: dos pendientes y una respondida.
  const orientador = usuario["orientador@ventanilla.test"];
  await db.consulta.create({
    data: {
      usuarioId: usuario["usuario02@ventanilla.test"],
      tema: "Requisitos y documentos",
      pregunta: "¿Puedo postular si todavía no tengo el certificado de idioma? Rindo el examen el próximo mes.",
      oportunidadId: op("Beca de Doctorado en Ecología Amazónica"),
      creadaEn: d(-2),
    },
  });
  await db.consulta.create({
    data: {
      usuarioId: usuario["usuario07@ventanilla.test"],
      tema: "Trámites",
      pregunta: "Mi universidad no tiene las firmas registradas para la apostilla. ¿Qué hago?",
      creadaEn: d(-1),
    },
  });
  await db.consulta.create({
    data: {
      usuarioId: usuario["usuario01@ventanilla.test"],
      tema: "Financiamiento",
      pregunta: "¿El descuento de la especialización se puede combinar con otra beca?",
      oportunidadId: op("Especialización en Salud Pública Digital"),
      creadaEn: d(-6),
      respuesta:
        "Según la ficha, el descuento es para profesionales de salud del sector público. Para combinarlo con otra beca, confirma con la universidad en el enlace oficial de la convocatoria.",
      respondidaEn: d(-5),
      orientadorId: orientador,
    },
  });

  return {
    entidades: ENTIDADES.length,
    tramites: TRAMITES.length,
    oportunidades: OPORTUNIDADES.length,
    usuarios: PERSONAL.length + CIUDADANOS.length + POBLACION_SIMULADA.length,
  };
}
