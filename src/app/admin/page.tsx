import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { obtenerFechaSimulada } from "@/lib/hoy";
import { aFechaCalendario, aISO, formatearFecha } from "@/lib/fechas";
import { cambiarFechaSimulada } from "@/lib/acciones-seguimiento";

export const metadata: Metadata = { title: "Administración" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha } = await searchParams;
  const u = await exigirRol(["admin"], "/admin");
  const simulada = await obtenerFechaSimulada();
  const real = aFechaCalendario(new Date());

  return (
    <div className="space-y-6">
      <h1 className="titulo-pagina">Tablero de indicadores</h1>
      <p>Hola, {u.nombre ?? u.email}{u.entidad ? ` (${u.entidad.nombre})` : ""}.</p>

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
        <form action={cambiarFechaSimulada} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="fecha" className="etiqueta-campo">Nueva fecha</label>
            <input id="fecha" name="fecha" type="date" required defaultValue={aISO(simulada ?? real)} className="campo" />
          </div>
          <button type="submit" name="accion" value="simular" className="btn-primario">Usar esta fecha</button>
          {simulada && <button type="submit" name="accion" value="real" formNoValidate className="btn-secundario">Volver a la fecha real</button>}
        </form>
      </section>

      <div className="tarjeta max-w-2xl space-y-2">
        <p>El tablero de indicadores y el reporte por entidad se habilitan en el incremento 5 del prototipo.</p>
        <p>Mientras tanto, puedes revisar el <Link href="/catalogo" className="enlace">catálogo de oportunidades</Link>.</p>
      </div>
    </div>
  );
}
