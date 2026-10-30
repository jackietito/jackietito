import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { contextoAcciones } from "@/lib/contexto";
import { formatearFecha } from "@/lib/fechas";
import { TarjetaOportunidad } from "@/components/oportunidad";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";

export const metadata: Metadata = { title: "Mi panel" };

export default async function Panel() {
  const u = await exigirRol(["ciudadano"], "/panel");
  const [hoy, guardadas, ctx] = await Promise.all([
    obtenerHoy(),
    prisma.guardada.findMany({
      where: { usuarioId: u.id, oportunidad: { publicada: true } },
      include: { oportunidad: { include: { entidad: true } } },
      orderBy: { creadaEn: "desc" },
    }),
    contextoAcciones(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Mi panel</h1>
        <p className="mt-2 text-suave">Las oportunidades que guardaste. Pronto verás aquí también tu ruta, tu checklist y tus alertas.</p>
      </div>
      <section aria-labelledby="titulo-guardadas" className="space-y-4">
        <h2 id="titulo-guardadas" className="titulo-seccion">
          Oportunidades guardadas ({guardadas.length})
        </h2>
        {guardadas.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {guardadas.map(({ oportunidad: o, creadaEn }) => (
              <li key={o.id}>
                <TarjetaOportunidad o={o} hoy={hoy}>
                  <p className="text-xs text-suave">La guardaste el {formatearFecha(creadaEn)}.</p>
                  <AccionesOportunidad id={o.id} nombre={o.nombre} rol={ctx.rol} guardada
                    enComparador={ctx.comparar.has(o.id)} volver="/panel" />
                </TarjetaOportunidad>
              </li>
            ))}
          </ul>
        ) : (
          <div className="tarjeta">
            <p className="font-semibold">Todavía no guardaste oportunidades.</p>
            <p className="mt-1 text-suave">
              Usa el botón «Guardar» en el <Link href="/catalogo" className="enlace">catálogo</Link> o en
              tus <Link href="/recomendaciones" className="enlace">recomendaciones</Link>.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
