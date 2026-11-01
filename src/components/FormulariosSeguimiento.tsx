"use client";
// Formularios del incremento 4: consulta al orientador (RF14), respuesta desde
// la bandeja y encuesta de satisfacción (RF15).
import { useActionState } from "react";
import type { EstadoFormulario } from "@/lib/acciones";
import { enviarConsulta, enviarEncuesta, responderConsulta } from "@/lib/acciones-seguimiento";
import { DIMENSIONES_ENCUESTA, ESCALA_ENCUESTA, TEMAS_ORIENTACION } from "@/lib/catalogos";
import { BotonEnviar, MensajeError, ResumenErrores, ariaCampo } from "./formulario";

type Opcion = { id: string; nombre: string };

function SelectorOportunidad({ opciones, valor, etiqueta }: { opciones: Opcion[]; valor?: string; etiqueta: string }) {
  if (!opciones.length) return null;
  return (
    <div>
      <label htmlFor="oportunidadId" className="etiqueta-campo">{etiqueta} <span className="font-normal text-suave">(opcional)</span></label>
      <select id="oportunidadId" name="oportunidadId" defaultValue={valor ?? ""} className="campo">
        <option value="">Ninguna en particular</option>
        {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
      </select>
    </div>
  );
}

function AreaTexto({ id, etiqueta, error, valor, ayuda, name }: { id: string; etiqueta: string; error?: string; valor?: string; ayuda?: string; name?: string }) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      {ayuda && <p id={`${id}-ayuda`} className="text-sm text-suave">{ayuda}</p>}
      <textarea id={id} name={name ?? id} rows={4} maxLength={1000} defaultValue={valor} className="campo" {...ariaCampo(id, error, !!ayuda)} />
      <MensajeError id={id} texto={error} />
    </div>
  );
}

export function FormConsulta({ oportunidades }: { oportunidades: Opcion[] }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(enviarConsulta, {});
  const v = (estado.valores ?? {}) as Record<string, string>;
  const e = estado.errores ?? {};
  return (
    <form action={accion} className="space-y-4" noValidate key={JSON.stringify(v)}>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      <div>
        <label htmlFor="tema" className="etiqueta-campo">Tema</label>
        <select id="tema" name="tema" defaultValue={v.tema ?? ""} className="campo" {...ariaCampo("tema", e.tema)}>
          <option value="">Elige un tema</option>
          {TEMAS_ORIENTACION.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <MensajeError id="tema" texto={e.tema} />
      </div>
      <SelectorOportunidad opciones={oportunidades} valor={v.oportunidadId} etiqueta="¿Sobre cuál de tus oportunidades guardadas?" />
      <AreaTexto id="pregunta" etiqueta="Tu consulta" valor={v.pregunta} error={e.pregunta}
        ayuda="No incluyas datos personales como tu DNI o teléfono." />
      <BotonEnviar texto="Enviar consulta a un orientador" enviando="Enviando…" />
    </form>
  );
}

export function FormRespuesta({ consultaId }: { consultaId: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(responderConsulta, {});
  const id = `respuesta-${consultaId}`;
  return (
    <form action={accion} className="space-y-3" noValidate>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      <input type="hidden" name="consultaId" value={consultaId} />
      <AreaTexto id={id} name="respuesta" etiqueta="Tu respuesta" error={estado.errores?.[id]} />
      <BotonEnviar texto="Enviar respuesta" enviando="Enviando…" />
    </form>
  );
}

export function FormEncuesta({ oportunidades, inicial }: { oportunidades: Opcion[]; inicial?: Record<string, string> }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(enviarEncuesta, {});
  const v = { ...inicial, ...((estado.valores ?? {}) as Record<string, string>) };
  const e = estado.errores ?? {};
  return (
    <form action={accion} className="space-y-6" noValidate key={JSON.stringify(estado.valores ?? {})}>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      <SelectorOportunidad opciones={oportunidades} valor={v.oportunidadId} etiqueta="¿Sobre qué oportunidad opinas?" />
      <p className="text-sm text-suave">Marca de 1 (muy en desacuerdo) a 5 (muy de acuerdo).</p>
      {Object.entries(DIMENSIONES_ENCUESTA).map(([clave, pregunta]) => (
        <fieldset key={clave} className="tarjeta" {...ariaCampo(clave, e[clave])}>
          <legend className="px-1 font-bold">{pregunta}</legend>
          <div id={clave} tabIndex={-1} className="mt-2 grid gap-1 sm:grid-cols-5">
            {Object.entries(ESCALA_ENCUESTA).map(([n, texto]) => (
              <div key={n} className="flex min-h-11 items-center gap-2 sm:flex-col sm:items-center sm:text-center">
                <input id={`${clave}-${n}`} type="radio" name={clave} value={n} defaultChecked={v[clave] === n} className="h-6 w-6 accent-marca" />
                <label htmlFor={`${clave}-${n}`} className="text-sm"><strong>{n}</strong> · {texto}</label>
              </div>
            ))}
          </div>
          <MensajeError id={clave} texto={e[clave]} />
        </fieldset>
      ))}
      <AreaTexto id="comentario" etiqueta="Comentarios (opcional)" valor={v.comentario} error={e.comentario}
        ayuda="¿Qué mejorarías? Tus comentarios sobre una oportunidad se comparten, sin identificarte, con la entidad que la publica." />
      <div className="flex items-start gap-3">
        <input id="publicar" name="publicar" type="checkbox" value="si" defaultChecked={v.publicar === "si"} className="mt-1 h-6 w-6 shrink-0 accent-marca" />
        <label htmlFor="publicar">
          Autorizo publicar mi comentario como testimonio en la página de inicio, solo con mi región (sin mi correo).
          <span className="block text-sm text-suave">Antes de publicarse, lo revisa el equipo de Talento sin Fronteras.</span>
        </label>
      </div>
      <BotonEnviar texto="Enviar encuesta" enviando="Enviando…" />
    </form>
  );
}
