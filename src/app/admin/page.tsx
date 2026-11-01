import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerFechaSimulada, obtenerHoy } from "@/lib/hoy";
import { DIAS_VIGENCIA_FICHA } from "@/lib/catalogos";
import { aFechaCalendario, aISO, formatearFecha } from "@/lib/fechas";
import { NOTA_SATISFACCION, indicadoresFichas, indicadoresUsuarios, type Proporcion } from "@/lib/indicadores";
import { cambiarFechaSimulada, cambiarPaleta, moderarTestimonio } from "@/lib/acciones-seguimiento";
import { PALETAS, obtenerPaleta, type ClavePaleta } from "@/lib/paletas";
import { FormRestablecer } from "@/components/FormRestablecer";

export const metadata: Metadata = { title: "Tablero de indicadores" };

// Restablecer los datos recarga todo el seed: se da más tiempo a la función en Vercel.
export const maxDuration = 120;

function Indicador({ id, titulo, p, detalle, nota }: { id: string; titulo: string; p: Proporcion; detalle: string; nota?: string }) {
  return (
    <li className="tarjeta flex flex-col gap-1" aria-labelledby={id}>
      <h3 id={id} className="text-sm font-semibold">{titulo}</h3>
      <p className="text-4xl font-bold text-marca-oscura">{p.pct}%</p>
      <p className="text-sm">{p.valor} de {p.total} {detalle}</p>
      {nota && <p className="mt-auto text-xs text-suave">{nota}</p>}
    </li>
  );
}

const celda = "border-t border-borde p-2";

