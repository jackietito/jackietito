import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatearMonto } from "@/lib/oportunidades";

export const metadata: Metadata = { title: "Mapa de trámites" };

/** Mapa de trámites nacionales (RF10): entidades responsables reales; plazos y costos ilustrativos (D36). */
export default async function MapaTramites({ searchParams }: { searchParams: Promise<{ entidad?: string }> }) {
  const { entidad: sigla } = await searchParams;
  const entidad = sigla ? await prisma.entidad.findUnique({ where: { sigla } }) : null;
  const tramites = await prisma.tramite.findMany({
    where: { publicado: true, ...(entidad ? { entidadId: entidad.id } : {}) },
    orderBy: { orden: "asc" },
    include: { entidad: true, _count: { select: { oportunidades: { where: { oportunidad: { publicada: true } } } } } },
  });
  const total = tramites.reduce((s, t) => s + t.costoReferencial, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Mapa de trámites</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Trámites que normalmente debes hacer en el Perú antes de postular a un posgrado en el exterior, en el orden
          sugerido. No todos aplican a todas las convocatorias: la ruta de cada oportunidad incluye solo los que necesitas.
        </p>
        <p className="mt-2 max-w-3xl rounded-lg border border-alerta bg-alerta-claro p-3 text-alerta">
          Las entidades responsables son reales, pero los plazos y costos de esta página son{" "}
          <strong>ilustrativos y no oficiales</strong>: es un prototipo académico. Antes de hacer un trámite, consulta el
          sitio oficial de cada entidad. Talento sin Fronteras no realiza trámites.
        </p>
      </div>

      {entidad && (
        <p role="status" className="flex flex-wrap items-center gap-2">
          <span>Trámites cuya información publica <strong>{entidad.nombre} ({entidad.sigla})</strong>.</span>
          <Link href="/tramites" className="enlace">Ver todos los trámites</Link>
        </p>
      )}

      <ol className="space-y-4">
        {tramites.map((t, i) => (
          <li key={t.id}>
            <article className="tarjeta space-y-3" aria-labelledby={`tramite-${t.id}`}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marca font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h2 id={`tramite-${t.id}`} className="text-lg font-bold text-marca-oscura">
                    <span className="sr-only">Paso {i + 1}: </span>{t.nombre}
                  </h2>
                  <p className="text-sm text-suave">Ante: {t.entidadResponsable}</p>
                </div>
              </div>
              <p>{t.descripcion}</p>
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                <div><dt className="font-semibold text-suave">Plazo ilustrativo</dt><dd>{t.plazoDias} días</dd></div>
                <div><dt className="font-semibold text-suave">Costo ilustrativo</dt><dd>{formatearMonto(t.costoReferencial, "PEN")}</dd></div>
                <div><dt className="font-semibold text-suave">Cuándo empezar</dt><dd>{t.anticipacionDias} días antes del cierre</dd></div>
              </dl>
              <div>
                <h3 className="text-sm font-semibold text-suave">Documentos que necesitas</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {t.documentos.split("\n").filter(Boolean).map((d) => <li key={d}>{d}</li>)}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-3 text-sm">
                <span className="text-suave">
                  Lo piden {t._count.oportunidades} {t._count.oportunidades === 1 ? "oportunidad" : "oportunidades"} del catálogo
                </span>
                <a href={t.enlaceOficial} target="_blank" rel="noopener noreferrer" className="enlace">
                  Enlace de ejemplo<span className="sr-only"> de {t.nombre} (se abre en una pestaña nueva)</span> <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          </li>
        ))}
      </ol>
      <p className="text-sm text-suave">
        Si hicieras todos los trámites, el costo ilustrativo sumaría {formatearMonto(total, "PEN")}. Para ver los de una
        oportunidad concreta, abre su ficha en el <Link href="/catalogo" className="enlace">catálogo</Link> y pulsa
        «Preparar mi postulación».
      </p>
    </div>
  );
}
