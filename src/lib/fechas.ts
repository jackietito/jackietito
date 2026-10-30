// Manejo de fechas. Todas las fechas de calendario se guardan a las 12:00 UTC
// para evitar desfases de un día al mostrarlas en la hora de Lima.

const MS_DIA = 24 * 60 * 60 * 1000;
const ZONA = "America/Lima";

/** Fecha de calendario (12:00 UTC) a partir de un Date cualquiera, según la hora de Lima. */
export function aFechaCalendario(d: Date): Date {
  const [a, m, dia] = d
    .toLocaleDateString("en-CA", { timeZone: ZONA })
    .split("-")
    .map(Number);
  return new Date(Date.UTC(a, m - 1, dia, 12));
}

/** Convierte "AAAA-MM-DD" a fecha de calendario. Devuelve null si no es válida. */
export function desdeISO(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [a, m, d] = s.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d, 12));
  return Number.isNaN(f.getTime()) ? null : f;
}

export function aISO(d: Date): string {
  return aFechaCalendario(d).toISOString().slice(0, 10);
}

export function sumarDias(d: Date, dias: number): Date {
  return new Date(aFechaCalendario(d).getTime() + dias * MS_DIA);
}

/** Días de calendario desde `desde` hasta `hasta` (negativo si `hasta` ya pasó). */
export function diasEntre(desde: Date, hasta: Date): number {
  return Math.round(
    (aFechaCalendario(hasta).getTime() - aFechaCalendario(desde).getTime()) / MS_DIA,
  );
}

export function formatearFecha(d: Date): string {
  return d.toLocaleDateString("es-PE", {
    timeZone: ZONA,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatearFechaCorta(d: Date): string {
  return d.toLocaleDateString("es-PE", {
    timeZone: ZONA,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "en 5 días", "hoy", "hace 3 días" */
export function textoDias(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`;
}
