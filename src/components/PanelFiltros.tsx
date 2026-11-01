"use client";
// Panel de filtros avanzados (D60), compartido por la lista y el mapa del catálogo.
// Filtra al instante (sin botón «Aplicar»): cada cambio actualiza la URL y el servidor
// devuelve los resultados. En escritorio es un panel lateral; en el celular, una hoja
// inferior (diálogo modal accesible: foco dentro, Escape para cerrar).
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AREAS, ESTADOS, FINANCIAMIENTOS, IDIOMAS, MODALIDADES, NIVELES } from "@/lib/catalogos";
import { aConsulta, type FiltroMultiple, type Filtros } from "@/lib/oportunidades";
import { ISO2 } from "@/lib/paises";

const COSTOS = [5000, 10000, 20000, 40000, 60000, 100000];
const pares = (m: Record<string, string>) => Object.entries(m) as [string, string][];
const lista = (l: readonly string[]) => l.map((x) => [x, x] as [string, string]);

/** Grupo plegable de casillas para elegir una o varias opciones de un filtro. */
function GrupoCasillas({ id, titulo, opciones, marcadas, alCambiar, conBanderas = false }: {
  id: FiltroMultiple; titulo: string; opciones: [string, string][]; marcadas: string[];
  alCambiar: (valores: string[]) => void; conBanderas?: boolean;
}) {
  return (
    <details open={marcadas.length > 0} className="rounded-[var(--radius-control)] border border-gray-400">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between px-3 font-bold">
        <span>{titulo}</span>
        <span className="text-sm font-normal text-suave">{marcadas.length ? `${marcadas.length} elegido${marcadas.length === 1 ? "" : "s"}` : "Todos"}</span>
      </summary>
      <fieldset className="border-t border-borde px-3 pb-2 pt-1">
        <legend className="sr-only">{titulo}: elige una o varias opciones</legend>
        {opciones.map(([v, texto], i) => (
          <div key={v} className="flex min-h-11 items-center gap-3">
            <input id={`${id}-${i}`} type="checkbox" name={id} value={v} checked={marcadas.includes(v)}
              onChange={(e) => alCambiar(e.target.checked ? [...marcadas, v] : marcadas.filter((x) => x !== v))}
              className="h-5 w-5 accent-marca" />
            <label htmlFor={`${id}-${i}`} className="inline-flex items-center gap-2">
              {conBanderas && ISO2[v] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/banderas/${ISO2[v]}.svg`} alt="" width={20} height={15} className="h-[15px] w-5 rounded-[2px] object-cover ring-1 ring-black/10" />
              )}
              {texto}
            </label>
          </div>
        ))}
      </fieldset>
    </details>
  );
}

function Selector({ id, etiqueta, valor, opciones, todos, alCambiar }: {
  id: string; etiqueta: string; valor?: string; opciones: [string, string][]; todos: string; alCambiar: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      <select id={id} name={id} value={valor ?? ""} onChange={(e) => alCambiar(e.target.value)} className="campo">
        <option value="">{todos}</option>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

const consulta = (f: Filtros) => aConsulta(f).toString();
const contar = (f: Filtros) =>
  Object.entries(f).reduce((n, [k, v]) => (k === "orden" ? n : n + (Array.isArray(v) ? v.length : v ? 1 : 0)), 0);

export function PanelFiltros({ filtros, paises, base, total, conOrden = true }: {
  filtros: Filtros; paises: string[]; base: string; total: number; conOrden?: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Filtros>(filtros);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const ultimaEnviada = useRef(consulta(filtros));
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const idHoja = useId();

  // Si los filtros cambian desde fuera (una etiqueta que se quita, un chip rápido),
  // el formulario se pone al día; los cambios propios no se pisan.
  const desdeServidor = consulta(filtros);
  useEffect(() => {
    if (desdeServidor !== ultimaEnviada.current) {
      ultimaEnviada.current = desdeServidor;
      setEstado(filtros);
    }
  }, [desdeServidor, filtros]);

  function aplicar(nuevo: Filtros, demora = 0) {
    setEstado(nuevo);
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      const s = consulta(nuevo);
      ultimaEnviada.current = s;
      iniciar(() => router.replace(s ? `${base}?${s}` : base, { scroll: false }));
    }, demora);
  }
  const fijar = <K extends keyof Filtros>(clave: K, valor: Filtros[K]) => aplicar({ ...estado, [clave]: valor || undefined });

  // Hoja inferior en el celular: foco dentro, Escape cierra, el foco vuelve al botón.
  useEffect(() => {
    if (!abierto) return;
    const enfocables = () => [...(hoja.current?.querySelectorAll<HTMLElement>("a[href], button, input, select, summary") ?? [])].filter((e) => e.offsetParent !== null);
    enfocables()[0]?.focus();
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
      if (e.key !== "Tab") return;
      const l = enfocables();
      if (!l.length) return;
      if (e.shiftKey && document.activeElement === l[0]) { e.preventDefault(); l[l.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === l[l.length - 1]) { e.preventDefault(); l[0].focus(); }
    };
    document.addEventListener("keydown", tecla);
    const boton = disparador.current;
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
      boton?.focus();
    };
  }, [abierto]);

  const n = contar(estado);
  return (
    <div className="min-w-0">
      <button ref={disparador} type="button" onClick={() => setAbierto(true)} aria-expanded={abierto} aria-controls={idHoja}
        className="btn-secundario w-full lg:hidden">
        <SlidersHorizontal aria-hidden="true" className="h-5 w-5" /> Filtros{n > 0 && ` (${n})`}
      </button>

      {abierto && <div className="fixed inset-0 z-[60] bg-black/40 lg:hidden" aria-hidden="true" onClick={() => setAbierto(false)} />}
      <div id={idHoja} ref={hoja}
        {...(abierto ? { role: "dialog", "aria-modal": true, "aria-labelledby": `${idHoja}-titulo` } : {})}
        className={`${abierto ? "anima-entrada fixed inset-x-0 bottom-0 z-[61] block max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-panel)] bg-white p-4 shadow-[var(--shadow-panel)]" : "hidden"} lg:static lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none`}>
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <h2 id={`${idHoja}-titulo`} className="font-[family-name:var(--font-display)] text-xl font-bold text-marca-oscura">Filtros</h2>
          <button type="button" onClick={() => setAbierto(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-marca-clara" aria-label="Cerrar filtros">
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <form role="search" aria-label="Buscar y filtrar oportunidades" className="tarjeta space-y-4"
          onSubmit={(e) => { e.preventDefault(); aplicar(estado); }}>
          <div>
            <label htmlFor="q" className="etiqueta-campo">Buscar por texto</label>
            <input id="q" name="q" type="search" value={estado.q ?? ""} placeholder="Nombre, institución, ciudad…" className="campo"
              onChange={(e) => aplicar({ ...estado, q: e.target.value || undefined }, 400)} />
          </div>
          <Selector id="estado" etiqueta="Estado de la convocatoria" valor={estado.estado} opciones={pares(ESTADOS)} todos="Todos los estados" alCambiar={(v) => fijar("estado", v)} />
          <GrupoCasillas id="pais" titulo="País" opciones={paises.map((p) => [p, p])} marcadas={estado.pais ?? []} alCambiar={(v) => fijar("pais", v)} conBanderas />
          <GrupoCasillas id="area" titulo="Área de estudio" opciones={lista(AREAS)} marcadas={estado.area ?? []} alCambiar={(v) => fijar("area", v)} />
          <GrupoCasillas id="nivel" titulo="Nivel" opciones={pares(NIVELES)} marcadas={estado.nivel ?? []} alCambiar={(v) => fijar("nivel", v)} />
          <GrupoCasillas id="modalidad" titulo="Modalidad" opciones={pares(MODALIDADES)} marcadas={estado.modalidad ?? []} alCambiar={(v) => fijar("modalidad", v)} />
          <GrupoCasillas id="idioma" titulo="Idioma" opciones={lista(IDIOMAS)} marcadas={estado.idioma ?? []} alCambiar={(v) => fijar("idioma", v)} />
          <GrupoCasillas id="financiamiento" titulo="Tipo de financiamiento" opciones={pares(FINANCIAMIENTOS)} marcadas={estado.financiamiento ?? []} alCambiar={(v) => fijar("financiamiento", v)} />
          <div>
            <Selector id="costoMax" etiqueta="Costo total máximo" valor={estado.costoMax} todos="Sin límite" alCambiar={(v) => fijar("costoMax", v)}
              opciones={COSTOS.map((c) => [String(c), `Hasta ${c.toLocaleString("es-PE")} USD`])} />
            <p className="mt-1 text-xs text-suave">Matrícula + costo de vida + otros costos, convertido a dólares con un tipo de cambio referencial.</p>
          </div>
          <fieldset>
            <legend className="etiqueta-campo">Fecha de inicio de clases</legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="inicioDesde" className="text-sm text-suave">Desde</label>
                <input id="inicioDesde" name="inicioDesde" type="date" value={estado.inicioDesde ?? ""} onChange={(e) => fijar("inicioDesde", e.target.value)} className="campo" />
              </div>
              <div>
                <label htmlFor="inicioHasta" className="text-sm text-suave">Hasta</label>
                <input id="inicioHasta" name="inicioHasta" type="date" value={estado.inicioHasta ?? ""} onChange={(e) => fijar("inicioHasta", e.target.value)} className="campo" />
              </div>
            </div>
          </fieldset>
          {conOrden && (
            <Selector id="orden" etiqueta="Ordenar por" valor={estado.orden} todos="Fecha de cierre más cercana" alCambiar={(v) => fijar("orden", v)}
              opciones={[["costo", "Menor costo total"], ["inicio", "Fecha de inicio más cercana"], ["actualizacion", "Actualización más reciente"]]} />
          )}
          <p className="text-sm text-suave" aria-live="polite">{pendiente ? "Actualizando resultados…" : ""}</p>
          <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-borde bg-white px-4 py-3 sm:-mx-5 sm:px-5 lg:static lg:mx-0 lg:border-0 lg:p-0">
            <button type="button" onClick={() => setAbierto(false)} className="btn-primario lg:hidden">
              Ver {total === 1 ? "1 resultado" : `${total} resultados`}
            </button>
            <Link href={base} scroll={false} className="btn-secundario">Limpiar filtros</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
