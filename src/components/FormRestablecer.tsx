"use client";
// Formulario para restablecer los datos de prueba (D34): pide confirmación y contraseña.
import { useActionState } from "react";
import type { EstadoFormulario } from "@/lib/acciones";
import { restablecerDatos } from "@/lib/acciones-restablecer";
import { BotonEnviar, CampoTexto, MensajeError, ResumenErrores, ariaCampo } from "./formulario";

export function FormRestablecer({ habilitado }: { habilitado: boolean }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(restablecerDatos, {});
  const e = estado.errores ?? {};
  if (!habilitado) {
    return (
      <p className="rounded-lg border border-alerta bg-alerta-claro p-3 text-alerta">
        Esta opción está desactivada: falta configurar la variable de entorno <code>CLAVE_RESTABLECER</code> (ver el README).
      </p>
    );
  }
  return (
    <form action={accion} className="space-y-4" noValidate>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      <div>
        <div className="flex items-start gap-3">
          <input id="confirmo" name="confirmo" type="checkbox" value="si" className="mt-1 h-6 w-6 shrink-0 accent-marca" {...ariaCampo("confirmo", e.confirmo)} />
          <label htmlFor="confirmo" className="font-semibold">
            Entiendo que se borrarán las cuentas creadas, los perfiles, las rutas, las consultas, las encuestas y las fichas
            nuevas o editadas, y que se cerrará mi sesión.
          </label>
        </div>
        <MensajeError id="confirmo" texto={e.confirmo} />
      </div>
      <CampoTexto id="claveRestablecer" etiqueta="Contraseña de restablecimiento" type="password" autoComplete="off"
        ayuda="No es la contraseña de tu cuenta: es la clave configurada para esta acción." error={e.claveRestablecer} />
      <BotonEnviar texto="Restablecer los datos de prueba" enviando="Restableciendo… (puede tardar un minuto)" />
    </form>
  );
}
