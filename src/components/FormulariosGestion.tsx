"use client";
// Formularios de gestión de contenidos (RF16): ficha estándar y trámite.
import { useActionState } from "react";
import type { EstadoFormulario } from "@/lib/acciones";
import { guardarOportunidad, guardarTramite } from "@/lib/acciones-gestion";
import {
  AREAS, CATEGORIAS_REQUISITO, FINANCIAMIENTOS, IDIOMAS, MODALIDADES, MONEDAS, NIVELES, PAISES, TIPOS,
} from "@/lib/catalogos";
import { BotonEnviar, CampoTexto, MensajeError, ResumenErrores, ariaCampo } from "./formulario";

type Valores = Record<string, string | string[] | undefined>;

function Selector({ id, etiqueta, valor, opciones, error }: {
  id: string; etiqueta: string; valor?: string; opciones: [string, string][]; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      <select id={id} name={id} defaultValue={valor ?? ""} className="campo" {...ariaCampo(id, error)}>
        <option value="">Elige una opción</option>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      <MensajeError id={id} texto={error} />
    </div>
  );
}

function Area({ id, etiqueta, valor, error, ayuda, filas = 3 }: {
  id: string; etiqueta: string; valor?: string; error?: string; ayuda?: string; filas?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      {ayuda && <p id={`${id}-ayuda`} className="text-sm text-suave">{ayuda}</p>}
      <textarea id={id} name={id} rows={filas} defaultValue={valor} className="campo" {...ariaCampo(id, error, !!ayuda)} />
      <MensajeError id={id} texto={error} />
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="tarjeta grid gap-4 sm:grid-cols-2">
      <legend className="titulo-seccion px-1">{titulo}</legend>
      {children}
    </fieldset>
  );
}

const pares = (m: Record<string, string>) => Object.entries(m) as [string, string][];
const lista = (l: readonly string[]) => l.map((x) => [x, x] as [string, string]);
const s = (v: Valores, k: string) => (typeof v[k] === "string" ? (v[k] as string) : undefined);

