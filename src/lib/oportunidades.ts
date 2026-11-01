// Reglas de negocio de la ficha estándar: estado, costos, filtros, completitud y vigencia.
import type { Entidad, Oportunidad, Requisito } from "@prisma/client";
import { DIAS_VIGENCIA_FICHA, TASAS_USD } from "./catalogos";
import { diasEntre, desdeISO } from "./fechas";

export type EstadoConvocatoria = "abierta" | "proxima" | "cerrada";

/** Estado calculado: próxima (aún no abre), abierta, cerrada. */
export function estadoConvocatoria(
  o: Pick<Oportunidad, "fechaApertura" | "fechaCierre">,
  hoy: Date,
): EstadoConvocatoria {
  if (diasEntre(hoy, o.fechaApertura) > 0) return "proxima";
  if (diasEntre(hoy, o.fechaCierre) < 0) return "cerrada";
  return "abierta";
}

export function aUsd(monto: number, moneda: string): number {
  return monto * (TASAS_USD[moneda] ?? 1);
}

type Costos = Pick<
  Oportunidad,
  "costoMatricula" | "costoVidaMensual" | "otrosCostos" | "duracionMeses" | "moneda"
>;

/** Costo total estimado del programa completo, en la moneda de la ficha. */
export function costoTotal(o: Costos): number {
  return o.costoMatricula + o.costoVidaMensual * o.duracionMeses + o.otrosCostos;
}

export function costoTotalUsd(o: Costos): number {
  return aUsd(costoTotal(o), o.moneda);
}

export function formatearMonto(monto: number, moneda: string): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

/** La ficha no se revisa hace más del plazo acordado (RF16). */
export function estaDesactualizada(o: Pick<Oportunidad, "actualizadoEn">, hoy: Date): boolean {
  return diasEntre(o.actualizadoEn, hoy) > DIAS_VIGENCIA_FICHA;
}

const CAMPOS_OBLIGATORIOS = [
  "tipo", "nombre", "institucion", "pais", "ciudad", "area", "nivel", "modalidad", "idioma",
  "moneda", "financiamientoTipo", "enlaceOficial", "responsableActualizacion",
] as const;

/** Campos obligatorios de la ficha estándar que están vacíos. */
export function camposFaltantes(o: Oportunidad & { requisitos: Requisito[] }): string[] {
  const faltan: string[] = CAMPOS_OBLIGATORIOS.filter((c) => !String(o[c] ?? "").trim());
  if (o.duracionMeses <= 0) faltan.push("duracionMeses");
  if (o.financiamientoTipo !== "ninguno" && !o.cobertura.trim()) faltan.push("cobertura");
  if (o.requisitos.length === 0) faltan.push("requisitos");
  return faltan;
}

export function fichaCompleta(o: Oportunidad & { requisitos: Requisito[] }): boolean {
  return camposFaltantes(o).length === 0;
}

// ---------- Búsqueda y filtros (RF04) ----------

/** Filtros que admiten varios valores a la vez (?pais=España&pais=Chile). */
export const FILTROS_MULTIPLES = ["pais", "area", "nivel", "modalidad", "idioma", "financiamiento"] as const;
export type FiltroMultiple = (typeof FILTROS_MULTIPLES)[number];

type FiltrosSimples = {
  q?: string;
  /** Sigla de la entidad proveedora */
  entidad?: string;
  estado?: string;
  costoMax?: string;
  inicioDesde?: string;
  inicioHasta?: string;
  orden?: string;
};

export type Filtros = FiltrosSimples & Partial<Record<FiltroMultiple, string[]>>;

const CLAVES_SIMPLES: (keyof FiltrosSimples)[] = ["q", "entidad", "estado", "costoMax", "inicioDesde", "inicioHasta", "orden"];

export function leerFiltros(sp: Record<string, string | string[] | undefined>): Filtros {
  const f: Filtros = {};
  for (const c of CLAVES_SIMPLES) {
    const v = sp[c];
    const s = Array.isArray(v) ? v[0] : v;
    if (s && s.trim()) f[c] = s.trim();
  }
  for (const c of FILTROS_MULTIPLES) {
    const v = sp[c];
    const lista = [...new Set((Array.isArray(v) ? v : v ? [v] : []).map((x) => x.trim()).filter(Boolean))];
    if (lista.length) f[c] = lista;
  }
  return f;
}

/** Filtros como parámetros de URL (los múltiples se repiten). */
export function aConsulta(f: Filtros): URLSearchParams {
  const p = new URLSearchParams();
  for (const c of CLAVES_SIMPLES) if (f[c]) p.set(c, f[c]!);
  for (const c of FILTROS_MULTIPLES) for (const v of f[c] ?? []) p.append(c, v);
  return p;
}

/** Normaliza texto para buscar sin distinguir mayúsculas ni tildes. */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type OportunidadConEntidad = Oportunidad & { entidad: Entidad };

/**
 * Filtra en memoria. El catálogo del prototipo es pequeño (decenas de fichas)
 * y así el comportamiento es idéntico en SQLite y PostgreSQL.
 */
export function filtrarOportunidades<T extends OportunidadConEntidad>(
  lista: T[],
  f: Filtros,
  hoy: Date,
): T[] {
  const terminos = f.q ? normalizar(f.q).split(/\s+/).filter(Boolean) : [];
  const costoMax = f.costoMax ? Number(f.costoMax) : NaN;
  const desde = desdeISO(f.inicioDesde);
  const hasta = desdeISO(f.inicioHasta);

  const res = lista.filter((o) => {
    if (terminos.length) {
      const texto = normalizar(
        [o.nombre, o.institucion, o.pais, o.ciudad, o.area, o.descripcion, o.entidad.nombre,
          o.entidad.sigla, o.entidadFinanciadora].join(" "),
      );
      if (!terminos.every((t) => texto.includes(t))) return false;
    }
    // Dentro de un mismo filtro basta con coincidir con una opción; entre filtros, con todos.
    if (f.entidad && o.entidad.sigla !== f.entidad) return false;
    const fuera = (valores: string[] | undefined, valor: string) => !!valores?.length && !valores.includes(valor);
    if (fuera(f.pais, o.pais)) return false;
    if (fuera(f.area, o.area)) return false;
    if (fuera(f.nivel, o.nivel)) return false;
    if (fuera(f.modalidad, o.modalidad)) return false;
    if (fuera(f.idioma, o.idioma)) return false;
    if (fuera(f.financiamiento, o.financiamientoTipo)) return false;
    if (f.estado && estadoConvocatoria(o, hoy) !== f.estado) return false;
    if (!Number.isNaN(costoMax) && costoMax > 0 && costoTotalUsd(o) > costoMax) return false;
    if (desde && o.fechaInicio < desde) return false;
    if (hasta && o.fechaInicio > hasta) return false;
    return true;
  });

  const rangoEstado = { abierta: 0, proxima: 1, cerrada: 2 };
  switch (f.orden) {
    case "costo":
      return res.sort((a, b) => costoTotalUsd(a) - costoTotalUsd(b));
    case "inicio":
      return res.sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime());
    case "actualizacion":
      return res.sort((a, b) => b.actualizadoEn.getTime() - a.actualizadoEn.getTime());
    default:
      // Por cierre: primero abiertas que cierran antes, luego próximas, luego cerradas.
      return res.sort((a, b) => {
        const d = rangoEstado[estadoConvocatoria(a, hoy)] - rangoEstado[estadoConvocatoria(b, hoy)];
        return d !== 0 ? d : a.fechaCierre.getTime() - b.fechaCierre.getTime();
      });
  }
}
