import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { CATEGORIAS_REQUISITO, etiqueta } from "@/lib/catalogos";
import { formatearFecha, formatearFechaCorta } from "@/lib/fechas";
import { estadoConvocatoria } from "@/lib/oportunidades";
import { avisoPaso, construirRuta, generarRuta, NO_ALCANZABLE, porcentaje, type AvisoPaso } from "@/lib/ruta";
import { llegoATiempo, similaresQueCierranDespues } from "@/lib/llegada";
import { Check, CircleAlert, CircleCheck, Clock, Zap } from "lucide-react";
import { Bandera } from "@/components/Bandera";
import { Alternativas } from "@/components/Alternativas";
import { Semaforo } from "@/components/ResumenFicha";
import { tramitesDeLaRuta } from "@/lib/tramites";
import { idiomasAcreditados } from "@/lib/recomendaciones";
import { EtiquetaUrgencia } from "@/components/oportunidad";
import { CasillaChecklist, SelectorEstadoTramite } from "@/components/ControlesRuta";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Mi ruta de postulación" };

function Barra({ valor, etiqueta: texto }: { valor: number; etiqueta: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{texto}</span>
        <span>{valor}%</span>
      </div>
      <div role="progressbar" aria-label={texto} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}
        className="mt-1 h-3 overflow-hidden rounded-full bg-marca-100">
        <div className="h-full rounded-full bg-exito transition-[width] duration-[var(--duracion-media)]" style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

const ESTILO_AVISO: Record<AvisoPaso["nivel"], { clase: string; Icono: typeof Clock }> = {
  hecho: { clase: "text-exito", Icono: CircleCheck },
  normal: { clase: "text-suave", Icono: Clock },
  pronto: { clase: "text-alerta", Icono: Clock },
  "inicia-hoy": { clase: "text-alerta", Icono: Zap },
  "no-alcanza": { clase: "text-peligro", Icono: CircleAlert },
};

function Aviso({ aviso }: { aviso: AvisoPaso }) {
  const { clase, Icono } = ESTILO_AVISO[aviso.nivel];
  return (
    <p className={`inline-flex items-start gap-1.5 text-sm font-semibold ${clase}`}>
      <Icono aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{aviso.texto}
    </p>
  );
}

/**
 * Ruta de postulación (RF09, RF11, D63). «Preparar mi postulación» llega aquí y la
 * ruta se arma de inmediato, sin pantalla intermedia: línea de tiempo hacia atrás
 * desde el cierre, checklist al lado y una barra de avance.
 */
export default async function Ruta({ params }: Params) {
  const { id } = await params;
  const u = await exigirRol(["ciudadano"], `/ruta/${id}`);
  const [o, hoy, todas] = await Promise.all([
    prisma.oportunidad.findFirst({
      where: { id, publicada: true },
      include: { entidad: true, tramites: { where: { tramite: { publicado: true } }, include: { tramite: true } } },
    }),
    obtenerHoy(),
    prisma.oportunidad.findMany({ where: { publicada: true } }),
  ]);
  if (!o) notFound();
  const estado = estadoConvocatoria(o, hoy);
  let guardada = await prisma.guardada.findUnique({ where: { usuarioId_oportunidadId: { usuarioId: u.id, oportunidadId: id } } });

  // Sin ruta y con la convocatoria vigente: se genera ahora (y se guarda en el panel).
  let recienGenerada = false;
  if (!guardada?.rutaGeneradaEn && estado !== "cerrada") {
    await generarRuta(prisma, u.id, id, hoy);
    guardada = await prisma.guardada.findUnique({ where: { usuarioId_oportunidadId: { usuarioId: u.id, oportunidadId: id } } });
    recienGenerada = true;
  }
  const [items, avances] = await Promise.all([
    prisma.itemChecklist.findMany({ where: { usuarioId: u.id, oportunidadId: id }, include: { requisito: true } }),
    prisma.avanceTramite.findMany({ where: { usuarioId: u.id, oportunidadId: id } }),
  ]);
  const alternativas = similaresQueCierranDespues(o, todas, hoy, 4);

  const encabezado = (
    <header className="space-y-2">
      <nav aria-label="Ruta de navegación" className="text-sm">
        <Link href={`/oportunidades/${o.id}`} className="enlace">← Volver a la ficha</Link>
      </nav>
      <p className="text-sm font-semibold uppercase tracking-wide text-suave">Mi ruta de postulación</p>
      <h1 className="titulo-pagina">{o.nombre}</h1>
      <p className="inline-flex flex-wrap items-center gap-1.5 text-suave"><Bandera pais={o.pais} />{o.institucion} · {o.ciudad}, {o.pais}</p>
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaUrgencia o={o} hoy={hoy} />
        <span className="font-semibold">Cierra el {formatearFecha(o.fechaCierre)}</span>
      </div>
    </header>
  );

  const bloqueAlternativas = (detalle: string) => (
    <section aria-labelledby="titulo-alternativas" id="alternativas" className="tarjeta space-y-3 border-2 border-peligro bg-peligro-claro">
      <h2 id="titulo-alternativas" className="inline-flex items-start gap-2 text-xl font-bold text-peligro">
        <CircleAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />{NO_ALCANZABLE}
      </h2>
      <p className="text-texto">{detalle}</p>
      <Alternativas lista={alternativas} hoy={hoy} />
    </section>
  );

  if (!guardada?.rutaGeneradaEn) {
    return (
      <div className="space-y-6">
        {encabezado}
        {bloqueAlternativas("La convocatoria ya cerró, por eso no armamos una ruta. Estas oportunidades parecidas siguen vigentes y cierran después.")}
      </div>
    );
  }

  // El examen de idioma se omite si la persona acredita el idioma de la oportunidad (D57).
  const acreditados = idiomasAcreditados(u.perfil);
  const tramites = tramitesDeLaRuta(o.tramites.map((t) => t.tramite), o.idioma, acreditados);
  const omiteIdioma = tramites.length < o.tramites.length;
  const pasos = construirRuta(o, tramites);
  const completados = new Set(avances.filter((a) => a.estado === "completado").map((a) => a.tramiteId));
  const llegada = llegoATiempo(o, tramites, hoy, completados);
  const alcanzable = estado !== "cerrada" && llegada?.nivel !== "rojo";
  const idsRuta = new Set(tramites.map((t) => t.id));
  const avancesRuta = avances.filter((a) => idsRuta.has(a.tramiteId));
  const avancePorTramite = new Map(avances.map((a) => [a.tramiteId, a]));
  const hechos = items.filter((i) => i.completado).length;
  const pctChecklist = porcentaje(hechos, items.length);
  const tramitesHechos = avancesRuta.filter((a) => a.estado === "completado").length;
  const pctTotal = porcentaje(hechos + tramitesHechos, items.length + avancesRuta.length);
  const ordenRequisito = (i: (typeof items)[number]) => i.requisito?.orden ?? 999;
  const categorias = Object.keys(CATEGORIAS_REQUISITO).filter((c) => items.some((i) => i.categoria === c));

  return (
    <div className="space-y-6">
      {recienGenerada && (
        <p role="status" className="anima-entrada rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          Listo: armamos tu ruta y tu checklist. Guardamos esta oportunidad en tu panel.
        </p>
      )}
      {encabezado}

      {!alcanzable && bloqueAlternativas(
        estado === "cerrada"
          ? "La convocatoria ya cerró. Tus avances quedan guardados y te sirven para estas oportunidades parecidas, que cierran después."
          : `${llegada!.detalle} Puedes seguir intentándolo, pero estas oportunidades parecidas cierran después y te dan más tiempo.`,
      )}

      <section aria-labelledby="titulo-avance" className="tarjeta space-y-3">
        <h2 id="titulo-avance" className="titulo-seccion">Mi avance</h2>
        <Barra valor={pctTotal} etiqueta="Avance de mi postulación" />
        <p aria-live="polite" className="text-sm text-suave">
          Tienes {hechos} de {items.length} requisitos listos ({pctChecklist}%) y {tramitesHechos} de {avancesRuta.length} trámites completados.
        </p>
        {llegada && alcanzable && <Semaforo llegada={llegada} />}
        <a href="#titulo-checklist" className="enlace inline-flex min-h-11 items-center text-sm lg:hidden">Ir a mi checklist</a>
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="titulo-pasos" className="min-w-0 space-y-3">
          <h2 id="titulo-pasos" className="titulo-seccion">Ruta paso a paso</h2>
          {omiteIdioma && (
            <p className="rounded-lg border border-exito bg-exito-claro p-3 text-sm text-exito">
              No incluimos el examen de idioma porque en tu perfil indicaste que acreditas {o.idioma.toLowerCase()} con un certificado vigente.{" "}
              <Link href="/perfil" className="underline">Cambiar mi perfil</Link>
            </p>
          )}
          <p className="text-sm text-suave">
            Las fechas se calculan hacia atrás desde el cierre de la convocatoria ({formatearFecha(o.fechaCierre)}). Plazos y costos referenciales: verifícalos en el sitio oficial de cada entidad.
          </p>
          <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[1.1rem] before:top-4 before:w-0.5 before:bg-marca-100">
            {pasos.map((p) => {
              const avance = p.tramiteId ? avancePorTramite.get(p.tramiteId) : undefined;
              const completado = avance?.estado === "completado";
              const aviso = avisoPaso(p, o.fechaCierre, hoy, completado);
              return (
                <li key={p.orden} className="relative pl-12">
                  <span aria-hidden="true" className={`absolute left-0 top-3 flex h-9 w-9 items-center justify-center rounded-full border-4 border-fondo font-bold text-white ${
                    completado ? "bg-exito" : aviso.nivel === "inicia-hoy" ? "bg-alerta" : aviso.nivel === "no-alcanza" ? "bg-peligro" : "bg-marca"}`}>
                    {completado ? <Check className="h-4 w-4" /> : p.orden}
                  </span>
                  <p className="mb-1 text-sm font-bold text-marca-oscura">
                    <time dateTime={p.fechaRecomendada.toISOString().slice(0, 10)}>{formatearFechaCorta(p.fechaRecomendada)}</time>
                  </p>
                  <article aria-labelledby={`paso-${p.orden}`} className={`tarjeta space-y-2 ${completado ? "border-exito" : ""}`}>
                    <div>
                      <div>
                        <h3 id={`paso-${p.orden}`} className="font-bold text-marca-oscura">
                          <span className="sr-only">Paso {p.orden}: </span>{p.titulo}
                        </h3>
                        <p className="text-sm text-suave">Ante: {p.entidad}</p>
                      </div>
                    </div>
                    <p className="text-sm">{p.descripcion}</p>
                    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-suave">{p.tipo === "postulacion" ? "Postula antes del" : "Empieza a más tardar el"}</dt>
                        <dd>{formatearFecha(p.fechaRecomendada)}</dd>
                      </div>
                      {p.plazo !== null && (
                        <div><dt className="font-semibold text-suave">Plazo y costo referenciales</dt>
                          <dd>{p.plazo} · {p.costo}</dd></div>
                      )}
                    </dl>
                    <Aviso aviso={aviso} />
                    <div>
                      <h4 className="text-sm font-semibold text-suave">Documentos</h4>
                      <ul className="list-disc pl-5 text-sm">{p.documentos.map((d) => <li key={d}>{d}</li>)}</ul>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-2">
                      {avance ? (
                        <SelectorEstadoTramite avanceId={avance.id} estado={avance.estado} tramite={p.titulo} />
                      ) : <span />}
                      {p.enlaces.length ? (
                        <ul className="space-y-1 text-sm" aria-label={`Enlaces oficiales de ${p.titulo}`}>
                          {p.enlaces.map((e) => (
                            <li key={e.url}>
                              <a href={e.url} target="_blank" rel="noopener noreferrer" className="enlace">
                                {e.texto}<span className="sr-only"> (sitio oficial, se abre en una pestaña nueva)</span> <span aria-hidden="true">↗</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <a href={p.enlace} target="_blank" rel="noopener noreferrer" className="enlace text-sm">
                          {p.tipo === "postulacion" ? "Ir a la convocatoria oficial" : "Enlace de ejemplo"}
                          <span className="sr-only"> de {p.titulo} (se abre en una pestaña nueva)</span> <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="titulo-checklist" className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <h2 id="titulo-checklist" className="titulo-seccion">Mi checklist</h2>
          <p className="text-sm text-suave">Marca cada requisito cuando lo tengas listo. Se guarda al instante.</p>
          <div className="tarjeta space-y-4">
            {categorias.map((c) => (
              <fieldset key={c}>
                <legend className="font-bold">{etiqueta(CATEGORIAS_REQUISITO, c)}</legend>
                {items.filter((i) => i.categoria === c).sort((a, b) => ordenRequisito(a) - ordenRequisito(b)).map((i) => (
                  <CasillaChecklist key={i.id} id={i.id} texto={i.descripcion} completado={i.completado} />
                ))}
              </fieldset>
            ))}
          </div>
          <p className="text-xs text-suave">
            Ruta generada el {formatearFecha(guardada!.rutaGeneradaEn!)}.
          </p>
        </section>
      </div>
    </div>
  );
}