/** Tablero de indicadores de la matriz de formulación (RF17), con desagregación por región. */
export default async function Admin({ searchParams }: { searchParams: Promise<{ fecha?: string; paleta?: string }> }) {
  const { fecha, paleta: avisoPaleta } = await searchParams;
  const [paleta, pendientes] = await Promise.all([
    obtenerPaleta(),
    prisma.encuesta.findMany({
      where: { publicacion: "pendiente" },
      include: { usuario: { include: { perfil: true } }, oportunidad: true },
      orderBy: { creadaEn: "asc" },
    }),
  ]);
  await exigirRol(["admin"], "/admin");
  const [hoy, simulada, fichas, entidades, ciudadanos] = await Promise.all([
    obtenerHoy(),
    obtenerFechaSimulada(),
    prisma.oportunidad.findMany({ include: { requisitos: true } }),
    prisma.entidad.findMany({ orderBy: { nombre: "asc" } }),
    prisma.usuario.findMany({
      where: { rol: "ciudadano" },
      include: {
        perfil: { select: { region: true } },
        guardadas: { where: { rutaGeneradaEn: { not: null } }, select: { id: true } },
        encuestas: { select: { claridad: true, oportunidadInfo: true, utilidad: true, creadaEn: true } },
      },
    }),
  ]);
  const real = aFechaCalendario(new Date());
  const f = indicadoresFichas(fichas, hoy);
  const usuarios = indicadoresUsuarios(
    ciudadanos.map((c) => ({ region: c.perfil?.region ?? "Sin perfil", generoChecklist: c.guardadas.length > 0, encuestas: c.encuestas })),
  );
  const porEntidad = entidades
    .map((e) => ({ e, ...indicadoresFichas(fichas.filter((o) => o.entidadId === e.id), hoy) }))
    .filter((x) => x.completas.total > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-pagina">Tablero de indicadores</h1>
        {pendientes.length > 0 && (
          <p className="mt-3 rounded-lg border border-alerta bg-alerta-claro p-3 font-semibold text-alerta">
            Hay {pendientes.length} {pendientes.length === 1 ? "testimonio esperando" : "testimonios esperando"} tu aprobación.{" "}
            <a href="#testimonios" className="underline">Revisarlos</a>
          </p>
        )}
        <p className="mt-2 max-w-3xl text-suave">
          Indicadores de la matriz de formulación al {formatearFecha(hoy)}{simulada ? " (fecha simulada)" : ""}. Se calculan
          en el momento con los datos del prototipo.
        </p>
      </div>

      <section aria-labelledby="titulo-indicadores">
        <h2 id="titulo-indicadores" className="sr-only">Indicadores</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador id="ind-1" titulo="Oportunidades publicadas con ficha estándar completa" p={f.completas} detalle="fichas publicadas"
            nota="Completa: todos los campos obligatorios, cobertura si hay financiamiento y al menos un requisito." />
          <Indicador id="ind-2" titulo="Usuarios registrados que generan su checklist" p={usuarios.total.checklist} detalle="ciudadanos registrados" />
          <Indicador id="ind-3" titulo="Usuarios que califican la información como clara, oportuna y útil" p={usuarios.total.satisfechos} detalle="personas que respondieron la encuesta"
            nota={`Nota de ${NOTA_SATISFACCION} o 5 en claridad, oportunidad y utilidad (última respuesta de cada persona).`} />
          <Indicador id="ind-4" titulo="Fichas actualizadas dentro del plazo acordado" p={f.actualizadas} detalle="fichas publicadas"
            nota={`Revisadas en los últimos ${DIAS_VIGENCIA_FICHA} días.`} />
        </ul>
      </section>

      <section aria-labelledby="titulo-region" className="space-y-2">
        <h2 id="titulo-region" className="titulo-seccion">Por región del usuario</h2>
        <div role="region" aria-label="Tabla por región (se desplaza en horizontal)" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde bg-white">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Indicadores de usuarios por región de residencia</caption>
            <thead className="bg-marca-clara text-left">
              <tr>
                <th scope="col" className="p-2">Región</th>
                <th scope="col" className="p-2 text-right">Registrados</th>
                <th scope="col" className="p-2 text-right">Generan checklist</th>
                <th scope="col" className="p-2 text-right">Califican clara, oportuna y útil</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.porRegion.map((r) => (
                <tr key={r.region}>
                  <th scope="row" className={`${celda} text-left font-semibold`}>{r.region}</th>
                  <td className={`${celda} text-right`}>{r.registrados}</td>
                  <td className={`${celda} text-right`}>{r.checklist.pct}% ({r.checklist.valor} de {r.checklist.total})</td>
                  <td className={`${celda} text-right`}>{r.satisfechos.total ? `${r.satisfechos.pct}% (${r.satisfechos.valor} de ${r.satisfechos.total})` : "Sin respuestas"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="titulo-entidad" className="space-y-2">
        <h2 id="titulo-entidad" className="titulo-seccion">Fichas por entidad proveedora</h2>
        <div role="region" aria-label="Tabla por entidad (se desplaza en horizontal)" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde bg-white">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Fichas publicadas, completas y actualizadas por entidad</caption>
            <thead className="bg-marca-clara text-left">
              <tr>
                <th scope="col" className="p-2">Entidad</th>
                <th scope="col" className="p-2 text-right">Publicadas</th>
                <th scope="col" className="p-2 text-right">Completas</th>
                <th scope="col" className="p-2 text-right">Actualizadas</th>
                <th scope="col" className="p-2"><span className="sr-only">Reporte</span></th>
              </tr>
            </thead>
            <tbody>
              {porEntidad.map(({ e, completas, actualizadas }) => (
                <tr key={e.id}>
                  <th scope="row" className={`${celda} text-left font-semibold`}>{e.nombre} ({e.sigla})</th>
                  <td className={`${celda} text-right`}>{completas.total}</td>
                  <td className={`${celda} text-right`}>{completas.pct}% ({completas.valor})</td>
                  <td className={`${celda} text-right`}>{actualizadas.pct}% ({actualizadas.valor})</td>
                  <td className={celda}><Link href={`/reporte?entidad=${e.sigla}`} className="enlace">Reporte<span className="sr-only"> de {e.sigla}</span></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm"><Link href="/reporte" className="enlace">Ver la retroalimentación de las encuestas por entidad</Link></p>
      </section>

      <section aria-labelledby="titulo-fecha" className="tarjeta max-w-2xl space-y-3">
        <h2 id="titulo-fecha" className="titulo-seccion">Fecha simulada</h2>
        {fecha && (
          <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">Actualizamos la fecha del prototipo.</p>
        )}
        <p>
          Cambia la fecha «actual» de todo el prototipo para demostrar alertas de vencimiento, estados de convocatoria y
          fichas desactualizadas. Afecta a todas las personas que usan el prototipo.
        </p>
        <p className="font-semibold">
          {simulada ? <>Fecha simulada activa: {formatearFecha(simulada)}.</> : <>Se usa la fecha real: {formatearFecha(real)}.</>}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form action={cambiarFechaSimulada} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="accion" value="simular" />
            <div>
              <label htmlFor="fecha" className="etiqueta-campo">Nueva fecha</label>
              <input id="fecha" name="fecha" type="date" required defaultValue={aISO(simulada ?? real)} className="campo" />
            </div>
            <button type="submit" className="btn-primario">Usar esta fecha</button>
          </form>
          {simulada && (
            <form action={cambiarFechaSimulada}>
              <input type="hidden" name="accion" value="real" />
              <button type="submit" className="btn-secundario">Volver a la fecha real</button>
            </form>
          )}
        </div>
      </section>

      <section id="testimonios" aria-labelledby="titulo-testimonios" className="tarjeta max-w-3xl space-y-3">
        <h2 id="titulo-testimonios" className="titulo-seccion">Testimonios por aprobar ({pendientes.length})</h2>
        <p className="text-sm text-suave">
          Comentarios de la encuesta que sus autores autorizaron publicar. Al aprobarlos aparecen en la página de inicio, solo
          con la región de la persona.
        </p>
        {pendientes.length ? (
          <ul className="space-y-3">
            {pendientes.map((e) => (
              <li key={e.id} className="rounded-lg border border-borde p-3">
                <p>«{e.comentario}»</p>
                <p className="mt-1 text-xs text-suave">
                  Persona de {e.usuario.perfil?.region ?? "región no indicada"}{e.oportunidad && <> · Sobre: {e.oportunidad.nombre}</>}
                </p>
                {/* Un formulario por botón: la decisión va en un campo oculto, no en el botón que se pulsó. */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {([["aprobado", "Aprobar", "btn-primario"], ["rechazado", "Rechazar", "btn-peligro"]] as const).map(([decision, texto, clase]) => (
                    <form key={decision} action={moderarTestimonio}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="decision" value={decision} />
                      <button type="submit" className={`${clase} text-sm`} aria-label={`${texto} el testimonio: ${e.comentario.slice(0, 60)}`}>{texto}</button>
                    </form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-suave">No hay testimonios por aprobar.</p>}
      </section>

      <section id="tonalidades" aria-labelledby="titulo-tonalidades" className="tarjeta max-w-2xl space-y-3">
        <h2 id="titulo-tonalidades" className="titulo-seccion">Tonalidades de la plataforma</h2>
        {avisoPaleta && (
          <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">Actualizamos las tonalidades.</p>
        )}
        <p>Elige la paleta de colores de todo el sitio. Todas cumplen el contraste exigido por WCAG 2.1 AA.</p>
        <form action={cambiarPaleta} className="space-y-3">
          <fieldset>
            <legend className="sr-only">Paleta de colores</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(PALETAS) as ClavePaleta[]).map((k) => (
                <div key={k} className="flex min-h-11 items-center gap-3 rounded-lg border border-borde px-3 py-2">
                  <input id={`paleta-${k}`} type="radio" name="paleta" value={k} defaultChecked={k === paleta} className="h-5 w-5" />
                  <label htmlFor={`paleta-${k}`} className="flex flex-1 items-center justify-between gap-2">
                    <span>{PALETAS[k].nombre}</span>
                    <span aria-hidden="true" className="flex">
                      {[PALETAS[k].oscura, PALETAS[k].marca, PALETAS[k].clara].map((c) => (
                        <span key={c} className="h-6 w-6 border border-borde" style={{ background: c }} />
                      ))}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="btn-primario">Aplicar tonalidad</button>
        </form>
        <p className="text-sm text-suave">Restablecer los datos de prueba vuelve a la paleta predeterminada.</p>
      </section>

      <section aria-labelledby="titulo-restablecer" className="tarjeta max-w-2xl space-y-3 border-peligro">
        <h2 id="titulo-restablecer" className="titulo-seccion">Restablecer los datos de prueba</h2>
        <p>
          Borra todo lo que se hizo en el prototipo y vuelve a cargar los datos ficticios iniciales, con fechas calculadas
          desde hoy. Úsalo entre una sesión de pruebas con participantes y la siguiente. <strong>No se puede deshacer.</strong>
        </p>
        <FormRestablecer habilitado={!!process.env.CLAVE_RESTABLECER} />
      </section>
    </div>
  );
}
