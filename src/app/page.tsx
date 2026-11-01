import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { diasEntre } from "@/lib/fechas";
import { estadoConvocatoria } from "@/lib/oportunidades";
import { TarjetaOportunidad } from "@/components/oportunidad";

const ETAPAS = [
  { titulo: "Descubre", texto: "Programas y becas de varias entidades, reunidos en un solo lugar." },
  { titulo: "Revisa", texto: "Filtra por país, área, costo o financiamiento y recibe recomendaciones según tu perfil." },
  { titulo: "Compara", texto: "Pon hasta tres fichas lado a lado y mira las diferencias de un vistazo." },
  { titulo: "Prepárate", texto: "Sigue una ruta paso a paso con los trámites y un checklist de documentos." },
  { titulo: "No te pierdas nada", texto: "Recibe alertas antes de que venzan las convocatorias que guardaste." },
];

export default async function Inicio({ searchParams }: { searchParams: Promise<{ acceso?: string }> }) {
  const { acceso } = await searchParams;
  const hoy = await obtenerHoy();
  const [oportunidades, entidades] = await Promise.all([
    prisma.oportunidad.findMany({ where: { publicada: true }, include: { entidad: true } }),
    prisma.entidad.findMany({
      include: { _count: { select: { oportunidades: { where: { publicada: true } }, tramites: { where: { publicado: true } } } } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const abiertas = oportunidades.filter((o) => estadoConvocatoria(o, hoy) === "abierta");
  const destacadas = oportunidades.filter((o) => o.destacada && estadoConvocatoria(o, hoy) !== "cerrada").slice(0, 3);
  const porCerrar = abiertas
    .filter((o) => diasEntre(hoy, o.fechaCierre) <= 30)
    .sort((a, b) => a.fechaCierre.getTime() - b.fechaCierre.getTime())
    .slice(0, 6);
  const paises = new Set(oportunidades.map((o) => o.pais)).size;

  return (
    <div className="space-y-12">
      {acceso === "denegado" && (
        <p role="alert" className="rounded-lg border border-peligro bg-peligro-claro p-3 font-semibold text-peligro">
          No tienes permiso para ver esa página con tu cuenta actual.
        </p>
      )}

      <section aria-labelledby="titulo-inicio" className="rounded-2xl bg-marca-oscura px-5 py-8 text-white sm:px-10 sm:py-12">
        <h1 id="titulo-inicio" className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
          Encuentra posgrados y becas en el exterior en un solo lugar
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-white/90">
          Reunimos la información de varias entidades, te ayudamos a comparar y te guiamos en los trámites antes de postular.
        </p>
        <form action="/catalogo" role="search" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <label htmlFor="busqueda-inicio" className="sr-only">
            Buscar oportunidades
          </label>
          <input
            id="busqueda-inicio"
            name="q"
            type="search"
            placeholder="Ej.: educación, España, beca integral"
            className="min-h-12 flex-1 rounded-lg border-0 bg-white px-4 text-base text-texto placeholder:text-gray-600"
          />
          <button type="submit" className="min-h-12 rounded-lg bg-amber-400 px-6 font-bold text-gray-900 hover:bg-amber-300">
            Buscar
          </button>
        </form>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90" aria-label="Resumen del catálogo">
          <li><strong className="text-xl text-white">{oportunidades.length}</strong> oportunidades</li>
          <li><strong className="text-xl text-white">{abiertas.length}</strong> con convocatoria abierta</li>
          <li><strong className="text-xl text-white">{entidades.length}</strong> entidades proveedoras</li>
          <li><strong className="text-xl text-white">{paises}</strong> países</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalogo" className="inline-flex min-h-11 items-center rounded-lg bg-white px-5 font-bold text-marca-oscura hover:bg-marca-clara">
            Ver todo el catálogo
          </Link>
        </div>
      </section>

      <section aria-labelledby="titulo-por-cerrar">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="titulo-por-cerrar" className="titulo-seccion">Convocatorias próximas a cerrar</h2>
          <Link href="/catalogo?estado=abierta" className="enlace text-sm">Ver todas las abiertas</Link>
        </div>
        <p className="mb-4 text-suave">Abiertas que cierran en los próximos 30 días.</p>
        {porCerrar.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {porCerrar.map((o) => (
              <li key={o.id}><TarjetaOportunidad o={o} hoy={hoy} /></li>
            ))}
          </ul>
        ) : (
          <p className="tarjeta">No hay convocatorias que cierren en los próximos 30 días.</p>
        )}
      </section>

      <section aria-labelledby="titulo-destacadas">
        <h2 id="titulo-destacadas" className="titulo-seccion mb-4">Oportunidades destacadas</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destacadas.map((o) => (
            <li key={o.id}><TarjetaOportunidad o={o} hoy={hoy} /></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-como">
        <h2 id="titulo-como" className="titulo-seccion mb-4">¿Cómo te ayuda Talento sin Fronteras?</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPAS.map((e, i) => (
            <li key={e.titulo} className="tarjeta">
              <span className="text-sm font-bold text-acento">Paso {i + 1}</span>
              <h3 className="font-bold text-marca-oscura">{e.titulo}</h3>
              <p className="text-sm text-suave">{e.texto}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-suave">
          Talento sin Fronteras informa y te deriva a los canales oficiales. La postulación y los trámites se realizan ante cada entidad.
        </p>
      </section>

      <section aria-labelledby="titulo-entidades">
        <h2 id="titulo-entidades" className="titulo-seccion mb-4">Entidades que publican información</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entidades.map((e) => (
            <li key={e.id} className="tarjeta">
              <h3 className="font-bold text-marca-oscura">
                {e.nombre} <span className="text-suave">({e.sigla})</span>
              </h3>
              <p className="mt-1 text-sm text-suave">{e.descripcion}</p>
              {/* Cada entidad enlaza a lo que publica: oportunidades del catálogo y/o trámites del mapa. */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {e._count.oportunidades > 0 && (
                  <Link href={`/catalogo?entidad=${e.sigla}`} className="enlace">
                    Ver sus {e._count.oportunidades} {e._count.oportunidades === 1 ? "oportunidad" : "oportunidades"}
                    <span className="sr-only"> de {e.sigla}</span>
                  </Link>
                )}
                {e._count.tramites > 0 && (
                  <Link href={`/tramites?entidad=${e.sigla}`} className="enlace">
                    Ver sus {e._count.tramites} {e._count.tramites === 1 ? "trámite" : "trámites"}
                    <span className="sr-only"> de {e.sigla}</span>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
