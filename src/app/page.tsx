import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { diasEntre } from "@/lib/fechas";
import { estadoConvocatoria } from "@/lib/oportunidades";
import { Bell, Compass, Route, Scale, Search, SlidersHorizontal } from "lucide-react";
import { TarjetaOportunidad } from "@/components/oportunidad";
import { IlustracionInicio } from "@/components/IlustracionInicio";
import { AsistenteBusqueda } from "@/components/AsistenteBusqueda";
import { AREAS } from "@/lib/catalogos";
import { obtenerTestimonios } from "@/lib/testimonios";

const ETAPAS = [
  { titulo: "Descubre", texto: "Programas y becas de varias entidades, reunidos en un solo lugar.", Icono: Compass },
  { titulo: "Revisa", texto: "Filtra por país, área, costo o financiamiento y recibe recomendaciones según tu perfil.", Icono: SlidersHorizontal },
  { titulo: "Compara", texto: "Pon hasta tres fichas lado a lado y mira las diferencias de un vistazo.", Icono: Scale },
  { titulo: "Prepárate", texto: "Sigue una ruta paso a paso con los trámites y un checklist de documentos.", Icono: Route },
  { titulo: "No te pierdas nada", texto: "Recibe alertas antes de que venzan las convocatorias que guardaste.", Icono: Bell },
];

export default async function Inicio({ searchParams }: { searchParams: Promise<{ acceso?: string }> }) {
  const { acceso } = await searchParams;
  const hoy = await obtenerHoy();
  const [oportunidades, entidades, testimonios] = await Promise.all([
    prisma.oportunidad.findMany({ where: { publicada: true }, include: { entidad: true } }),
    prisma.entidad.findMany({
      include: { _count: { select: { oportunidades: { where: { publicada: true } }, tramites: { where: { publicado: true } } } } },
      orderBy: { nombre: "asc" },
    }),
    obtenerTestimonios(3),
  ]);

  const abiertas = oportunidades.filter((o) => estadoConvocatoria(o, hoy) === "abierta");
  const destacadas = oportunidades.filter((o) => o.destacada && estadoConvocatoria(o, hoy) !== "cerrada").slice(0, 3);
  const porCerrar = abiertas
    .filter((o) => diasEntre(hoy, o.fechaCierre) <= 30)
    .sort((a, b) => a.fechaCierre.getTime() - b.fechaCierre.getTime())
    .slice(0, 6);
  const listaPaises = [...new Set(oportunidades.map((o) => o.pais))].sort((a, b) => a.localeCompare(b, "es"));
  const paises = listaPaises.length;

  return (
    <div className="space-y-12">
      {acceso === "denegado" && (
        <p role="alert" className="rounded-lg border border-peligro bg-peligro-claro p-3 font-semibold text-peligro">
          No tienes permiso para ver esa página con tu cuenta actual.
        </p>
      )}

      <section aria-labelledby="titulo-inicio" className="overflow-hidden rounded-[var(--radius-panel)] bg-marca-oscura text-white">
        <div className="grid items-center gap-6 px-5 pb-6 pt-8 sm:px-10 sm:pt-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <h1 id="titulo-inicio" className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Encuentra posgrados y becas en el exterior en un solo lugar
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-white/90">
              Reunimos la información de varias entidades, te ayudamos a comparar y te guiamos en los trámites antes de postular.
            </p>
            <form action="/catalogo" role="search" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
              <label htmlFor="busqueda-inicio" className="sr-only">Buscar oportunidades</label>
              <input id="busqueda-inicio" name="q" type="search" placeholder="Ej.: educación, España, beca integral"
                className="min-h-12 flex-1 rounded-[var(--radius-control)] border-0 bg-white px-4 text-base text-texto placeholder:text-gray-600" />
              <button type="submit" className="btn-primario min-h-12 px-6">
                <Search aria-hidden="true" className="h-5 w-5" /> Buscar
              </button>
            </form>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90" aria-label="Resumen del catálogo">
              <li><strong className="text-xl text-white">{oportunidades.length}</strong> oportunidades</li>
              <li><strong className="text-xl text-white">{abiertas.length}</strong> con convocatoria abierta</li>
              <li><strong className="text-xl text-white">{entidades.length}</strong> entidades proveedoras</li>
              <li><strong className="text-xl text-white">{paises}</strong> países</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <IlustracionInicio />
          </div>
        </div>
        <div className="px-3 pb-3 sm:px-6 sm:pb-6">
          <AsistenteBusqueda areas={AREAS} paises={listaPaises} />
          <p className="mt-3 text-center">
            <Link href="/catalogo" className="inline-flex min-h-11 items-center font-bold text-white underline">Ver todo el catálogo</Link>
          </p>
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
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-acento-claro text-acento">
                <e.Icono aria-hidden="true" className="h-6 w-6" />
              </span>
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

      <section aria-labelledby="titulo-testimonios">
        <h2 id="titulo-testimonios" className="titulo-seccion">Experiencias</h2>
        <p className="mb-4 mt-1 text-sm text-suave">
          Los testimonios reales vienen de la encuesta, con autorización de sus autores, y se publican después de que el equipo los revisa.
        </p>
        <ul className="grid gap-4 md:grid-cols-3">
          {testimonios.map((x, i) => (
            <li key={i}>
              <figure className="tarjeta flex h-full flex-col gap-3">
                <blockquote className="text-lg leading-snug">«{x.texto}»</blockquote>
                <figcaption className="mt-auto text-sm">
                  <span className="font-semibold">{x.quien}</span>
                  {x.sobre && <span className="block text-suave">Sobre: {x.sobre}</span>}
                  <span className={`mt-1 block text-xs ${x.ilustrativo ? "text-alerta" : "text-exito"}`}>
                    {x.ilustrativo
                      ? "Testimonio ilustrativo: personaje del prototipo, no es una persona real."
                      : "Testimonio real, publicado con autorización."}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
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
