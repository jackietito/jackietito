import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { inicioPorRol, usuarioActual, type Rol } from "@/lib/auth";
import { FormIngreso } from "@/components/FormIngreso";

export const metadata: Metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ volver?: string; restablecido?: string }> }) {
  const { volver, restablecido } = await searchParams;
  const u = await usuarioActual();
  if (u) redirect(inicioPorRol(u.rol as Rol, !!u.perfil));
  const destino = volver?.startsWith("/") && !volver.startsWith("//") ? volver : undefined;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="titulo-pagina">Ingresar</h1>
      <p className="text-suave">Ingresa para guardar oportunidades, recibir recomendaciones y preparar tu postulación.</p>
      {restablecido && (
        <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          Restablecimos los datos de prueba. Vuelve a ingresar con una de las cuentas de prueba.
        </p>
      )}
      {destino && <p className="rounded-lg border border-marca bg-marca-clara p-3 text-marca-oscura">Para continuar, ingresa con tu cuenta.</p>}
      <FormIngreso volver={destino} />
    </div>
  );
}
