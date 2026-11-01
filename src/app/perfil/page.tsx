import type { Metadata } from "next";
import { exigirRol } from "@/lib/auth";
import { formatearFecha } from "@/lib/fechas";
import { idiomasAcreditados, idiomasDePerfil, modalidadesDePerfil, paisesDePerfil } from "@/lib/recomendaciones";
import { FormPerfil } from "@/components/FormPerfil";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function Perfil({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const { bienvenida } = await searchParams;
  const u = await exigirRol(["ciudadano"], "/perfil");
  const p = u.perfil;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {bienvenida && (
        <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          ¡Tu cuenta está lista! Ahora cuéntanos qué te interesa para recomendarte oportunidades.
        </p>
      )}
      <h1 className="titulo-pagina">Mi perfil de intereses</h1>
      <p className="text-suave">
        Usamos estos datos para recomendarte oportunidades. Puedes cambiarlos cuando quieras.
        {p && <> Última actualización: {formatearFecha(p.actualizadoEn)}.</>}
      </p>
      <p className="text-sm text-suave">Cuenta: {u.email}</p>
      <FormPerfil
        inicial={{
          area: p?.area ?? "",
          nivel: p?.nivel ?? "",
          paises: p ? paisesDePerfil(p) : [],
          modalidades: p ? modalidadesDePerfil(p) : [],
          idiomas: p ? idiomasDePerfil(p) : [],
          idiomasAcreditados: idiomasAcreditados(p),
          costoMaxUsd: p ? String(p.costoMaxUsd) : "",
          financiamiento: p ? [...(p.necesitaFinanciamiento ? ["con"] : []), ...(p.buscaSinBeca ? ["sin"] : [])] : [],
          region: p?.region ?? "",
          universidadOrigen: p?.universidadOrigen ?? "",
        }}
      />
    </div>
  );
}
