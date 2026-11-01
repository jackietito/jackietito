import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import {
  CATEGORIAS_REQUISITO,
  DIAS_VIGENCIA_FICHA,
  FINANCIAMIENTOS,
  MODALIDADES,
  NIVELES,
  TIPOS,
  etiqueta,
} from "@/lib/catalogos";
import { formatearFecha } from "@/lib/fechas";
import { textoCosto, textoPlazo as plazoTramite, tramitesDeLaRuta } from "@/lib/tramites";
import {
  coberturaCorta,
  costoTotal,
  costoTotalUsd,
  estaDesactualizada,
  estadoConvocatoria,
  formatearMonto,
  pagariasPen,
} from "@/lib/oportunidades";
import { AvisoDesactualizada, DatosClave, EtiquetaEstado } from "@/components/oportunidad";
import { Bandera } from "@/components/Bandera";
import { Pestanas } from "@/components/Pestanas";
import { BarraFicha, ResumenFicha } from "@/components/ResumenFicha";
import { llegoATiempo, similaresQueCierranDespues } from "@/lib/llegada";
import { idiomasAcreditados } from "@/lib/recomendaciones";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";
import { contextoAcciones } from "@/lib/contexto";
import { Compartir } from "@/components/Compartir";

type Params = { params: Promise<{ id: string }> };

