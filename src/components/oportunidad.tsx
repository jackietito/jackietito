// Piezas de interfaz reutilizables para mostrar oportunidades.
import Link from "next/link";
import type { Entidad, Oportunidad } from "@prisma/client";
import { FINANCIAMIENTOS, MODALIDADES, NIVELES, TIPOS, etiqueta } from "@/lib/catalogos";
import { diasEntre, formatearFechaCorta, textoDias } from "@/lib/fechas";
import {
  costoTotal,
  costoTotalUsd,
  estaDesactualizada,
  estadoConvocatoria,
  formatearMonto,
  type EstadoConvocatoria,
} from "@/lib/oportunidades";

const ESTILO_ESTADO: Record<EstadoConvocatoria, string> = {
  abierta: "bg-exito-claro text-exito border-exito",
  proxima: "bg-marca-clara text-marca-oscura border-marca",
  cerrada: "bg-gray-100 text-gray-700 border-gray-500",
};

const TEXTO_ESTADO: Record<EstadoConvocatoria, string> = {
  abierta: "Convocatoria abierta",
  proxima: "Próxima a abrir",
  cerrada: "Convocatoria cerrada",
};

export function EtiquetaEstado({ estado }: { estado: EstadoConvocatoria }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${ESTILO_ESTADO[estado]}`}>
      {TEXTO_ESTADO[estado]}
    </span>
  );
}

/** Texto del plazo según el estado: cuántos días faltan para el cierre o la apertura. */
export function textoPlazo(o: Pick<Oportunidad, "fechaApertura" | "fechaCierre">, hoy: Date): string {
  const estado = estadoConvocatoria(o, hoy);
  if (estado === "proxima") return `Abre ${textoDias(diasEntre(hoy, o.fechaApertura))} (${formatearFechaCorta(o.fechaApertura)})`;
  if (estado === "cerrada") return `Cerró el ${formatearFechaCorta(o.fechaCierre)}`;
  return `Cierra ${textoDias(diasEntre(hoy, o.fechaCierre))} (${formatearFechaCorta(o.fechaCierre)})`;
}

export function AvisoDesactualizada() {
  return (
    <span className="inline-flex items-center rounded-full border border-alerta bg-alerta-claro px-2.5 py-0.5 text-xs font-bold text-alerta">
      Ficha sin revisión reciente
    </span>
  );
}

type Props = {
  o: Oportunidad & { entidad: Entidad };
  hoy: Date;
  /** Contenido adicional (p. ej. criterios coincidentes o acciones) */
  children?: React.ReactNode;
  nivelTitulo?: "h2" | "h3";
};

export function TarjetaOportunidad({ o, hoy, children, nivelTitulo = "h3" }: Props) {
  const estado = estadoConvocatoria(o, hoy);
  const dias = diasEntre(hoy, o.fechaCierre);
  const urgente = estado === "abierta" && dias <= 15;
  const Titulo = nivelTitulo;
  return (
    <article className="tarjeta flex h-full flex-col gap-3" aria-labelledby={`op-${o.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaEstado estado={estado} />
        <span className="text-xs font-semibold uppercase tracking-wide text-suave">{etiqueta(TIPOS, o.tipo)}</span>
        {estaDesactualizada(o, hoy) && <AvisoDesactualizada />}
      </div>
      <Titulo id={`op-${o.id}`} className="text-lg font-bold leading-snug">
        <Link href={`/oportunidades/${o.id}`} className="text-marca-oscura underline-offset-4 hover:underline">
          {o.nombre}
        </Link>
      </Titulo>
      <p className="text-sm text-suave">
        {o.institucion} · {o.ciudad}, {o.pais}
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-suave">Nivel</dt>
        <dd className="font-medium">{etiqueta(NIVELES, o.nivel)}</dd>
        <dt className="text-suave">Modalidad</dt>
        <dd className="font-medium">{etiqueta(MODALIDADES, o.modalidad)}</dd>
        <dt className="text-suave">Idioma</dt>
        <dd className="font-medium">{o.idioma}</dd>
        <dt className="text-suave">Financiamiento</dt>
        <dd className="font-medium">{etiqueta(FINANCIAMIENTOS, o.financiamientoTipo)}</dd>
        <dt className="text-suave">Costo total estimado</dt>
        <dd className="font-medium">
          {formatearMonto(costoTotal(o), o.moneda)}
          {o.moneda !== "USD" && <span className="block text-xs text-suave">≈ {formatearMonto(costoTotalUsd(o), "USD")}</span>}
        </dd>
      </dl>
      <p className={`text-sm font-semibold ${urgente ? "text-peligro" : "text-texto"}`}>{textoPlazo(o, hoy)}</p>
      <p className="mt-auto text-xs text-suave">
        Fuente: {o.entidad.nombre} ({o.entidad.sigla}) · Actualizada el {formatearFechaCorta(o.actualizadoEn)}
      </p>
      {children}
    </article>
  );
}
