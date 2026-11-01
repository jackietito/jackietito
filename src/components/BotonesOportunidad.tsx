"use client";
// Botones de guardar (RF08) y comparar (RF07). El resultado se anuncia en una
// región aria-live, sin recargar la página ni mover el foco.
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { alternarComparar, alternarGuardada, type EstadoBoton } from "@/lib/acciones";

type Textos = { textoActivo: string; textoInactivo: string; iconoActivo: string; iconoInactivo: string };

function Boton({ activo, nombre, ...t }: { activo: boolean; nombre: string } & Textos) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-label={`${activo ? t.textoActivo : t.textoInactivo}: ${nombre}`}
      className={`${activo ? "btn-primario" : "btn-secundario"} w-full text-sm`}>
      <span aria-hidden="true">{activo ? t.iconoActivo : t.iconoInactivo}</span>
      {activo ? t.textoActivo : t.textoInactivo}
    </button>
  );
}

function Alternador({
  accion, id, activoInicial, nombre, ...textos
}: {
  accion: (e: EstadoBoton, fd: FormData) => Promise<EstadoBoton>;
  id: string; activoInicial: boolean; nombre: string;
} & Textos) {
  const [estado, enviar] = useActionState<EstadoBoton, FormData>(accion, null);
  const activo = estado && !estado.error ? estado.activo : activoInicial;
  return (
    <form action={enviar} className="flex-1">
      <input type="hidden" name="oportunidadId" value={id} />
      <Boton activo={activo} nombre={nombre} {...textos} />
      <p aria-live="polite" className={`mt-1 min-h-0 text-xs ${estado?.error ? "font-semibold text-peligro" : "text-suave"}`}>
        {estado?.mensaje}
      </p>
    </form>
  );
}

export function BotonGuardar({ id, guardada, nombre }: { id: string; guardada: boolean; nombre: string }) {
  return (
    <Alternador accion={alternarGuardada} id={id} activoInicial={guardada} nombre={nombre}
      textoActivo="Guardada" textoInactivo="Guardar" iconoActivo="★" iconoInactivo="☆" />
  );
}

export function BotonComparar({ id, enComparador, nombre, dentroDelComparador = false, textoAgregar = "Comparar" }: {
  id: string; enComparador: boolean; nombre: string; dentroDelComparador?: boolean; textoAgregar?: string;
}) {
  return (
    <Alternador accion={alternarComparar} id={id} activoInicial={enComparador} nombre={nombre}
      textoActivo={dentroDelComparador ? "Quitar" : "En el comparador"} textoInactivo={textoAgregar}
      iconoActivo={dentroDelComparador ? "✕" : "✓"} iconoInactivo="+" />
  );
}

/** Acciones de una tarjeta o ficha: guardar (solo ciudadanos) y comparar (todos). */
export function AccionesOportunidad({
  id, nombre, rol, guardada, enComparador, volver,
}: {
  id: string; nombre: string; rol?: string; guardada: boolean; enComparador: boolean; volver: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      {rol === "ciudadano" && <BotonGuardar id={id} guardada={guardada} nombre={nombre} />}
      {!rol && (
        <a href={`/ingresar?volver=${encodeURIComponent(volver)}`} aria-label={`Ingresa para guardar: ${nombre}`}
          className="btn-secundario flex-1 text-sm">
          <span aria-hidden="true">☆</span> Ingresa para guardar
        </a>
      )}
      <BotonComparar id={id} enComparador={enComparador} nombre={nombre} />
    </div>
  );
}
