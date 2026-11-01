import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FormEncuesta } from "@/components/FormulariosSeguimiento";

export const metadata: Metadata = { title: "Encuesta de satisfacción" };

export default async function Encuesta({ searchParams }: { searchParams: Promise<{ gracias?: string; oportunidad?: string; testimonio?: string }> }) {
  const { gracias, oportunidad, testimonio } = await searchParams;
  const u = await exigirRol(["ciudadano"], "/encuesta");
  const [guardadas, respondidas] = await Promise.all([
    prisma.guardada.findMany({ where: { usuarioId: u.id }, include: { oportunidad: true } }),
    prisma.encuesta.count({ where: { usuarioId: u.id } }),
  ]);

  if (gracias) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="titulo-pagina">¡Gracias por tu opinión!</h1>
        <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
          Guardamos tus respuestas. Nos ayudan a mejorar la información de Talento sin Fronteras.
        </p>
        {testimonio === "pendiente" && (
          <p className="rounded-lg border border-marca bg-marca-clara p-3 text-marca-oscura">
            Recibimos tu autorización para publicar tu comentario. El equipo de Talento sin Fronteras lo revisará y, cuando lo
            apruebe, aparecerá en «Experiencias» en la página de inicio, solo con tu región.
          </p>
        )}
        {testimonio === "sin-comentario" && (
          <p className="rounded-lg border border-alerta bg-alerta-claro p-3 text-alerta">
            Marcaste que autorizas publicar tu comentario, pero no escribiste ninguno. Si quieres compartir tu experiencia,{" "}
            <Link href="/encuesta" className="enlace">responde de nuevo</Link> y escribe un comentario.
          </p>
        )}
        <p>
          Puedes volver a <Link href="/panel" className="enlace">tu panel</Link> o{" "}
          <Link href="/encuesta" className="enlace">responder sobre otra oportunidad</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="titulo-pagina">Encuesta de satisfacción</h1>
      <p className="text-suave">
        Cuéntanos qué tan clara, suficiente, oportuna y útil te resultó la información. Toma menos de dos minutos.
        {respondidas > 0 && <> Ya respondiste {respondidas} {respondidas === 1 ? "vez" : "veces"}; si eliges la misma oportunidad, actualizaremos tu respuesta.</>}
      </p>
      <FormEncuesta
        oportunidades={guardadas.map((g) => ({ id: g.oportunidadId, nombre: g.oportunidad.nombre }))}
        inicial={oportunidad ? { oportunidadId: oportunidad } : undefined}
      />
    </div>
  );
}
