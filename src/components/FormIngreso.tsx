"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ingresar, type EstadoFormulario } from "@/lib/acciones";
import { BotonEnviar, CampoTexto, ResumenErrores } from "./formulario";

export function FormIngreso({ volver }: { volver?: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(ingresar, {});
  const e = estado.errores ?? {};
  return (
    <form action={accion} className="tarjeta space-y-4" noValidate>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      {volver && <input type="hidden" name="volver" value={volver} />}
      <CampoTexto id="email" etiqueta="Correo electrónico" type="email" autoComplete="email" required
        defaultValue={String(estado.valores?.email ?? "")} error={e.email} />
      <CampoTexto id="clave" etiqueta="Contraseña" type="password" autoComplete="current-password" required error={e.clave} />
      <BotonEnviar texto="Ingresar" enviando="Ingresando…" />
      <p className="text-sm">
        ¿No tienes cuenta? <Link href="/registro" className="enlace">Crea una cuenta gratis</Link>
      </p>
    </form>
  );
}
