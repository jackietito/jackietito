import type { Metadata } from "next";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatearFecha } from "@/lib/fechas";
import { FormRespuesta } from "@/components/FormulariosSeguimiento";

export const metadata: Metadata = { title: "Bandeja de consultas" };

/** Bandeja del orientador (RF14). Muestra la región y universidad, no el correo, del ciudadano (D26). */
export default async function Bandeja({ searchParams }: { searchParams: Promise<{ respondida?: string }> }) {
  const { respondida } = await searchParams;
  await exigirRol(["orientador"], "/bandeja");
  const consultas = await prisma.consulta.findMany({
    include: { usuario: { include: { perfil: true } }, oportunidad: true, orientador: true },
    orderBy: { creadaEn: "asc" },
  });
  const pendientes = consultas.filter((c) => !c.respuesta);
  const respondidas = consultas.filter((c) => c.respuesta).reverse();

  const Datos = ({ c }: { c: (typeof consultas)[number] }) => (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-marca bg-marca-clara px-2 py-0.5 font-bold text-marca-oscura">{c.tema}</span>
        <span className="text-suave">Recibida el {formatearFecha(c.creadaEn)}</span>
      </div>
      <p className="text-sm text-suave">
        Persona de {c.usuario.perfil?.region ?? "región no indicada"}
        {c.usuario.perfil && <> · {c.usuario.perfil.universidadOrigen}</>}
        {c.oportunidad && <> · Sobre: {c.oportunidad.nombre}</>}
      </p>
      <p><strong>Consulta:</strong> {c.pregunta}</p>
    </>
  );

  return (
    <div className="space-y-8">
      {respondida && (
        <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          Enviamos tu respuesta. La persona recibirá una alerta.
        </p>
      )}
      <div>
        <h1 className="titulo-pagina">Bandeja de consultas</h1>
        <p className="mt-2 text-suave">Consultas derivadas por los ciudadanos desde el canal de orientación. Primero las más antiguas.</p>
      </div>
      <section aria-labelledby="titulo-pendientes" className="space-y-3">
        <h2 id="titulo-pendientes" className="titulo-seccion">Pendientes ({pendientes.length})</h2>
        {pendientes.length ? (
          <ul className="space-y-4">
            {pendientes.map((c) => (
              <li key={c.id}>
                <article className="tarjeta space-y-3" aria-label={`Consulta sobre ${c.tema} del ${formatearFecha(c.creadaEn)}`}>
                  <Datos c={c} />
                  <FormRespuesta consultaId={c.id} />
                </article>
              </li>
            ))}
          </ul>
        ) : <p className="text-suave">No hay consultas pendientes.</p>}
      </section>
      <section aria-labelledby="titulo-respondidas" className="space-y-3">
        <h2 id="titulo-respondidas" className="titulo-seccion">Respondidas ({respondidas.length})</h2>
        <ul className="space-y-3">
          {respondidas.map((c) => (
            <li key={c.id} className="tarjeta space-y-2">
              <Datos c={c} />
              <p className="rounded-lg bg-marca-clara p-3">
                <strong>Respuesta</strong> ({c.orientador?.nombre ?? "orientador"}, {c.respondidaEn ? formatearFecha(c.respondidaEn) : ""}): {c.respuesta}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
