import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { CATEGORIAS_REQUISITO, etiqueta } from "@/lib/catalogos";
import { diasEntre, formatearFecha, textoDias } from "@/lib/fechas";
import { estadoConvocatoria } from "@/lib/oportunidades";
import { construirRuta, porcentaje, type PasoRuta } from "@/lib/ruta";
import { generarMiRuta } from "@/lib/acciones-ruta";
import { EtiquetaEstado, textoPlazo } from "@/components/oportunidad";
import { CasillaChecklist, SelectorEstadoTramite } from "@/components/ControlesRuta";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ generada?: string }> };

export const metadata: Metadata = { title: "Mi ruta de postulación" };

/** Días antes de la fecha recomendada en que un paso se marca como «próximo». */
const DIAS_PROXIMO = 14;

function Barra({ valor, etiqueta: texto }: { valor: number; etiqueta: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{texto}</span>
        <span>{valor}%</span>
      </div>
      <div role="progressbar" aria-label={texto} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}
        className="mt-1 h-3 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-exito" style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function AvisoFecha({ paso, hoy, completado }: { paso: PasoRuta; hoy: Date; completado: boolean }) {
  if (completado) return <span className="font-semibold text-exito">Completado</span>;
  const dias = diasEntre(hoy, paso.fechaRecomendada);
  if (dias < 0) {
    return <span className="font-semibold text-peligro">La fecha recomendada ya pasó ({textoDias(dias)}): hazlo cuanto antes.</span>;
  }
  if (dias <= DIAS_PROXIMO) return <span className="font-semibold text-alerta">Empieza {textoDias(dias)}.</span>;
  return <span className="text-suave">Empieza {textoDias(dias)}.</span>;
}

export default async function Ruta({ params, searchParams }: Params) {
  const { id } = await params;
  const { generada } = await searchParams;
  const u = await exigirRol(["ciudadano"], `/ruta/${id}`);
  const [o, hoy, guardada, items, avances] = await Promise.all([
    prisma.oportunidad.findFirst({
      where: { id, publicada: true },
      include: { entidad: true, tramites: { where: { tramite: { publicado: true } }, include: { tramite: true } } },
    }),
    obtenerHoy(),
    prisma.guardada.findUnique({ where: { usuarioId_oportunidadId: { usuarioId: u.id, oportunidadId: id } } }),
    prisma.itemChecklist.findMany({ where: { usuarioId: u.id, oportunidadId: id }, include: { requisito: true } }),
    prisma.avanceTramite.findMany({ where: { usuarioId: u.id, oportunidadId: id } }),
  ]);
  if (!o) notFound();
  const estado = estadoConvocatoria(o, hoy);
  const tieneRuta = !!guardada?.rutaGeneradaEn;

  const encabezado = (
    <header className="space-y-2">
      <nav aria-label="Ruta de navegación" className="text-sm">
        <Link href={`/oportunidades/${o.id}`} className="enlace">← Volver a la ficha</Link>
      </nav>
      <p className="text-sm font-semibold uppercase tracking-wide text-suave">Mi ruta de postulación</p>
      <h1 className="titulo-pagina">{o.nombre}</h1>
      <p className="text-suave">{o.institucion} · {o.ciudad}, {o.pais}</p>
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaEstado estado={estado} />
        <span className="font-semibold">{textoPlazo(o, hoy)}</span>
      </div>
    </header>
  );

  if (!tieneRuta) {
    return (
      <div className="space-y-6">
        {encabezado}
        <section className="tarjeta max-w-2xl space-y-3" aria-labelledby="titulo-generar">
          <h2 id="titulo-generar" className="titulo-seccion">Prepara tu postulación paso a paso</h2>
          {estado === "cerrada" ? (
            <p>
              Esta convocatoria ya cerró, por eso no podemos armar una ruta. Busca otra oportunidad en el{" "}
              <Link href="/catalogo" className="enlace">catálogo</Link> o en tus <Link href="/recomendaciones" className="enlace">recomendaciones</Link>.
            </p>
          ) : (
            <>
              <p>Te mostraremos:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Los {o.tramites.length} trámites nacionales que necesitas, en orden, ante qué entidad y desde qué fecha empezarlos.</li>
                <li>Un checklist con los requisitos y documentos de esta convocatoria, para marcar lo que ya tienes.</li>
              </ul>
              <p className="text-sm text-suave">También la guardaremos en tu panel.</p>
              <form action={generarMiRuta}>
                <input type="hidden" name="oportunidadId" value={o.id} />
                <button type="submit" className="btn-primario">Generar mi ruta y checklist</button>
              </form>
            </>
          )}
        </section>
      </div>
    );
  }

  const tramites = o.tramites.map((t) => t.tramite);
  const pasos = construirRuta(o, tramites);
  const avancePorTramite = new Map(avances.map((a) => [a.tramiteId, a]));
  const hechos = items.filter((i) => i.completado).length;
  const pctChecklist = porcentaje(hechos, items.length);
  const tramitesHechos = avances.filter((a) => a.estado === "completado").length;
  const ordenRequisito = (i: (typeof items)[number]) => i.requisito?.orden ?? 999;
  const categorias = Object.keys(CATEGORIAS_REQUISITO).filter((c) => items.some((i) => i.categoria === c));

  return (
    <div className="space-y-6">
      {generada && (
        <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          Listo: generamos tu ruta y tu checklist. Guardamos esta oportunidad en tu panel.
        </p>
      )}
      {encabezado}

      <section aria-labelledby="titulo-avance" className="tarjeta space-y-3">
        <h2 id="titulo-avance" className="titulo-seccion">Mi avance</h2>
        <Barra valor={pctChecklist} etiqueta="Checklist de requisitos y documentos" />
        <p aria-live="polite" className="text-sm text-suave">
          Tienes {hechos} de {items.length} requisitos listos ({pctChecklist}%) y {tramitesHechos} de {avances.length} trámites completados.
        </p>
        <a href="#titulo-checklist" className="enlace text-sm lg:hidden">Ir a mi checklist</a>
        {estado === "cerrada" && (
          <p className="font-semibold text-peligro">Esta convocatoria ya cerró. Revisa otras oportunidades en el catálogo.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="titulo-pasos" className="space-y-3">
          <h2 id="titulo-pasos" className="titulo-seccion">Ruta paso a paso</h2>
          <p className="text-sm text-suave">
            Las fechas se calculan hacia atrás desde el cierre de la convocatoria ({formatearFecha(o.fechaCierre)}). Plazos y costos referenciales: verifícalos en el sitio oficial de cada entidad.
          </p>
          <ol className="space-y-3">
            {pasos.map((p) => {
              const avance = p.tramiteId ? avancePorTramite.get(p.tramiteId) : undefined;
              const completado = avance?.estado === "completado";
              return (
                <li key={p.orden}>
                  <article aria-labelledby={`paso-${p.orden}`} className={`tarjeta space-y-2 ${completado ? "border-exito" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-white ${completado ? "bg-exito" : "bg-marca"}`}>
                        {completado ? "✓" : p.orden}
                      </span>
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
                    <p className="text-sm"><AvisoFecha paso={p} hoy={hoy} completado={completado} /></p>
                    <div>
                      <h4 className="text-sm font-semibold text-suave">Documentos</h4>
                      <ul className="list-disc pl-5 text-sm">{p.documentos.map((d) => <li key={d}>{d}</li>)}</ul>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-2">
                      {avance ? (
                        <SelectorEstadoTramite avanceId={avance.id} estado={avance.estado} tramite={p.titulo} />
                      ) : <span />}
                      <a href={p.enlace} target="_blank" rel="noopener noreferrer" className="enlace text-sm">
                        {p.tipo === "postulacion" ? "Ir a la convocatoria oficial" : "Enlace de ejemplo"}
                        <span className="sr-only"> de {p.titulo} (se abre en una pestaña nueva)</span> <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="titulo-checklist" className="space-y-3">
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