export function FormOportunidad({ inicial, tramites }: { inicial: Valores; tramites: { id: string; nombre: string }[] }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarOportunidad, {});
  const v: Valores = { ...inicial, ...(estado.valores ?? {}) };
  const e = estado.errores ?? {};
  const seleccionados = (v.tramites as string[] | undefined) ?? [];
  const C = (id: string, etiqueta: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <CampoTexto id={id} etiqueta={etiqueta} defaultValue={s(v, id)} error={e[id]} {...props} />
  );
  return (
    <form action={accion} className="space-y-6" noValidate key={JSON.stringify(estado.valores ?? {})}>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      {s(v, "id") && <input type="hidden" name="id" value={s(v, "id")} />}
      <p className="text-sm text-suave">Todos los campos son obligatorios, salvo los marcados como opcionales.</p>

      <Grupo titulo="Identificación">
        <Selector id="tipo" etiqueta="Tipo" valor={s(v, "tipo")} opciones={pares(TIPOS)} error={e.tipo} />
        {C("nombre", "Nombre de la oportunidad")}
        {C("institucion", "Institución oferente")}
        <div>
          {C("pais", "País", { list: "lista-paises", autoComplete: "off" })}
          <datalist id="lista-paises">{PAISES.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        {C("ciudad", "Ciudad")}
        <div className="sm:col-span-2"><Area id="descripcion" etiqueta="Descripción breve" valor={s(v, "descripcion")} error={e.descripcion} /></div>
      </Grupo>

      <Grupo titulo="Datos académicos">
        <Selector id="area" etiqueta="Área de estudio" valor={s(v, "area")} opciones={lista(AREAS)} error={e.area} />
        <Selector id="nivel" etiqueta="Nivel" valor={s(v, "nivel")} opciones={pares(NIVELES)} error={e.nivel} />
        <Selector id="modalidad" etiqueta="Modalidad" valor={s(v, "modalidad")} opciones={pares(MODALIDADES)} error={e.modalidad} />
        <Selector id="idioma" etiqueta="Idioma" valor={s(v, "idioma")} opciones={lista(IDIOMAS)} error={e.idioma} />
        {C("duracionMeses", "Duración (meses)", { type: "number", min: 1, inputMode: "numeric" })}
        {C("fechaInicio", "Inicio de clases", { type: "date" })}
      </Grupo>

      <Grupo titulo="Convocatoria">
        {C("fechaApertura", "Fecha de apertura", { type: "date" })}
        {C("fechaCierre", "Fecha de cierre", { type: "date" })}
        <p className="text-sm text-suave sm:col-span-2">El estado (abierta, próxima o cerrada) se calcula solo con estas fechas.</p>
      </Grupo>

      <Grupo titulo="Costos">
        <Selector id="moneda" etiqueta="Moneda" valor={s(v, "moneda")} opciones={lista(MONEDAS)} error={e.moneda} />
        {C("costoMatricula", "Matrícula del programa completo", { type: "number", min: 0, step: "any", inputMode: "decimal" })}
        {C("costoVidaMensual", "Costo de vida mensual estimado (0 si es virtual)", { type: "number", min: 0, step: "any", inputMode: "decimal" })}
        {C("otrosCostos", "Otros costos (seguro, visa, fondo de garantía)", { type: "number", min: 0, step: "any", inputMode: "decimal" })}
        <div className="sm:col-span-2">{C("otrosCostosDetalle", "Detalle de otros costos (opcional)")}</div>
      </Grupo>

      <Grupo titulo="Financiamiento">
        <Selector id="financiamientoTipo" etiqueta="Tipo de financiamiento" valor={s(v, "financiamientoTipo")} opciones={pares(FINANCIAMIENTOS)} error={e.financiamientoTipo} />
        {C("entidadFinanciadora", "Entidad que financia (opcional)")}
        <div className="sm:col-span-2">
          {C("cobertura", "Cobertura (obligatoria si hay financiamiento)")}
        </div>
      </Grupo>

      <fieldset className="tarjeta space-y-4">
        <legend className="titulo-seccion px-1">Requisitos</legend>
        <p className="text-sm text-suave">Escribe un requisito por línea. Al menos uno en total.</p>
        {Object.entries(CATEGORIAS_REQUISITO).map(([c, nombre]) => (
          <Area key={c} id={`requisitos_${c}`} etiqueta={`Requisitos: ${nombre.toLowerCase()}`} valor={s(v, `requisitos_${c}`)} error={e[`requisitos_${c}`]} filas={3} />
        ))}
      </fieldset>

      <fieldset className="tarjeta">
        <legend className="titulo-seccion px-1">Trámites nacionales asociados</legend>
        <p className="mb-2 text-sm text-suave">Marca los trámites del mapa que se necesitan para postular.</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {tramites.map((t) => (
            <div key={t.id} className="flex min-h-11 items-center gap-3">
              <input id={`tram-${t.id}`} type="checkbox" name="tramites" value={t.id} defaultChecked={seleccionados.includes(t.id)} className="h-6 w-6 accent-marca" />
              <label htmlFor={`tram-${t.id}`}>{t.nombre}</label>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="tarjeta space-y-3">
        <legend className="titulo-seccion px-1">Trazabilidad y publicación</legend>
        {C("enlaceOficial", "Enlace oficial de la convocatoria", { type: "url", inputMode: "url", placeholder: "https://" })}
        <div className="flex items-center gap-3">
          <input id="publicada" name="publicada" type="checkbox" value="si" defaultChecked={s(v, "publicada") !== "no"} className="h-6 w-6 accent-marca" />
          <label htmlFor="publicada" className="font-semibold">Publicar en el catálogo</label>
        </div>
        <p className="text-sm text-suave">Al guardar se registran la fecha de actualización y tu nombre como responsable.</p>
      </fieldset>

      <BotonEnviar texto="Guardar ficha" enviando="Guardando…" />
    </form>
  );
}

export function FormTramite({ inicial }: { inicial: Valores }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarTramite, {});
  const v: Valores = { ...inicial, ...(estado.valores ?? {}) };
  const e = estado.errores ?? {};
  const C = (id: string, etiqueta: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <CampoTexto id={id} etiqueta={etiqueta} defaultValue={s(v, id)} error={e[id]} {...props} />
  );
  return (
    <form action={accion} className="space-y-6" noValidate key={JSON.stringify(estado.valores ?? {})}>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      {s(v, "id") && <input type="hidden" name="id" value={s(v, "id")} />}
      <Grupo titulo="Datos del trámite">
        {C("nombre", "Nombre del trámite")}
        {C("entidadResponsable", "Entidad ante la que se realiza")}
        <div className="sm:col-span-2"><Area id="descripcion" etiqueta="Descripción" valor={s(v, "descripcion")} error={e.descripcion} /></div>
        <div className="sm:col-span-2"><Area id="documentos" etiqueta="Documentos necesarios (uno por línea)" valor={s(v, "documentos")} error={e.documentos} /></div>
        {C("plazoDias", "Plazo referencial (días)", { type: "number", min: 0, inputMode: "numeric" })}
        {C("costoReferencial", "Costo referencial (soles)", { type: "number", min: 0, step: "any", inputMode: "decimal" })}
        {C("orden", "Orden sugerido en la ruta", { type: "number", min: 0, inputMode: "numeric" })}
        {C("anticipacionDias", "Empezar cuántos días antes del cierre", { type: "number", min: 0, inputMode: "numeric" })}
        <div className="sm:col-span-2">{C("enlaceOficial", "Enlace oficial", { type: "url", inputMode: "url", placeholder: "https://" })}</div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <input id="publicado" name="publicado" type="checkbox" value="si" defaultChecked={s(v, "publicado") !== "no"} className="h-6 w-6 accent-marca" />
          <label htmlFor="publicado" className="font-semibold">Publicar en el mapa de trámites</label>
        </div>
      </Grupo>
      <BotonEnviar texto="Guardar trámite" enviando="Guardando…" />
    </form>
  );
}
