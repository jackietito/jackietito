"use client";
// Formulario del perfil de intereses (RF03). Solo pide los datos de RF03.
import { useActionState } from "react";
import { guardarPerfil, type EstadoFormulario } from "@/lib/acciones";
import { AREAS, IDIOMAS, MODALIDADES, NIVELES, PAISES, REGIONES } from "@/lib/catalogos";
import { BotonEnviar, CampoTexto, MensajeError, ResumenErrores, ariaCampo } from "./formulario";

export type ValoresPerfil = {
  area: string; nivel: string; paises: string[]; modalidades: string[]; idiomas: string[];
  costoMaxUsd: string; financiamiento: string[]; region: string; universidadOrigen: string;
};

const RANGOS_COSTO: [string, string][] = [
  ["5000", "Hasta 5 000 USD"],
  ["10000", "Hasta 10 000 USD"],
  ["20000", "Hasta 20 000 USD"],
  ["30000", "Hasta 30 000 USD"],
  ["60000", "Hasta 60 000 USD"],
];

function Selector({ id, etiqueta, valor, opciones, error }: {
  id: string; etiqueta: string; valor: string; opciones: [string, string][]; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      <select id={id} name={id} defaultValue={valor} className="campo" required {...ariaCampo(id, error)}>
        <option value="">Elige una opción</option>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      <MensajeError id={id} texto={error} />
    </div>
  );
}

/** Grupo de casillas para elegir una o varias opciones. */
function Casillas({ id, titulo, opciones, marcadas, error, columnas = "sm:grid-cols-3" }: {
  id: string; titulo: string; opciones: [string, string][]; marcadas: string[]; error?: string; columnas?: string;
}) {
  return (
    <fieldset className="tarjeta" {...ariaCampo(id, error)}>
      <legend className="titulo-seccion px-1">{titulo}</legend>
      <p className="mb-3 text-sm text-suave">Marca todas las que quieras.</p>
      <div id={id} tabIndex={-1} className={`grid grid-cols-1 gap-1 ${columnas}`}>
        {opciones.map(([valor, texto], i) => (
          <div key={valor} className="flex min-h-11 items-center gap-3">
            <input id={`${id}-${i}`} type="checkbox" name={id} value={valor} defaultChecked={marcadas.includes(valor)} className="h-6 w-6 accent-marca" />
            <label htmlFor={`${id}-${i}`}>{texto}</label>
          </div>
        ))}
      </div>
      <MensajeError id={id} texto={error} />
    </fieldset>
  );
}

const pares = (m: Record<string, string>) => Object.entries(m) as [string, string][];
const lista = (l: readonly string[]) => l.map((x) => [x, x] as [string, string]);

export function FormPerfil({ inicial }: { inicial: ValoresPerfil }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarPerfil, {});
  const v = { ...inicial, ...(estado.valores as Partial<ValoresPerfil> | undefined) };
  const e = estado.errores ?? {};
  // Si el perfil tiene un monto que no está en la lista, se agrega como opción.
  const rangos = v.costoMaxUsd && v.costoMaxUsd !== "0" && !RANGOS_COSTO.some(([c]) => c === v.costoMaxUsd)
    ? [[v.costoMaxUsd, `Hasta ${Number(v.costoMaxUsd).toLocaleString("es-PE")} USD`] as [string, string], ...RANGOS_COSTO]
        .sort((a, b) => (Number(a[0]) || Infinity) - (Number(b[0]) || Infinity))
    : RANGOS_COSTO;
  // La clave fuerza a React a usar los valores enviados si hubo errores.
  return (
    <form action={accion} className="space-y-6" noValidate key={JSON.stringify(estado.valores ?? {})}>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />

      <fieldset className="tarjeta space-y-4">
        <legend className="titulo-seccion px-1">Qué quieres estudiar</legend>
        <Selector id="area" etiqueta="Área de estudio" valor={v.area} opciones={lista(AREAS)} error={e.area} />
        <Selector id="nivel" etiqueta="Nivel" valor={v.nivel} opciones={pares(NIVELES)} error={e.nivel} />
      </fieldset>

      <Casillas id="modalidades" titulo="Modalidades que te interesan" opciones={pares(MODALIDADES)} marcadas={v.modalidades} error={e.modalidades} />
      <Casillas id="idiomas" titulo="Idiomas en que quieres estudiar" opciones={lista(IDIOMAS)} marcadas={v.idiomas} error={e.idiomas} />

      <Casillas id="paises" titulo="Países de interés" opciones={lista(PAISES)} marcadas={v.paises} error={e.paises} columnas="sm:grid-cols-2 md:grid-cols-3" />

      <fieldset className="tarjeta space-y-4">
        <legend className="titulo-seccion px-1">Costos y financiamiento</legend>
        <fieldset {...ariaCampo("financiamiento", e.financiamiento)}>
          <legend className="etiqueta-campo">¿Qué oportunidades buscas?</legend>
          <p className="text-sm text-suave">Puedes marcar las dos.</p>
          <div id="financiamiento" tabIndex={-1} className="mt-1 grid gap-1 sm:grid-cols-2">
            {[["con", "Con beca o crédito"], ["sin", "Sin beca (con recursos propios)"]].map(([valor, texto]) => (
              <div key={valor} className="flex min-h-11 items-center gap-3">
                <input id={`fin-${valor}`} type="checkbox" name="financiamiento" value={valor}
                  defaultChecked={v.financiamiento.includes(valor)} className="h-6 w-6 accent-marca" />
                <label htmlFor={`fin-${valor}`}>{texto}</label>
              </div>
            ))}
          </div>
          <MensajeError id="financiamiento" texto={e.financiamiento} />
        </fieldset>
        <div>
          <label htmlFor="costoMaxUsd" className="etiqueta-campo">
            ¿Cuánto podrías pagar en total? <span className="font-normal text-suave">(opcional)</span>
          </label>
          <select id="costoMaxUsd" name="costoMaxUsd" defaultValue={v.costoMaxUsd === "0" ? "" : v.costoMaxUsd} className="campo" {...ariaCampo("costoMaxUsd", e.costoMaxUsd)}>
            <option value="">Sin límite</option>
            {rangos.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
          <MensajeError id="costoMaxUsd" texto={e.costoMaxUsd} />
        </div>
      </fieldset>

      <fieldset className="tarjeta space-y-4">
        <legend className="titulo-seccion px-1">Sobre ti</legend>
        <Selector id="region" etiqueta="Región donde vives" valor={v.region} opciones={lista(REGIONES)} error={e.region} />
        <CampoTexto id="universidadOrigen" etiqueta="Universidad donde estudiaste" defaultValue={v.universidadOrigen}
          maxLength={120} autoComplete="organization" required error={e.universidadOrigen} />
      </fieldset>

      <BotonEnviar texto="Guardar perfil y ver recomendaciones" enviando="Guardando…" />
    </form>
  );
}