async function cargar(id: string) {
  return prisma.oportunidad.findFirst({
    where: { id, publicada: true },
    include: {
      entidad: true,
      requisitos: { orderBy: { orden: "asc" } },
      tramites: { where: { tramite: { publicado: true } }, include: { tramite: true } },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const o = await cargar((await params).id);
  return { title: o?.nombre ?? "Oportunidad no encontrada" };
}

function Seccion({ titulo, children, nivel = 2 }: { titulo: string; children: React.ReactNode; nivel?: 2 | 3 }) {
  const id = `sec-${titulo.toLowerCase().normalize("NFD").replace(/[^a-z]+/g, "-")}`;
  const H = nivel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={id} className="tarjeta">
      <H id={id} className={nivel === 2 ? "titulo-seccion mb-3" : "mb-3 text-lg font-bold text-marca-oscura"}>{titulo}</H>
      {children}
    </section>
  );
}

function Datos({ filas }: { filas: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[14rem_1fr]">
      {filas.map(([t, v]) => (
        <div key={t} className="contents">
          <dt className="font-semibold text-suave">{t}</dt>
          <dd className="mb-2 sm:mb-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function FichaOportunidad({ params }: Params) {
  const o = await cargar((await params).id);
  if (!o) notFound();
  const [hoy, ctx, h] = await Promise.all([obtenerHoy(), contextoAcciones(), headers()]);
  // Enlace absoluto para compartir, con el dominio por el que se entró.
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const enlace = `${protocolo}://${host}/oportunidades/${o.id}`;
  const estado = estadoConvocatoria(o, hoy);
  const m = (n: number) => formatearMonto(n, o.moneda);
  const tramites = o.tramites.map((t) => t.tramite).sort((a, b) => a.orden - b.orden);
  const categorias = Object.keys(CATEGORIAS_REQUISITO).filter((c) => o.requisitos.some((r) => r.categoria === c));

  // Semáforo «¿Llego a tiempo?» (D61): con sesión, descuenta lo ya completado y el
  // examen de un idioma que la persona acredita.
  const esCiudadano = ctx.rol === "ciudadano";
  const completados = esCiudadano
    ? new Set((await prisma.avanceTramite.findMany({ where: { usuarioId: ctx.usuario!.id, oportunidadId: o.id, estado: "completado" } })).map((a) => a.tramiteId))
    : new Set<string>();
  const tramitesRuta = tramitesDeLaRuta(tramites, o.idioma, esCiudadano ? idiomasAcreditados(ctx.usuario!.perfil) : []);
  const llegada = llegoATiempo(o, tramitesRuta, hoy, completados);
  const necesitaAlternativas = !llegada || llegada.nivel === "rojo";
  const similares = necesitaAlternativas
    ? similaresQueCierranDespues(o, await prisma.oportunidad.findMany({ where: { publicada: true }, include: { entidad: true } }), hoy)
    : [];
  const pagarias = pagariasPen(o);
  const integral = o.financiamientoTipo === "integral";
  const puedePreparar = estado !== "cerrada" && ctx.rol !== "gestor" && ctx.rol !== "orientador" && ctx.rol !== "admin";
  const preparar = (clase: string) =>
    puedePreparar ? <Link href={`/ruta/${o.id}`} prefetch={false} className={`btn-primario ${clase}`}>Preparar mi postulación</Link> : null;
  const cobertura = coberturaCorta(o);

  return (
    <article className="space-y-6 pb-28 lg:pb-0" aria-labelledby="titulo-ficha">
      <nav aria-label="Ruta de navegación" className="text-sm">
        <Link href="/catalogo" className="enlace">← Volver al catálogo</Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 font-bold"><Bandera pais={o.pais} />{o.pais} <span className="font-normal text-meta">· {o.ciudad}</span></span>
          <span className="text-sm font-bold uppercase tracking-wide text-suave">· {etiqueta(TIPOS, o.tipo)}</span>
          {estaDesactualizada(o, hoy) && <AvisoDesactualizada />}
        </div>
        <h1 id="titulo-ficha" className="titulo-pagina">{o.nombre}</h1>
        <p className="text-lg text-suave">{o.institucion}</p>
        <DatosClave o={o} />
        <p className="max-w-3xl">{o.descripcion}</p>
        <div className="flex max-w-xl flex-col gap-3">
          <AccionesOportunidad id={o.id} nombre={o.nombre} rol={ctx.rol} guardada={ctx.guardadas.has(o.id)}
            enComparador={ctx.comparar.has(o.id)} volver={`/oportunidades/${o.id}`} />
          <Compartir url={enlace} titulo={o.nombre} />
        </div>
      </header>

      {estaDesactualizada(o, hoy) && (
        <p className="rounded-lg border border-alerta bg-alerta-claro p-3 text-alerta">
          Esta ficha no se revisa hace más de {DIAS_VIGENCIA_FICHA} días. Confirma los datos en el enlace oficial antes de decidir.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="lg:order-2">
          <ResumenFicha o={o} hoy={hoy} pagarias={pagarias} integral={integral} llegada={llegada} similares={similares}
            accion={
              <div className="flex flex-col gap-2">
                {preparar("w-full")}
                {estado === "cerrada" && <p className="font-bold text-suave">Esta convocatoria ya cerró: mira las similares.</p>}
                <a href={o.enlaceOficial} target="_blank" rel="noopener noreferrer" className="btn-secundario w-full">
                  Ir a la convocatoria oficial<span className="sr-only"> (se abre en una pestaña nueva)</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <p className="text-xs text-meta">En el prototipo, los enlaces oficiales son enlaces de ejemplo.</p>
              </div>
            } />
        </div>

        <div className="min-w-0 space-y-6 lg:order-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Seccion titulo="Datos académicos">
              <Datos filas={[
                ["Área de estudio", o.area],
                ["Nivel", etiqueta(NIVELES, o.nivel)],
                ["Modalidad", etiqueta(MODALIDADES, o.modalidad)],
                ["Idioma", o.idioma],
                ["Duración", `${o.duracionMeses} meses`],
                ["Inicio de clases", formatearFecha(o.fechaInicio)],
              ]} />
            </Seccion>
            <Seccion titulo="Convocatoria">
              <Datos filas={[
                ["Estado", <EtiquetaEstado key="e" estado={estado} />],
                ["Apertura", formatearFecha(o.fechaApertura)],
                ["Cierre", formatearFecha(o.fechaCierre)],
              ]} />
            </Seccion>
          </div>

          <Pestanas etiqueta="Detalle de la oportunidad" pestanas={[
            {
              id: "requisitos", titulo: "Requisitos",
              contenido: (
                <Seccion titulo="Requisitos" nivel={3}>
                  <div className="grid gap-4 md:grid-cols-3">
                    {categorias.map((c) => (
                      <div key={c}>
                        <h4 className="mb-2 font-bold">{etiqueta(CATEGORIAS_REQUISITO, c)}</h4>
                        <ul className="list-disc space-y-1 pl-5">
                          {o.requisitos.filter((r) => r.categoria === c).map((r) => <li key={r.id}>{r.descripcion}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Seccion>
              ),
            },
            {
              id: "costos", titulo: "Costos y financiamiento",
              contenido: (
                <div className="space-y-4">
                  <Seccion titulo="Costos" nivel={3}>
                    <Datos filas={[
                      ["Matrícula (programa completo)", m(o.costoMatricula)],
                      ["Costo de vida mensual estimado", o.costoVidaMensual ? m(o.costoVidaMensual) : "No aplica (virtual)"],
                      ["Otros costos", <>{m(o.otrosCostos)}<span className="block text-sm text-suave">{o.otrosCostosDetalle}</span></>],
                      ["Moneda", o.moneda],
                      ["Costo total estimado", <strong key="t">
                        {m(costoTotal(o))}
                        {o.moneda !== "USD" && <span className="block text-sm font-normal text-suave">≈ {formatearMonto(costoTotalUsd(o), "USD")} (tipo de cambio referencial)</span>}
                      </strong>],
                    ]} />
                    <p className="mt-3 text-sm text-suave">Total = matrícula + costo de vida × {o.duracionMeses} meses + otros costos.</p>
                  </Seccion>
                  <Seccion titulo="Financiamiento" nivel={3}>
                    <Datos filas={[
                      ["Tipo", etiqueta(FINANCIAMIENTOS, o.financiamientoTipo)],
                      ["En pocas palabras", `${cobertura.rotulo === "Financiamiento" ? "" : `${cobertura.rotulo}: `}${cobertura.valor}`],
                      ["Cobertura", o.cobertura || "—"],
                      ["Entidad que financia", o.entidadFinanciadora || "—"],
                      ["Pagarías aprox.", integral ? "S/ 0 en matrícula" : `${formatearMonto(pagarias, "PEN")} (costo total menos la cobertura, en soles referenciales)`],
                    ]} />
                  </Seccion>
                </div>
              ),
            },
            {
              id: "tramites", titulo: "Trámites",
              contenido: (
                <Seccion titulo="Trámites nacionales asociados" nivel={3}>
                  <p className="mb-3 text-suave">
                    Trámites que normalmente debes hacer en el Perú antes de postular. Plazos y costos referenciales: verifícalos en el sitio oficial de cada entidad.{" "}
                    <Link href="/tramites" className="enlace">Ver el mapa de trámites completo</Link>
                  </p>
                  <ol className="space-y-3">
                    {tramites.map((t) => (
                      <li key={t.id} className="rounded-lg border border-borde p-3">
                        <p className="font-bold">{t.nombre}</p>
                        <p className="text-sm text-suave">
                          Ante: {t.entidadResponsable} · Plazo referencial: {plazoTramite(t)} · Costo referencial: {textoCosto(t)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Seccion>
              ),
            },
            {
              id: "fuente", titulo: "Fuente",
              contenido: (
                <Seccion titulo="Fuente y actualización" nivel={3}>
                  <Datos filas={[
                    ["Entidad proveedora", <span key="e">
                      {o.entidad.nombre} ({o.entidad.sigla})
                      <span className="block text-sm text-suave">Ficha de ejemplo con datos ficticios: no es una convocatoria real de esta entidad.</span>
                    </span>],
                    ["Última actualización", formatearFecha(o.actualizadoEn)],
                    ["Responsable de la actualización", o.responsableActualizacion],
                    ["Enlace oficial", <a key="l" href={o.enlaceOficial} target="_blank" rel="noopener noreferrer" className="enlace break-all">
                      {o.enlaceOficial}<span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>],
                  ]} />
                </Seccion>
              ),
            },
          ]} />
        </div>
      </div>

      <BarraFicha o={o} hoy={hoy} llegada={llegada} accion={preparar("px-3")} />
    </article>
  );
}
