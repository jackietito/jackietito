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
import { construirRuta, porcentaje } from "@/lib/ruta";
import { EtiquetaEstado, textoPlazo } from "@/components/oportunidad";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";

export const metadata: Metadata = { title: "Mi panel" };

/** Horizonte de «próximas fechas» del panel (días). */
const HORIZONTE_DIAS = 60;

const ESTILO_TRAMITE: Record<string, string> = {
  pendiente: "border-gray-500 bg-white text-gray-700",
  en_curso: "border-alerta bg-alerta-claro text-alerta",
  completado: "border-exito bg-exito-claro text-exito",
};

type Fecha = { fecha: Date; que: string; oportunidad: string; enlace: string };

/** Panel de seguimiento (RF13): guardadas, próximas fechas, avance del checklist y estado de cada trámite. */
export default async function Panel() {
  const u = await exigirRol(["ciudadano"], "/panel");
  const hoy = await obtenerHoy();
  await sincronizarAlertas(prisma, u.id, hoy);
  const [guardadas, alertasSinLeer, ctx] = await Promise.all([
    prisma.guardada.findMany({
      where: { usuarioId: u.id, oportunidad: { publicada: true } },
      include: {
        oportunidad: {
          include: {
            entidad: true,
            tramites: { include: { tramite: true } },
            checklist: { where: { usuarioId: u.id }, select: { completado: true } },
            avances: { where: { usuarioId: u.id } },
          },
        },
      },
      orderBy: { creadaEn: "desc" },
    }),
    prisma.alerta.count({ where: { usuarioId: u.id, leida: false } }),
    contextoAcciones(),
  ]);

  // Próximas fechas: cierres de las guardadas y pasos pendientes de las rutas.
  const fechas: Fecha[] = [];
  for (const g of guardadas) {
    const o = g.oportunidad;
    if (estadoConvocatoria(o, hoy) === "cerrada") continue;
    fechas.push({ fecha: o.fechaCierre, que: "Cierre de la convocatoria", oportunidad: o.nombre, enlace: `/oportunidades/${o.id}` });
    if (!g.rutaGeneradaEn) continue;
    for (const p of construirRuta(o, o.tramites.map((t) => t.tramite))) {
      const avance = o.avances.find((a) => a.tramiteId === p.tramiteId);
      if (avance?.estado === "completado") continue;
      fechas.push({ fecha: p.fechaRecomendada, que: p.tipo === "postulacion" ? "Postular en el canal oficial" : `Empezar: ${p.titulo}`, oportunidad: o.nombre, enlace: `/ruta/${o.id}` });
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

      <ul className="grid gap-3 sm:grid-cols-3" aria-label="Resumen">
        <li className="tarjeta"><p className="text-3xl font-bold text-marca-oscura">{guardadas.length}</p><p className="text-sm">oportunidades guardadas</p></li>
        <li className="tarjeta"><p className="text-3xl font-bold text-marca-oscura">{proximas.length}</p><p className="text-sm">fechas en los próximos {HORIZONTE_DIAS} días</p></li>
        <li className="tarjeta">
          <p className="text-3xl font-bold text-marca-oscura">{alertasSinLeer}</p>
          <p className="text-sm"><Link href="/alertas" className="enlace">{alertasSinLeer === 1 ? "alerta sin leer" : "alertas sin leer"}</Link></p>
        </li>
      </ul>

      <section aria-labelledby="titulo-fechas" className="space-y-3">
        <h2 id="titulo-fechas" className="titulo-seccion">Próximas fechas</h2>
        {proximas.length ? (
          <ol className="tarjeta divide-y divide-borde p-0 sm:p-0">
            {proximas.map((f, i) => {
              const dias = diasEntre(hoy, f.fecha);
              const color = dias < 0 ? "text-peligro" : dias <= 7 ? "text-alerta" : "text-suave";
              return (
                <li key={i} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-32 shrink-0 font-bold">{formatearFechaCorta(f.fecha)}</span>
                  <span className="flex-1">
                    <Link href={f.enlace} className="enlace">{f.que}</Link>
                    <span className="block text-sm text-suave">{f.oportunidad}</span>
                  </span>
                  <span className={`text-sm font-semibold ${color}`}>{dias < 0 ? `Atrasado (${textoDias(dias)})` : textoDias(dias)}</span>
                </li>
              );
            })}
          </ol>
        ) : <p className="text-suave">No tienes fechas en los próximos {HORIZONTE_DIAS} días.</p>}
      </section>

      <section aria-labelledby="titulo-guardadas" className="space-y-4">
        <h2 id="titulo-guardadas" className="titulo-seccion">Oportunidades guardadas ({guardadas.length})</h2>
        {guardadas.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {guardadas.map(({ oportunidad: o, creadaEn, rutaGeneradaEn }) => {
              const hechos = o.checklist.filter((i) => i.completado).length;
              const pct = porcentaje(hechos, o.checklist.length);
              const estado = estadoConvocatoria(o, hoy);
              const tramites = o.tramites.map((t) => t.tramite).sort((a, b) => a.orden - b.orden);
              return (
                <li key={o.id}>
                  <article aria-labelledby={`g-${o.id}`} className="tarjeta flex h-full flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <EtiquetaEstado estado={estado} />
                      <span className="text-sm font-semibold">{textoPlazo(o, hoy)}</span>
                    </div>
                    <h3 id={`g-${o.id}`} className="text-lg font-bold leading-snug">
                      <Link href={`/oportunidades/${o.id}`} className="text-marca-oscura underline-offset-4 hover:underline">{o.nombre}</Link>
                    </h3>
                    <p className="text-sm text-suave">{o.institucion} · {o.pais} · La guardaste el {formatearFecha(creadaEn)}</p>
                    {rutaGeneradaEn ? (
                      <>
                        <div>
                          <div className="flex justify-between text-sm font-semibold"><span>Checklist</span><span>{pct}%</span></div>
                          <div role="progressbar" aria-label={`Checklist de ${o.nombre}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-exito" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-suave">{hechos} de {o.checklist.length} requisitos listos</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Trámites</h4>
                          <ul className="mt-1 space-y-1 text-sm">
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
                        </div>
                        <Link href={`/ruta/${o.id}`} className="btn-primario text-sm">Ver mi ruta y checklist ({pct}% listo)</Link>
                      </>
                    ) : estado !== "cerrada" ? (
                      <Link href={`/ruta/${o.id}`} className="btn-secundario text-sm">Preparar mi postulación</Link>
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

      <section aria-labelledby="titulo-opinion" className="tarjeta space-y-2 border-marca bg-marca-clara">
        <h2 id="titulo-opinion" className="titulo-seccion">¿Te está sirviendo la Ventanilla?</h2>
        <p>Responde una encuesta corta sobre la claridad y utilidad de la información.</p>
        <Link href="/encuesta" className="btn-primario">Responder la encuesta</Link>
      </section>
    </div>
  );
}
