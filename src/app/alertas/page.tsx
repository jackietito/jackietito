import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { semaforo, sincronizarAlertas, type Semaforo } from "@/lib/alertas";
import { formatearFecha } from "@/lib/fechas";
import { marcarAlertaLeida, marcarTodasLeidas } from "@/lib/acciones-seguimiento";

export const metadata: Metadata = { title: "Mis alertas" };

const TIPOS: Record<string, { texto: string; clase: string }> = {
  vencimiento: { texto: "Vencimiento", clase: "border-peligro bg-peligro-claro text-peligro" },
  tramite: { texto: "Trámite", clase: "border-alerta bg-alerta-claro text-alerta" },
  nueva: { texto: "Nueva oportunidad", clase: "border-exito bg-exito-claro text-exito" },
  respuesta: { texto: "Orientación", clase: "border-marca bg-marca-clara text-marca-oscura" },
};

/** Colores del semáforo (D45), siempre acompañados de texto. */
const SEMAFORO: Record<Semaforo["nivel"], { chip: string; borde: string; banda: string; punto: string }> = {
  rojo: { chip: "border-peligro bg-peligro-claro text-peligro", borde: "border-l-peligro", banda: "bg-peligro", punto: "Rojo" },
  ambar: { chip: "border-alerta bg-alerta-claro text-alerta", borde: "border-l-amber-500", banda: "bg-amber-500", punto: "Ámbar" },
  verde: { chip: "border-exito bg-exito-claro text-exito", borde: "border-l-exito", banda: "bg-exito", punto: "Verde" },
};

/** Vista previa del correo que se enviaría (el envío es simulado, RF12). */
function CorreoSimulado({ para, titulo, mensaje, enlace, s }: {
  para: string; titulo: string; mensaje: string; enlace: string; s: Semaforo | null;
}) {
  return (
    <details className="rounded-lg border border-borde">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold text-marca">
        <span aria-hidden="true" className="mr-1">✉</span> Ver el correo que te enviaríamos (simulado)
      </summary>
      <div className="border-t border-borde bg-fondo p-3 text-sm">
        <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-suave">
          <dt>De:</dt><dd>Talento sin Fronteras &lt;avisos@ventanilla.test&gt;</dd>
          <dt>Para:</dt><dd className="break-all">{para}</dd>
          <dt>Asunto:</dt><dd className="font-semibold text-texto">{titulo}</dd>
        </dl>
        <div className="mt-3 overflow-hidden rounded-lg border border-borde bg-white">
          {s && <p className={`${SEMAFORO[s.nivel].banda} px-3 py-1.5 text-sm font-bold ${s.nivel === "ambar" ? "text-gray-900" : "text-white"}`}>{s.texto}</p>}
          <div className="space-y-2 p-3">
            <p>Hola:</p>
            <p>{mensaje}</p>
            <p><a href={enlace} className="enlace">Verlo en Talento sin Fronteras</a></p>
            <p className="text-xs text-suave">Correo de ejemplo del prototipo académico: no se envía de verdad.</p>
          </div>
        </div>
      </div>
    </details>
  );
}

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
          Los colores del semáforo te dicen qué atender primero: rojo, urgente; ámbar, pronto; verde, a tiempo.
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
            const s = semaforo(a);
            return (
              <li key={a.id}>
                <article aria-labelledby={`alerta-${a.id}`}
                  className={`tarjeta space-y-2 border-l-8 ${s ? SEMAFORO[s.nivel].borde : "border-l-marca"} ${a.leida ? "opacity-90" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-bold ${tipo.clase}`}>{tipo.texto}</span>
                    {s && (
                      <span className={`rounded-full border px-2 py-0.5 font-bold ${SEMAFORO[s.nivel].chip}`}>
                        <span className="sr-only">Semáforo {SEMAFORO[s.nivel].punto}: </span>{s.texto}
                      </span>
                    )}
                    {!a.leida && <span className="rounded-full bg-marca px-2 py-0.5 font-bold text-white">Sin leer</span>}
                    <span className="text-suave">{formatearFecha(a.creadaEn)}</span>
                  </div>
                  <h3 id={`alerta-${a.id}`} className="font-bold">
                    <Link href={a.enlace} className="text-marca-oscura underline-offset-4 hover:underline">{a.titulo}</Link>
                  </h3>
                  <p className="text-sm">{a.mensaje}</p>
                  {a.correoSimulado && (
                    <>
                      <p className="text-xs text-suave">
                        <span aria-hidden="true">✉ </span>También te lo enviamos por correo a {a.correoSimulado} (envío simulado en el prototipo).
                      </p>
                      <CorreoSimulado para={a.correoSimulado} titulo={a.titulo} mensaje={a.mensaje} enlace={a.enlace} s={s} />
                    </>
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
