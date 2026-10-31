import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { DIAS_VIGENCIA_FICHA } from "@/lib/catalogos";
import { diasEntre, formatearFecha } from "@/lib/fechas";
import { camposFaltantes, estaDesactualizada, estadoConvocatoria } from "@/lib/oportunidades";
import { alternarPublicacion, confirmarVigencia } from "@/lib/acciones-gestion";
import { EtiquetaEstado } from "@/components/oportunidad";

export const metadata: Metadata = { title: "Gestión de contenidos" };

/** Nombres legibles de los campos de la ficha estándar, para avisar qué falta. */
const NOMBRES_CAMPO: Record<string, string> = {
  tipo: "tipo", nombre: "nombre", institucion: "institución", pais: "país", ciudad: "ciudad", area: "área",
  nivel: "nivel", modalidad: "modalidad", idioma: "idioma", moneda: "moneda", financiamientoTipo: "tipo de financiamiento",
  enlaceOficial: "enlace oficial", responsableActualizacion: "responsable", duracionMeses: "duración",
  cobertura: "cobertura del financiamiento", requisitos: "requisitos",
};

function Chip({ clase, children }: { clase: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${clase}`}>{children}</span>;
}

type Aviso = { guardada?: string; publicada?: string; despublicada?: string; revisada?: string };

export default async function Gestion({ searchParams }: { searchParams: Promise<Aviso> }) {
  const aviso = await searchParams;
  const u = await exigirRol(["gestor"], "/gestion");
  const hoy = await obtenerHoy();
  const [fichas, tramites] = await Promise.all([
    prisma.oportunidad.findMany({ where: { entidadId: u.entidadId! }, include: { requisitos: true }, orderBy: { actualizadoEn: "asc" } }),
    prisma.tramite.findMany({ where: { entidadId: u.entidadId! }, orderBy: { orden: "asc" } }),
  ]);
  const mensaje =
    (aviso.guardada && `Guardamos «${aviso.guardada}».`) ||
    (aviso.publicada && `Publicamos «${aviso.publicada}» en el catálogo.`) ||
    (aviso.despublicada && `Retiramos «${aviso.despublicada}» del catálogo.`) ||
    (aviso.revisada && `Confirmamos que «${aviso.revisada}» sigue vigente.`);
  const desactualizadas = fichas.filter((o) => o.publicada && estaDesactualizada(o, hoy)).length;
  const incompletas = fichas.filter((o) => o.publicada && camposFaltantes(o).length).length;

  return (
    <div className="space-y-8">
      {mensaje && <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">{mensaje}</p>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo-pagina">Gestión de contenidos</h1>
          <p className="mt-1 text-suave">{u.entidad?.nombre} ({u.entidad?.sigla}) · {u.nombre}</p>
        </div>
        <Link href="/reporte" className="btn-secundario">Ver el reporte de mi entidad</Link>
      </div>

      <section aria-labelledby="titulo-fichas" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-fichas" className="titulo-seccion">Fichas de oportunidades ({fichas.length})</h2>
          <Link href="/gestion/oportunidades/nueva" className="btn-primario">Nueva ficha</Link>
        </div>
        <p className="text-sm text-suave">
          Una ficha se marca como desactualizada si no se revisa en {DIAS_VIGENCIA_FICHA} días.
          {(desactualizadas > 0 || incompletas > 0) && (
            <> Tienes publicadas {desactualizadas} {desactualizadas === 1 ? "ficha desactualizada" : "fichas desactualizadas"} y{" "}
              {incompletas} {incompletas === 1 ? "incompleta" : "incompletas"}.</>
          )}{" "}Primero se muestran las revisadas hace más tiempo.
        </p>
        {fichas.length ? (
          <ul className="space-y-3">
            {fichas.map((o) => {
              const faltan = camposFaltantes(o);
              const vieja = estaDesactualizada(o, hoy);
              return (
                <li key={o.id}>
                  <article aria-labelledby={`f-${o.id}`} className="tarjeta space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {o.publicada ? <Chip clase="border-exito bg-exito-claro text-exito">Publicada</Chip> : <Chip clase="border-gray-500 bg-gray-100 text-gray-700">No publicada</Chip>}
                      <EtiquetaEstado estado={estadoConvocatoria(o, hoy)} />
                      {vieja && <Chip clase="border-alerta bg-alerta-claro text-alerta">Desactualizada</Chip>}
                      {faltan.length > 0 && <Chip clase="border-peligro bg-peligro-claro text-peligro">Incompleta</Chip>}
                    </div>
                    <h3 id={`f-${o.id}`} className="font-bold text-marca-oscura">{o.nombre}</h3>
                    <p className="text-sm text-suave">
                      Última actualización: {formatearFecha(o.actualizadoEn)} (hace {diasEntre(o.actualizadoEn, hoy)} días) · {o.responsableActualizacion}
                    </p>
                    {faltan.length > 0 && (
                      <p className="text-sm font-semibold text-peligro">Falta: {faltan.map((c) => NOMBRES_CAMPO[c] ?? c).join(", ")}.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/gestion/oportunidades/${o.id}`} className="btn-secundario text-sm" aria-label={`Editar: ${o.nombre}`}>Editar</Link>
                      {vieja && (
                        <form action={confirmarVigencia}>
                          <input type="hidden" name="id" value={o.id} />
                          <button type="submit" className="btn-secundario text-sm" aria-label={`Confirmar que sigue vigente: ${o.nombre}`}>Confirmar que sigue vigente</button>
                        </form>
                      )}
                      <form action={alternarPublicacion}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className={`${o.publicada ? "btn-peligro" : "btn-secundario"} text-sm`}
                          aria-label={`${o.publicada ? "Despublicar" : "Publicar"}: ${o.nombre}`}>
                          {o.publicada ? "Despublicar" : "Publicar"}
                        </button>
                      </form>
                      {o.publicada && <Link href={`/oportunidades/${o.id}`} className="enlace self-center text-sm">Ver en el catálogo<span className="sr-only">: {o.nombre}</span></Link>}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-suave">Tu entidad todavía no publica oportunidades.</p>}
      </section>

      <section id="tramites" aria-labelledby="titulo-tramites" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-tramites" className="titulo-seccion">Trámites a cargo de mi entidad ({tramites.length})</h2>
          <Link href="/gestion/tramites/nuevo" className="btn-secundario">Nuevo trámite</Link>
        </div>
        {tramites.length ? (
          <ul className="space-y-2">
            {tramites.map((t) => (
              <li key={t.id} className="tarjeta flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{t.nombre}</strong>{!t.publicado && <span className="text-suave"> (no publicado)</span>}
                  <span className="block text-sm text-suave">Actualizado el {formatearFecha(t.actualizadoEn)}</span>
                </span>
                <Link href={`/gestion/tramites/${t.id}`} className="btn-secundario text-sm" aria-label={`Editar trámite: ${t.nombre}`}>Editar</Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-suave">Tu entidad no tiene trámites a su cargo.</p>}
      </section>
    </div>
  );
}
