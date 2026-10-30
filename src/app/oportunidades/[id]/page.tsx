import type { Metadata } from "next";
import Link from "next/link";
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
import {
  costoTotal,
  costoTotalUsd,
  estaDesactualizada,
  estadoConvocatoria,
  formatearMonto,
} from "@/lib/oportunidades";
import { AvisoDesactualizada, EtiquetaEstado, textoPlazo } from "@/components/oportunidad";

type Params = { params: Promise<{ id: string }> };

async function cargar(id: string) {
  return prisma.oportunidad.findFirst({
    where: { id, publicada: true },
    include: {
      entidad: true,
      requisitos: { orderBy: { orden: "asc" } },
      tramites: { include: { tramite: true } },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const o = await cargar((await params).id);
  return { title: o?.nombre ?? "Oportunidad no encontrada" };
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const id = `sec-${titulo.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="tarjeta">
      <h2 id={id} className="titulo-seccion mb-3">{titulo}</h2>
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
  const hoy = await obtenerHoy();
  const estado = estadoConvocatoria(o, hoy);
  const m = (n: number) => formatearMonto(n, o.moneda);
  const tramites = o.tramites.map((t) => t.tramite).sort((a, b) => a.orden - b.orden);
  const categorias = Object.keys(CATEGORIAS_REQUISITO).filter((c) => o.requisitos.some((r) => r.categoria === c));

  return (
    <article className="space-y-6" aria-labelledby="titulo-ficha">
      <nav aria-label="Ruta de navegación" className="text-sm">
        <Link href="/catalogo" className="enlace">← Volver al catálogo</Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaEstado estado={estado} />
          <span className="text-sm font-semibold uppercase tracking-wide text-suave">{etiqueta(TIPOS, o.tipo)}</span>
          {estaDesactualizada(o, hoy) && <AvisoDesactualizada />}
        </div>
        <h1 id="titulo-ficha" className="titulo-pagina">{o.nombre}</h1>
        <p className="text-lg text-suave">{o.institucion} · {o.ciudad}, {o.pais}</p>
        <p className={`text-lg font-bold ${estado === "abierta" ? "text-peligro" : "text-texto"}`}>{textoPlazo(o, hoy)}</p>
        <p className="max-w-3xl">{o.descripcion}</p>
        <div className="flex flex-wrap gap-3">
          <a href={o.enlaceOficial} target="_blank" rel="noopener noreferrer" className="btn-primario">
            Ir a la convocatoria oficial
            <span className="sr-only">(se abre en una pestaña nueva)</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="text-xs text-suave">En el prototipo, los enlaces oficiales son enlaces de ejemplo.</p>
      </header>

      {estaDesactualizada(o, hoy) && (
        <p className="rounded-lg border border-alerta bg-alerta-claro p-3 text-alerta">
          Esta ficha no se revisa hace más de {DIAS_VIGENCIA_FICHA} días. Confirma los datos en el enlace oficial antes de decidir.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Seccion titulo="Datos académicos">
          <Datos
            filas={[
              ["Área de estudio", o.area],
              ["Nivel", etiqueta(NIVELES, o.nivel)],
              ["Modalidad", etiqueta(MODALIDADES, o.modalidad)],
              ["Idioma", o.idioma],
              ["Duración", `${o.duracionMeses} meses`],
              ["Inicio de clases", formatearFecha(o.fechaInicio)],
            ]}
          />
        </Seccion>

        <Seccion titulo="Convocatoria">
          <Datos
            filas={[
              ["Estado", <EtiquetaEstado key="e" estado={estado} />],
              ["Apertura", formatearFecha(o.fechaApertura)],
              ["Cierre", formatearFecha(o.fechaCierre)],
            ]}
          />
        </Seccion>

        <Seccion titulo="Costos">
          <Datos
            filas={[
              ["Matrícula (programa completo)", m(o.costoMatricula)],
              ["Costo de vida mensual estimado", o.costoVidaMensual ? m(o.costoVidaMensual) : "No aplica (virtual)"],
              ["Otros costos", <>{m(o.otrosCostos)}<span className="block text-sm text-suave">{o.otrosCostosDetalle}</span></>],
              ["Moneda", o.moneda],
              [
                "Costo total estimado",
                <strong key="t">
                  {m(costoTotal(o))}
                  {o.moneda !== "USD" && <span className="block text-sm font-normal text-suave">≈ {formatearMonto(costoTotalUsd(o), "USD")} (tipo de cambio referencial)</span>}
                </strong>,
              ],
            ]}
          />
          <p className="mt-3 text-sm text-suave">Total = matrícula + costo de vida × {o.duracionMeses} meses + otros costos.</p>
        </Seccion>

        <Seccion titulo="Financiamiento">
          <Datos
            filas={[
              ["Tipo", etiqueta(FINANCIAMIENTOS, o.financiamientoTipo)],
              ["Cobertura", o.cobertura || "—"],
              ["Entidad que financia", o.entidadFinanciadora || "—"],
            ]}
          />
        </Seccion>
      </div>

      <Seccion titulo="Requisitos">
        <div className="grid gap-4 md:grid-cols-3">
          {categorias.map((c) => (
            <div key={c}>
              <h3 className="mb-2 font-bold">{etiqueta(CATEGORIAS_REQUISITO, c)}</h3>
              <ul className="list-disc space-y-1 pl-5">
                {o.requisitos.filter((r) => r.categoria === c).map((r) => (
                  <li key={r.id}>{r.descripcion}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Trámites nacionales asociados">
        <p className="mb-3 text-suave">Trámites que normalmente debes hacer en el Perú antes de postular. Plazos y costos referenciales.</p>
        <ol className="space-y-3">
          {tramites.map((t) => (
            <li key={t.id} className="rounded-lg border border-borde p-3">
              <p className="font-bold">{t.nombre}</p>
              <p className="text-sm text-suave">
                Ante: {t.entidadResponsable} · Plazo referencial: {t.plazoDias} días · Costo referencial: {formatearMonto(t.costoReferencial, "PEN")}
              </p>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion titulo="Fuente y actualización">
        <Datos
          filas={[
            ["Entidad proveedora", `${o.entidad.nombre} (${o.entidad.sigla})`],
            ["Última actualización", formatearFecha(o.actualizadoEn)],
            ["Responsable de la actualización", o.responsableActualizacion],
            [
              "Enlace oficial",
              <a key="l" href={o.enlaceOficial} target="_blank" rel="noopener noreferrer" className="enlace break-all">
                {o.enlaceOficial}<span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>,
            ],
          ]}
        />
      </Seccion>
    </article>
  );
}
