// Resumen fijo de la ficha (D62): fecha de cierre, «Pagarías aprox.», semáforo
// «¿Llego a tiempo?» y la acción principal. Columna derecha en escritorio; en el
// celular va arriba del detalle y, además, una barra inferior fija con lo esencial.
import Link from "next/link";
import { CalendarClock, CircleAlert, CircleCheck, TriangleAlert, Wallet } from "lucide-react";
import type { Entidad, Oportunidad } from "@prisma/client";
import type { Llegada } from "@/lib/llegada";
import { formatearFecha, formatearFechaCorta } from "@/lib/fechas";
import { soles } from "@/lib/tramites";
import { Bandera } from "./Bandera";
import { EtiquetaUrgencia } from "./oportunidad";

const ESTILO = {
  verde: { caja: "border-exito bg-exito-claro text-exito", Icono: CircleCheck },
  ambar: { caja: "border-alerta bg-alerta-claro text-alerta", Icono: TriangleAlert },
  rojo: { caja: "border-peligro bg-peligro-claro text-peligro", Icono: CircleAlert },
} as const;

export function Semaforo({ llegada }: { llegada: Llegada }) {
  const { caja, Icono } = ESTILO[llegada.nivel];
  return (
    <div className={`rounded-[var(--radius-tarjeta)] border-2 p-3 ${caja}`}>
      <p className="text-xs font-bold uppercase tracking-wide">¿Llego a tiempo?</p>
      <p className="mt-1 inline-flex items-start gap-2 text-lg font-bold leading-snug">
        <Icono aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />{llegada.titulo}
      </p>
      <p className="mt-1 text-sm text-texto">{llegada.detalle}</p>
    </div>
  );
}

type Similar = Oportunidad & { entidad: Entidad };

export function ResumenFicha({ o, hoy, pagarias, integral, llegada, similares, accion }: {
  o: Oportunidad; hoy: Date; pagarias: number; integral: boolean; llegada: Llegada | null;
  similares: Similar[]; accion: React.ReactNode;
}) {
  return (
    <aside aria-labelledby="titulo-resumen" className="tarjeta space-y-4 lg:sticky lg:top-24">
      <h2 id="titulo-resumen" className="sr-only">Resumen</h2>
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="inline-flex items-center gap-1 text-xs text-suave"><CalendarClock aria-hidden="true" className="h-4 w-4" />Cierre</dt>
          <dd className="font-bold">{formatearFecha(o.fechaCierre)}</dd>
          <dd className="mt-1"><EtiquetaUrgencia o={o} hoy={hoy} /></dd>
        </div>
        <div>
          <dt className="inline-flex items-center gap-1 text-xs text-suave"><Wallet aria-hidden="true" className="h-4 w-4" />Pagarías aprox.</dt>
          <dd className="font-bold">{integral ? <span className="text-exito">S/ 0 en matrícula</span> : soles(pagarias)}</dd>
          <dd className="text-xs text-meta">Costo total menos la cobertura, en soles referenciales</dd>
        </div>
      </dl>
      {llegada && <Semaforo llegada={llegada} />}
      {similares.length > 0 && (
        <div>
          <h3 className="text-sm font-bold">{llegada ? "Oportunidades similares que cierran después" : "Oportunidades similares vigentes"}</h3>
          <ul className="mt-2 space-y-2">
            {similares.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-control)] border border-borde p-2 text-sm">
                <Link href={`/oportunidades/${s.id}`} className="enlace">{s.nombre}</Link>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-suave">
                  <Bandera pais={s.pais} /> {s.pais} · cierra el {formatearFechaCorta(s.fechaCierre)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {accion}
    </aside>
  );
}

/** Barra inferior fija en el celular con lo esencial y la acción principal. */
export function BarraFicha({ o, hoy, llegada, accion }: { o: Oportunidad; hoy: Date; llegada: Llegada | null; accion: React.ReactNode }) {
  const color = llegada ? { verde: "text-exito", ambar: "text-alerta", rojo: "text-peligro" }[llegada.nivel] : "text-suave";
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-white px-4 py-2 shadow-[var(--shadow-panel)] lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="min-w-0 text-sm leading-tight">
          <span className="block font-bold">Cierra el {formatearFechaCorta(o.fechaCierre)}</span>
          {llegada && <span className={`block truncate font-bold ${color}`}>{llegada.titulo}</span>}
          {!llegada && <span className="block text-suave"><EtiquetaUrgencia o={o} hoy={hoy} /></span>}
        </p>
        <div className="shrink-0">{accion}</div>
      </div>
    </div>
  );
}
