import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { sincronizarAlertas } from "@/lib/alertas";
import { formatearFecha } from "@/lib/fechas";
import { marcarAlertaLeida, marcarTodasLeidas } from "@/lib/acciones-seguimiento";

export const metadata: Metadata = { title: "Mis alertas" };

const TIPOS: Record<string, { texto: string; clase: string }> = {
  vencimiento: { texto: "Vencimiento", clase: "border-peligro bg-peligro-claro text-peligro" },
  tramite: { texto: "Trámite", clase: "border-alerta bg-alerta-claro text-alerta" },
  nueva: { texto: "Nueva oportunidad", clase: "border-exito bg-exito-claro text-exito" },
  respuesta: { texto: "Orientación", clase: "border-marca bg-marca-clara text-marca-oscura" },
};

export default async function Alertas() {
  const u = await exigirRol(["ciudadano"], "/alertas");
  await sincronizarAlertas(prisma, u.id, await obtenerHoy());
  const alertas = await prisma.alerta.findMany({ where: { usuarioId: u.id }, orderBy: [{ leida: "asc" }, { creadaEn: "desc" }] });
  const sinLeer = alertas.filter((a) => !a.leida).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Mis alertas</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Te avisamos cuando una convocatoria que guardaste está a 30, 15 o 7 días de cerrar, cuando se acerca la fecha de un
          trámite de tu ruta, cuando se publica una oportunidad para tu perfil y cuando responden tu consulta.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{sinLeer === 1 ? "1 alerta sin leer" : `${sinLeer} alertas sin leer`}</h2>
        {sinLeer > 0 && (
          <form action={marcarTodasLeidas}>
            <button type="submit" className="btn-secundario text-sm">Marcar todas como leídas</button>
          </form>
        )}
      </div>
      {alertas.length ? (
        <ul className="space-y-3">
          {alertas.map((a) => {
            const tipo = TIPOS[a.tipo] ?? TIPOS.nueva;
            return (
              <li key={a.id}>
                <article aria-labelledby={`alerta-${a.id}`} className={`tarjeta space-y-2 ${a.leida ? "opacity-90" : "border-l-4 border-l-marca"}`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-bold ${tipo.clase}`}>{tipo.texto}</span>
                    {!a.leida && <span className="rounded-full bg-marca px-2 py-0.5 font-bold text-white">Sin leer</span>}
                    <span className="text-suave">{formatearFecha(a.creadaEn)}</span>
                  </div>
                  <h3 id={`alerta-${a.id}`} className="font-bold">
                    <Link href={a.enlace} className="text-marca-oscura underline-offset-4 hover:underline">{a.titulo}</Link>
                  </h3>
                  <p className="text-sm">{a.mensaje}</p>
                  {a.correoSimulado && (
                    <p className="text-xs text-suave">
                      <span aria-hidden="true">✉ </span>También te lo enviamos por correo a {a.correoSimulado} (envío simulado en el prototipo).
                    </p>
                  )}
                  {!a.leida && (
                    <form action={marcarAlertaLeida}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="enlace text-sm" aria-label={`Marcar como leída: ${a.titulo}`}>Marcar como leída</button>
                    </form>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="tarjeta">
          <p className="font-semibold">No tienes alertas por ahora.</p>
          <p className="mt-1 text-suave">Guarda oportunidades y genera tu ruta para recibir avisos antes de los plazos.</p>
        </div>
      )}
    </div>
  );
}
