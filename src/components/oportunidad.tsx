// Piezas de interfaz reutilizables para mostrar oportunidades.
import Link from "next/link";
import type { Entidad, Oportunidad } from "@prisma/client";
import { AlarmClock, Building2, CalendarClock, GraduationCap, HandCoins, Languages, Laptop, Shuffle, Wallet } from "lucide-react";
import { MODALIDADES, NIVELES, TIPOS, etiqueta } from "@/lib/catalogos";
import { soles } from "@/lib/tramites";
import { Bandera } from "./Bandera";
import { InfoFuente } from "./InfoFuente";
import { diasEntre, formatearFechaCorta, textoDias } from "@/lib/fechas";
import {
  coberturaCorta,
  estaDesactualizada,
  estadoConvocatoria,
  pagariasPen,
  urgencia,
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

/** Ícono de cada modalidad (lucide-react). */
const ICONO_MODALIDAD = { presencial: Building2, virtual: Laptop, semipresencial: Shuffle } as const;

/** Etiqueta de días al cierre con color de urgencia, ícono y texto (D58). */
export function EtiquetaUrgencia({ o, hoy }: { o: Pick<Oportunidad, "fechaApertura" | "fechaCierre">; hoy: Date }) {
  const u = urgencia(o, hoy);
  const Icono = u.nivel === "rojo" ? AlarmClock : CalendarClock;
  return (
    <span className={`urgencia urgencia-${u.nivel}`}>
      <Icono aria-hidden="true" className="h-4 w-4" />
      {u.estado === "abierta" && <span className="sr-only">Convocatoria abierta: </span>}
      {u.texto}
    </span>
  );
}

/** Nivel, modalidad e idioma como íconos con texto corto, en una línea. */
export function DatosClave({ o }: { o: Pick<Oportunidad, "nivel" | "modalidad" | "idioma"> }) {
  const Modalidad = ICONO_MODALIDAD[o.modalidad as keyof typeof ICONO_MODALIDAD] ?? Building2;
  const item = "inline-flex items-center gap-1 whitespace-nowrap";
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-suave">
      <span className={item}><GraduationCap aria-hidden="true" className="h-4 w-4 text-marca" />{etiqueta(NIVELES, o.nivel)}</span>
      <span className={item}><Modalidad aria-hidden="true" className="h-4 w-4 text-marca" />{etiqueta(MODALIDADES, o.modalidad)}</span>
      <span className={item}><Languages aria-hidden="true" className="h-4 w-4 text-marca" />{o.idioma}</span>
    </p>
  );
}

type Props = {
  o: Oportunidad & { entidad: Entidad };
  hoy: Date;
  /** Contenido adicional (p. ej. criterios coincidentes o acciones) */
  children?: React.ReactNode;
  nivelTitulo?: "h2" | "h3";
};

/**
 * Tarjeta de oportunidad (D58), igual en inicio, catálogo y recomendaciones:
 * país, título, institución, cobertura destacada, «Pagarías aprox.», urgencia,
 * datos clave con íconos y la fuente en un ícono de información.
 */
export function TarjetaOportunidad({ o, hoy, children, nivelTitulo = "h3" }: Props) {
  const Titulo = nivelTitulo;
  const pagarias = pagariasPen(o);
  const integral = o.financiamientoTipo === "integral";
  const cobertura = coberturaCorta(o);
  return (
    <article className="tarjeta anima-entrada flex h-full flex-col gap-3 [&>*:last-child]:mt-auto transition-shadow duration-150 hover:shadow-[var(--shadow-elevada)]" aria-labelledby={`op-${o.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-texto">
          <Bandera pais={o.pais} />
          <span>{o.pais}</span>
          <span className="font-normal text-meta">· {o.ciudad}</span>
        </p>
        <EtiquetaUrgencia o={o} hoy={hoy} />
      </div>
      <div>
        <Titulo id={`op-${o.id}`} className="font-[family-name:var(--font-display)] text-lg font-bold leading-snug">
          <Link href={`/oportunidades/${o.id}`} className="text-marca-oscura underline-offset-4 hover:underline">
            {o.nombre}
          </Link>
        </Titulo>
        <p className="mt-0.5 text-sm text-suave">{o.institucion} · {etiqueta(TIPOS, o.tipo)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] bg-marca-clara p-3">
        <p className="flex min-w-0 flex-col">
          <span className="text-xs text-suave">{cobertura.rotulo}</span>
          <span className="inline-flex items-start gap-1 font-bold leading-tight text-marca-oscura">
            <HandCoins aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{cobertura.valor}
          </span>
        </p>
        <p className="flex min-w-0 flex-col">
          <span className="text-xs text-suave">Pagarías aprox.</span>
          <span className="inline-flex items-start gap-1 font-bold leading-tight text-marca-oscura">
            <Wallet aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {integral ? <span className="text-exito">S/ 0 en matrícula</span> : soles(pagarias)}
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <DatosClave o={o} />
        <InfoFuente nombre={o.nombre}>
          <span className="block">Fuente: {o.entidad.nombre} ({o.entidad.sigla})</span>
          <span className="block">Actualizada el {formatearFechaCorta(o.actualizadoEn)}</span>
          <span className="mt-1 block font-bold">Ficha de ejemplo con datos ficticios</span>
          <span className="mt-1 block">«Pagarías aprox.» es el costo total menos lo que cubre el financiamiento, en soles con un tipo de cambio referencial.</span>
        </InfoFuente>
      </div>
      {estaDesactualizada(o, hoy) && <AvisoDesactualizada />}
      {children}
    </article>
  );
}
