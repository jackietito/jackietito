import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { contextoAcciones } from "@/lib/contexto";
import { sincronizarAlertas } from "@/lib/alertas";
import { ESTADOS_TRAMITE, etiqueta } from "@/lib/catalogos";
import { diasEntre, formatearFecha, formatearFechaCorta, textoDias } from "@/lib/fechas";
import { estadoConvocatoria } from "@/lib/oportunidades";
import { avisoPaso, construirRuta, NO_ALCANZABLE, porcentaje } from "@/lib/ruta";
import { llegoATiempo, similaresQueCierranDespues } from "@/lib/llegada";
import { ArrowRight, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { Bandera } from "@/components/Bandera";
import { Alternativas } from "@/components/Alternativas";
import { tramitesDeLaRuta } from "@/lib/tramites";
import { idiomasAcreditados } from "@/lib/recomendaciones";
import { EtiquetaUrgencia } from "@/components/oportunidad";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";

export const metadata: Metadata = { title: "Mi panel" };

/** Horizonte de «próximas fechas» del panel (días). */
const HORIZONTE_DIAS = 60;

const ESTILO_TRAMITE: Record<string, string> = {
  pendiente: "border-gray-500 bg-white text-gray-700",
  en_curso: "border-alerta bg-alerta-claro text-alerta",
  completado: "border-exito bg-exito-claro text-exito",
};

type Fecha = { fecha: Date; que: string; oportunidad: string; enlace: string; aviso: string; nivel: "normal" | "pronto" | "inicia-hoy" | "no-alcanza" };

const SEMAFORO = {
  verde: { clase: "border-exito bg-exito-claro text-exito", Icono: CircleCheck },
  ambar: { clase: "border-alerta bg-alerta-claro text-alerta", Icono: TriangleAlert },
  rojo: { clase: "border-peligro bg-peligro-claro text-peligro", Icono: CircleAlert },
} as const;

const COLOR_AVISO = { normal: "text-suave", pronto: "text-alerta", "inicia-hoy": "text-alerta", "no-alcanza": "text-peligro" } as const;

/** Panel de seguimiento (RF13): guardadas, próximas fechas, avance del checklist y estado de cada trámite. */
export default async function Panel() {
  const u = await exigirRol(["ciudadano"], "/panel");
  const hoy = await obtenerHoy();
  await sincronizarAlertas(prisma, u.id, hoy);
  const [guardadas, alertasSinLeer, ctx, todas] = await Promise.all([
    prisma.guardada.findMany({
      where: { usuarioId: u.id, oportunidad: { publicada: true } },
      include: {
        oportunidad: {
          include: {
            entidad: true,
            tramites: { where: { tramite: { publicado: true } }, include: { tramite: true } },
            checklist: { where: { usuarioId: u.id }, select: { completado: true } },
            avances: { where: { usuarioId: u.id } },
          },
        },
      },
      orderBy: { creadaEn: "desc" },
    }),
    prisma.alerta.count({ where: { usuarioId: u.id, leida: false } }),
    contextoAcciones(),
    prisma.oportunidad.findMany({ where: { publicada: true } }),
  ]);

  const acreditados = idiomasAcreditados(u.perfil);

  // Una ficha por oportunidad guardada (D63): avance, semáforo y próximo paso.
  const fichas = guardadas.map((g) => {
    const o = g.oportunidad;
    const estado = estadoConvocatoria(o, hoy);
    const tramites = tramitesDeLaRuta(o.tramites.map((t) => t.tramite), o.idioma, acreditados).sort((a, b) => a.orden - b.orden);
    const completados = new Set(o.avances.filter((a) => a.estado === "completado").map((a) => a.tramiteId));
    const llegada = llegoATiempo(o, tramites, hoy, completados);
    const alcanzable = estado !== "cerrada" && llegada?.nivel !== "rojo";
    const hechos = o.checklist.filter((i) => i.completado).length;
    const idsRuta = new Set(tramites.map((t) => t.id));
    const tramitesHechos = [...completados].filter((id) => idsRuta.has(id)).length;
    const pct = porcentaje(hechos + tramitesHechos, o.checklist.length + tramites.length);
    const pasos = g.rutaGeneradaEn && estado !== "cerrada"
      ? construirRuta(o, tramites).filter((p) => !(p.tramiteId && completados.has(p.tramiteId)))
      : [];
    const proximo = pasos[0] ? { paso: pasos[0], aviso: avisoPaso(pasos[0], o.fechaCierre, hoy) } : null;
    return { g, o, estado, tramites, llegada, alcanzable, hechos, tramitesHechos, pct, pasos,
      proximo, alternativas: alcanzable ? [] : similaresQueCierranDespues(o, todas, hoy, 2) };
  });

  // Próximas fechas: cierres de las guardadas y pasos pendientes de las rutas.
  const fechas: Fecha[] = [];
  for (const f of fichas) {
    const { o } = f;
    if (f.estado === "cerrada") continue;
    const dias = diasEntre(hoy, o.fechaCierre);
    fechas.push({ fecha: o.fechaCierre, que: "Cierre de la convocatoria", oportunidad: o.nombre, enlace: `/oportunidades/${o.id}`,
      aviso: textoDias(dias), nivel: dias <= 7 ? "pronto" : "normal" });
    if (!f.alcanzable) {
      // Una sola línea, no una por paso: la convocatoria ya no es alcanzable.
      fechas.push({ fecha: hoy, que: "Ver alternativas", oportunidad: o.nombre, enlace: `/ruta/${o.id}#alternativas`, aviso: NO_ALCANZABLE, nivel: "no-alcanza" });
      continue;
    }
    for (const p of f.pasos) {
      const aviso = avisoPaso(p, o.fechaCierre, hoy);
      const vencido = aviso.nivel === "inicia-hoy" || aviso.nivel === "no-alcanza";
      fechas.push({
        // Un paso cuya fecha recomendada pasó se muestra hoy, con hasta cuándo aún llega.
        fecha: vencido ? hoy : p.fechaRecomendada,
        que: p.tipo === "postulacion" ? "Postular en el canal oficial" : `Empezar: ${p.titulo}`,
        oportunidad: o.nombre, enlace: `/ruta/${o.id}`,
        aviso: vencido ? aviso.texto : textoDias(diasEntre(hoy, p.fechaRecomendada)),
        nivel: aviso.nivel === "hecho" ? "normal" : aviso.nivel,
      });
    }
  }
  const proximas = fechas
    .filter((f) => diasEntre(hoy, f.fecha) <= HORIZONTE_DIAS)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-pagina">Mi panel</h1>
        <p className="mt-2 text-suave">Sigue tus oportunidades guardadas, tus próximas fechas y tu avance.</p>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Resumen">
        <li className="tarjeta p-3 sm:p-5"><p className="text-2xl sm:text-3xl font-bold text-marca-oscura">{guardadas.length}</p><p className="text-sm">oportunidades guardadas</p></li>
        <li className="tarjeta p-3 sm:p-5"><p className="text-2xl sm:text-3xl font-bold text-marca-oscura">{proximas.length}</p><p className="text-sm">fechas en los próximos {HORIZONTE_DIAS} días</p></li>
        <li className="tarjeta p-3 sm:p-5">
          <p className="text-2xl sm:text-3xl font-bold text-marca-oscura">{alertasSinLeer}</p>
          <p className="text-sm"><Link href="/alertas" className="enlace">{alertasSinLeer === 1 ? "alerta sin leer" : "alertas sin leer"}</Link></p>
        </li>
      </ul>

      <section aria-labelledby="titulo-guardadas" className="space-y-4">
        <h2 id="titulo-guardadas" className="titulo-seccion">Oportunidades guardadas ({guardadas.length})</h2>
        {guardadas.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {fichas.map(({ g, o, estado, tramites, llegada, alcanzable, hechos, tramitesHechos, pct, proximo, alternativas }) => {
              const sem = llegada && alcanzable ? SEMAFORO[llegada.nivel] : null;
              return (
                <li key={o.id}>
                  <article aria-labelledby={`g-${o.id}`} className="tarjeta flex h-full flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm text-meta"><Bandera pais={o.pais} />{o.pais}</span>
                      <EtiquetaUrgencia o={o} hoy={hoy} />
                    </div>
                    <h3 id={`g-${o.id}`} className="text-lg font-bold leading-snug">
                      <Link href={`/oportunidades/${o.id}`} className="text-marca-oscura underline-offset-4 hover:underline">{o.nombre}</Link>
                    </h3>
                    <p className="text-sm text-suave">{o.institucion} · Cierra el {formatearFecha(o.fechaCierre)} · La guardaste el {formatearFecha(g.creadaEn)}</p>
                    {g.rutaGeneradaEn && (
                      <div>
                        <div className="flex justify-between text-sm font-semibold"><span>Avance</span><span>{pct}%</span></div>
                        <div role="progressbar" aria-label={`Avance de ${o.nombre}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-2.5 overflow-hidden rounded-full bg-marca-100">
                          <div className="h-full bg-exito" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-suave">{hechos} de {o.checklist.length} requisitos listos · {tramitesHechos} de {tramites.length} trámites completados</p>
                      </div>
                    )}
                    {sem && llegada && (
                      <p className={`inline-flex items-start gap-2 rounded-[var(--radius-control)] border-2 px-3 py-2 text-sm font-bold ${sem.clase}`}>
                        <sem.Icono aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span><span className="sr-only">¿Llego a tiempo? </span>{llegada.titulo}</span>
                      </p>
                    )}
                    {!alcanzable && (
                      <div className="space-y-2 rounded-[var(--radius-control)] border-2 border-peligro bg-peligro-claro p-3">
                        <p className="inline-flex items-start gap-2 text-sm font-bold text-peligro">
                          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{NO_ALCANZABLE}
                        </p>
                        <Alternativas lista={alternativas} hoy={hoy} />
                      </div>
                    )}
                    {proximo && alcanzable && (
                      <div className="rounded-[var(--radius-control)] bg-marca-clara p-3 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-suave">Próximo paso</p>
                        <p className="font-bold text-marca-oscura">{proximo.paso.titulo}</p>
                        <p className={`font-semibold ${COLOR_AVISO[proximo.aviso.nivel === "hecho" ? "normal" : proximo.aviso.nivel]}`}>
                          {proximo.aviso.nivel === "inicia-hoy" ? proximo.aviso.texto : `${proximo.paso.tipo === "postulacion" ? "Postula antes del" : "Empieza a más tardar el"} ${formatearFecha(proximo.paso.fechaRecomendada)}.`}
                        </p>
                      </div>
                    )}
                    {g.rutaGeneradaEn ? (
                      <>
                        <details className="text-sm">
                          <summary className="cursor-pointer py-3 font-semibold">Estado de los trámites</summary>
                          <ul className="mt-1 space-y-1">
                            {tramites.map((t) => {
                              const e = o.avances.find((a) => a.tramiteId === t.id)?.estado ?? "pendiente";
                              return (
                                <li key={t.id} className="flex items-start justify-between gap-2">
                                  <span>{t.nombre}</span>
                                  <span className={`shrink-0 rounded-full border px-2 text-xs font-bold ${ESTILO_TRAMITE[e]}`}>{etiqueta(ESTADOS_TRAMITE, e)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </details>
                        <Link href={`/ruta/${o.id}`} prefetch={false} className={alcanzable ? "btn-primario text-sm" : "btn-secundario text-sm"}>
                          Ver mi ruta y checklist ({pct}% listo)<ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </>
                    ) : estado !== "cerrada" ? (
                      <Link href={`/ruta/${o.id}`} prefetch={false} className="btn-secundario text-sm">Preparar mi postulación</Link>
                    ) : null}
                    <div className="mt-auto space-y-2 border-t border-borde pt-3">
                      <AccionesOportunidad id={o.id} nombre={o.nombre} rol={ctx.rol} guardada enComparador={ctx.comparar.has(o.id)} volver="/panel" />
                      <Link href={`/encuesta?oportunidad=${o.id}`} className="enlace text-sm">Opinar sobre esta información<span className="sr-only">: {o.nombre}</span></Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="tarjeta">
            <p className="font-semibold">Todavía no guardaste oportunidades.</p>
            <p className="mt-1 text-suave">
              Usa el botón «Guardar» en el <Link href="/catalogo" className="enlace">catálogo</Link> o en
              tus <Link href="/recomendaciones" className="enlace">recomendaciones</Link>.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-fechas" className="space-y-3">
        <h2 id="titulo-fechas" className="titulo-seccion">Próximas fechas</h2>
        {proximas.length ? (
          <ol className="tarjeta divide-y divide-borde p-0 sm:p-0">
            {proximas.map((f, i) => {
              return (
                <li key={i} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-32 shrink-0 font-bold">{formatearFechaCorta(f.fecha)}</span>
                  <span className="flex-1">
                    <Link href={f.enlace} className="enlace">{f.que}</Link>
                    <span className="block text-sm text-suave">{f.oportunidad}</span>
                  </span>
                  <span className={`text-sm font-semibold sm:max-w-xs sm:text-right ${COLOR_AVISO[f.nivel]}`}>{f.aviso}</span>
                </li>
              );
            })}
          </ol>
        ) : <p className="text-suave">No tienes fechas en los próximos {HORIZONTE_DIAS} días.</p>}
      </section>

      <section aria-labelledby="titulo-opinion" className="tarjeta space-y-2 border-marca bg-marca-clara">
        <h2 id="titulo-opinion" className="titulo-seccion">¿Te está sirviendo Talento sin Fronteras?</h2>
        <p>Responde una encuesta corta sobre la claridad y utilidad de la información.</p>
        <Link href="/encuesta" className="btn-primario">Responder la encuesta</Link>
      </section>
    </div>
  );
}
