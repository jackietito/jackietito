"use client";
import Link from "next/link";
import { useActionState } from "react";
import { registrar, type EstadoFormulario } from "@/lib/acciones";
import { BotonEnviar, CampoTexto, MensajeError, ResumenErrores, ariaCampo } from "./formulario";

export function FormRegistro() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrar, {});
  const e = estado.errores ?? {};
  return (
    <form action={accion} className="tarjeta space-y-4" noValidate>
      <ResumenErrores errores={estado.errores} mensaje={estado.mensaje} />
      <CampoTexto id="email" etiqueta="Correo electrónico" type="email" autoComplete="email" required
        defaultValue={String(estado.valores?.email ?? "")} error={e.email} />
      <CampoTexto id="clave" etiqueta="Contraseña" type="password" autoComplete="new-password" required
        ayuda="Al menos 8 caracteres." error={e.clave} />
      <CampoTexto id="clave2" etiqueta="Repite la contraseña" type="password" autoComplete="new-password" required error={e.clave2} />

      <section aria-labelledby="titulo-datos" className="rounded-lg border border-borde bg-fondo p-4 text-sm">
        <h2 id="titulo-datos" className="mb-2 text-base font-bold">Uso de tus datos personales</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Qué datos pedimos:</strong> tu correo, tu contraseña (guardada cifrada) y los datos de tu perfil de intereses: área, nivel, países, modalidad, idioma, rango de costo, necesidad de financiamiento, región y universidad de origen. No pedimos tu nombre, documento de identidad ni teléfono.</li>
          <li><strong>Para qué:</strong> recomendarte oportunidades, guardar tu avance y avisarte antes de que venzan las convocatorias. Con datos agregados y sin identificarte, medir el uso del servicio por región.</li>
          <li><strong>Tus derechos:</strong> puedes ver y cambiar tu perfil en cualquier momento.</li>
        </ul>
        <p className="mt-2 text-suave">Este es un prototipo académico: no uses datos reales.</p>
      </section>

      <div>
        <div className="flex items-start gap-3">
          <input id="consentimiento" name="consentimiento" type="checkbox" value="si" required
            className="mt-1 h-6 w-6 shrink-0 accent-marca" {...ariaCampo("consentimiento", e.consentimiento)} />
          <label htmlFor="consentimiento" className="font-semibold">
            Acepto el tratamiento de mis datos personales para las finalidades descritas.
          </label>
        </div>
        <MensajeError id="consentimiento" texto={e.consentimiento} />
      </div>

      <BotonEnviar texto="Crear cuenta" enviando="Creando cuenta…" />
      <p className="text-sm">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="enlace">Ingresa aquí</Link>
      </p>
    </form>
  );
}
