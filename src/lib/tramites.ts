// Presentación de plazos y costos referenciales de los trámites (RF10, D42).
import type { Tramite } from "@prisma/client";

type Costo = Pick<Tramite, "costoReferencial" | "costoNota">;
type Plazo = Pick<Tramite, "plazoDias" | "plazoTexto">;

/** Soles con céntimos solo cuando los hay: «S/ 40.40», «S/ 15». */
export function soles(monto: number): string {
  const entero = Number.isInteger(monto);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: entero ? 0 : 2,
    maximumFractionDigits: entero ? 0 : 2,
  }).format(monto);
}

/** «Gratuito (en línea)», «S/ 133.28 (para uso en el extranjero)» o «Según el TUPA de tu universidad». */
export function textoCosto(t: Costo): string {
  if (t.costoReferencial === null) return t.costoNota || "Por confirmar";
  const monto = t.costoReferencial === 0 ? "Gratuito" : soles(t.costoReferencial);
  return t.costoNota ? `${monto} (${t.costoNota})` : monto;
}

/** El plazo en palabras si lo hay; si no, «3 días». */
export function textoPlazo(t: Plazo): string {
  if (t.plazoTexto) return t.plazoTexto;
  return t.plazoDias === 1 ? "1 día" : `${t.plazoDias} días`;
}

/**
 * Costo total de varios trámites. Los costos que no son un monto no se suman;
 * si hay alguno, el total se muestra como «desde S/ X».
 */
export function textoCostoTotal(tramites: Costo[]): string {
  const total = tramites.reduce((s, t) => s + (t.costoReferencial ?? 0), 0);
  const desde = tramites.some((t) => t.costoReferencial === null);
  return `${desde ? "desde " : ""}${soles(Math.round(total * 100) / 100)}`;
}
