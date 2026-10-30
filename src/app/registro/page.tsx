import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { FormRegistro } from "@/components/FormRegistro";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function Registro() {
  if (await usuarioActual()) redirect("/");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="titulo-pagina">Crear cuenta</h1>
      <p className="text-suave">
        Con tu cuenta recibes oportunidades según tu perfil, guardas las que te interesan y preparas tu postulación paso a paso. Es gratis.
      </p>
      <FormRegistro />
    </div>
  );
}
