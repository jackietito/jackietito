"use client";
// Piezas de formulario accesibles: resumen de errores, campos con mensaje
// asociado (aria-describedby) y botón que indica el envío en curso.
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

export function ResumenErrores({ errores, mensaje }: { errores?: Record<string, string>; mensaje?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lista = errores ? Object.entries(errores) : [];
  const hay = lista.length > 0 || !!mensaje;
  useEffect(() => {
    if (hay) ref.current?.focus();
  }, [hay, errores, mensaje]);
  if (!hay) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded-lg border-2 border-peligro bg-peligro-claro p-4 text-peligro">
      {mensaje && <p className="font-semibold">{mensaje}</p>}
      {lista.length > 0 && (
        <>
          <p className="font-semibold">Revisa {lista.length === 1 ? "este dato" : "estos datos"}:</p>
          <ul className="mt-1 list-disc pl-5">
            {lista.map(([campo, texto]) => (
              <li key={campo}>
                <a href={`#${campo}`} className="underline">{texto}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function MensajeError({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-peligro">{texto}</p>;
}

/** Atributos ARIA de un campo según tenga error y/o ayuda. */
export function ariaCampo(id: string, error?: string, ayuda = false) {
  const describe = [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return { "aria-invalid": error ? true : undefined, "aria-describedby": describe || undefined };
}

export function CampoTexto({
  id, etiqueta, error, ayuda, ...props
}: {
  id: string; etiqueta: string; error?: string; ayuda?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      {ayuda && <p id={`${id}-ayuda`} className="text-sm text-suave">{ayuda}</p>}
      <input id={id} name={id} className="campo" {...ariaCampo(id, error, !!ayuda)} {...props} />
      <MensajeError id={id} texto={error} />
    </div>
  );
}

export function BotonEnviar({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario w-full sm:w-auto" disabled={pending} aria-disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}
