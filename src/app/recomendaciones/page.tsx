import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { contextoAcciones } from "@/lib/contexto";
import { MINIMO_COINCIDENCIAS, recomendar, textoCriterio, totalCriterios } from "@/lib/recomendaciones";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { TarjetaOportunidad } from "@/components/oportunidad";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";

/** Recomendaciones que se muestran de entrada; el resto, en «Ver más» (D64). */
const PRIMERAS = 6;

export const metadata: Metadata = { title: "Recomendaciones para ti" };

export default async function Recomendaciones({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil: aviso } = await searchParams;
  const u = await exigirRol(["ciudadano"], "/recomendaciones");
  if (!u.perfil) redirect("/perfil");
  const [hoy, todas, ctx] = await Promise.all([
    obtenerHoy(),
    prisma.oportunidad.findMany({ where: { publicada: true }, include: { entidad: true } }),
    contextoAcciones(),
  ]);
  const recomendadas = recomendar(u.perfil, todas, hoy);
  const total = totalCriterios(u.perfil);

  const lista = (grupo: typeof recomendadas) => (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {grupo.map(({ oportunidad: o, criterios }) => (
        <li key={o.id}>
          <TarjetaOportunidad o={o} hoy={hoy}>
            <div className="rounded-[var(--radius-control)] bg-exito-claro p-3">
              <p className="inline-flex items-center gap-1.5 font-bold text-exito">
                <Sparkles aria-hidden="true" className="h-4 w-4" />Coincide en {criterios.length} de {total}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Criterios coincidentes de ${o.nombre}`}>
                {criterios.map((c) => (
                  <li key={c} className="inline-flex items-center gap-1 rounded-full border border-exito bg-white px-2.5 py-1 text-xs font-semibold text-exito">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />{textoCriterio(c, o)}
                  </li>
                ))}
              </ul>
            </div>
            <AccionesOportunidad id={o.id} nombre={o.nombre} rol={ctx.rol} guardada={ctx.guardadas.has(o.id)}
              enComparador={ctx.comparar.has(o.id)} volver="/recomendaciones" />
          </TarjetaOportunidad>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      {aviso === "guardado" && (
        <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          Guardamos tu perfil. Estas son las oportunidades que coinciden con él.
        </p>
      )}
      <div>
        <h1 className="titulo-pagina">Recomendaciones para ti</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Oportunidades abiertas o por abrir que coinciden en al menos {MINIMO_COINCIDENCIAS} de los {total} criterios
          de tu perfil. Primero las {PRIMERAS} que más coinciden.{" "}
          <Link href="/perfil" className="enlace">Cambiar mi perfil</Link>
        </p>
      </div>
      <h2 className="text-lg font-bold">
        {recomendadas.length === 1 ? "1 oportunidad recomendada" : `${recomendadas.length} oportunidades recomendadas`}
      </h2>
      {recomendadas.length ? (
        <>
          {lista(recomendadas.slice(0, PRIMERAS))}
          {recomendadas.length > PRIMERAS && (
            <details className="group">
              <summary className="btn-secundario cursor-pointer list-none">
                Ver más recomendaciones ({recomendadas.length - PRIMERAS})
                <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4">{lista(recomendadas.slice(PRIMERAS))}</div>
            </details>
          )}
        </>
      ) : (
        <div className="tarjeta">
          <p className="font-semibold">Por ahora no hay oportunidades que coincidan con tu perfil.</p>
          <p className="mt-1 text-suave">
            Prueba ampliando los países o el rango de costo en <Link href="/perfil" className="enlace">tu perfil</Link>, o
            revisa el <Link href="/catalogo" className="enlace">catálogo completo</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
