import type { Metadata } from "next";
import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TEMAS_ORIENTACION } from "@/lib/catalogos";
import { formatearFecha } from "@/lib/fechas";
import { PREGUNTAS_FRECUENTES } from "@/lib/faq";
import { DIRECTORIO, FECHA_VERIFICACION, FINANCIAMIENTO, type Contacto } from "@/lib/directorio";
import { FormConsulta } from "@/components/FormulariosSeguimiento";

export const metadata: Metadata = { title: "Orientación" };

const ancla = (t: string) => `tema-${t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "-")}`;

/** Tarjeta de una entidad o programa con sus enlaces oficiales (se abren en otra pestaña). */
function TarjetaContacto({ c }: { c: Contacto }) {
  const externo = (texto: string, url: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="enlace break-words">
      {texto}<span className="sr-only"> (sitio oficial, se abre en una pestaña nueva)</span> <span aria-hidden="true">↗</span>
    </a>
  );
  return (
    <li className="tarjeta space-y-1">
      <h3 className="font-bold text-marca-oscura">{c.nombre}{c.sigla && <span className="text-suave"> ({c.sigla})</span>}</h3>
      <p className="text-sm">{c.paraQue}</p>
      <p className="text-sm">Sitio oficial: {externo(c.sitio.texto, c.sitio.url)}</p>
      {c.otros && (
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {c.otros.map((o) => <li key={o.url}>{externo(o.texto, o.url)}</li>)}
        </ul>
      )}
    </li>
  );
}

export default async function Orientacion({ searchParams }: { searchParams: Promise<{ enviada?: string }> }) {
  const { enviada } = await searchParams;
  const u = await usuarioActual();
  const esCiudadano = u?.rol === "ciudadano";
  const [consultas, guardadas] = esCiudadano
    ? await Promise.all([
        prisma.consulta.findMany({ where: { usuarioId: u.id }, include: { oportunidad: true }, orderBy: { creadaEn: "desc" } }),
        prisma.guardada.findMany({ where: { usuarioId: u.id }, include: { oportunidad: true } }),
      ])
    : [[], []];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-pagina">Orientación</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Respuestas a las dudas más comunes, por tema. Si no encuentras la tuya, escríbele a un orientador.
        </p>
        <nav aria-label="Temas" className="mt-3">
          <ul className="flex flex-wrap gap-2">
            <li><a href="#directorio" className="inline-flex min-h-11 items-center rounded-full border border-marca bg-marca px-3 text-sm font-semibold text-white">Directorio oficial</a></li>
            <li><a href="#financiamiento" className="inline-flex min-h-11 items-center rounded-full border border-marca bg-marca px-3 text-sm font-semibold text-white">Financiamiento</a></li>
            {TEMAS_ORIENTACION.map((t) => (
              <li key={t}><a href={`#${ancla(t)}`} className="inline-flex min-h-11 items-center rounded-full border border-marca bg-white px-3 text-sm font-semibold text-marca">{t}</a></li>
            ))}
          </ul>
        </nav>
      </div>

      <section aria-labelledby="titulo-faq" className="space-y-6">
        <h2 id="titulo-faq" className="titulo-seccion">Preguntas frecuentes</h2>
        {TEMAS_ORIENTACION.map((t) => (
          <section key={t} aria-labelledby={ancla(t)} className="space-y-2">
            <h3 id={ancla(t)} className="text-lg font-bold">{t}</h3>
            {PREGUNTAS_FRECUENTES[t].map((p) => (
              <details key={p.pregunta} className="tarjeta">
                <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-marca-oscura">{p.pregunta}</summary>
                <p className="mt-2">{p.respuesta}</p>
              </details>
            ))}
          </section>
        ))}
      </section>

      <section id="directorio" aria-labelledby="titulo-directorio" className="space-y-3">
        <h2 id="titulo-directorio" className="titulo-seccion">Directorio oficial de entidades</h2>
        <p className="max-w-3xl text-suave">
          Sitios oficiales de las entidades ante las que harás tus trámites. Sus teléfonos, correos y horarios están en la
          sección «Canales de atención» de cada sitio. Enlaces verificados el {FECHA_VERIFICACION}.
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {DIRECTORIO.map((c) => <TarjetaContacto key={c.nombre} c={c} />)}
        </ul>
      </section>

      <section id="financiamiento" aria-labelledby="titulo-financiamiento" className="space-y-3">
        <h2 id="titulo-financiamiento" className="titulo-seccion">Dónde buscar financiamiento</h2>
        <p className="max-w-3xl text-suave">
          Programas reales de becas para estudiar en el exterior. Revisa en cada sitio las convocatorias vigentes y sus
          requisitos. Enlaces verificados el {FECHA_VERIFICACION}.
        </p>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {FINANCIAMIENTO.map((c) => <TarjetaContacto key={c.nombre} c={c} />)}
        </ul>
      </section>

      <section aria-labelledby="titulo-consulta" className="tarjeta max-w-3xl space-y-4">
        <h2 id="titulo-consulta" className="titulo-seccion">¿No encontraste tu respuesta?</h2>
        {esCiudadano ? (
          <>
            <p className="text-suave">Un orientador te responderá aquí y te avisaremos en tus alertas.</p>
            <FormConsulta oportunidades={guardadas.map((g) => ({ id: g.oportunidadId, nombre: g.oportunidad.nombre }))} />
          </>
        ) : u ? (
          <p>El envío de consultas está disponible para las cuentas de ciudadano.</p>
        ) : (
          <p>
            Para escribirle a un orientador, <Link href="/ingresar?volver=/orientacion" className="enlace">ingresa</Link> o{" "}
            <Link href="/registro" className="enlace">crea una cuenta gratis</Link>.
          </p>
        )}
      </section>

      {esCiudadano && (
        <section id="mis-consultas" aria-labelledby="titulo-mis-consultas" className="max-w-3xl space-y-3">
          {enviada && (
            <p role="status" className="rounded-lg border border-exito bg-exito-claro p-3 font-semibold text-exito">
              Enviamos tu consulta. Te avisaremos cuando un orientador responda.
            </p>
          )}
          <h2 id="titulo-mis-consultas" className="titulo-seccion">Mis consultas</h2>
          {consultas.length ? (
            <ul className="space-y-3">
              {consultas.map((c) => (
                <li key={c.id} className="tarjeta space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-bold ${c.respuesta ? "border-exito bg-exito-claro text-exito" : "border-alerta bg-alerta-claro text-alerta"}`}>
                      {c.respuesta ? "Respondida" : "Pendiente de respuesta"}
                    </span>
                    <span className="text-suave">{c.tema} · {formatearFecha(c.creadaEn)}</span>
                  </div>
                  {c.oportunidad && <p className="text-sm text-suave">Sobre: {c.oportunidad.nombre}</p>}
                  <p><strong>Tu consulta:</strong> {c.pregunta}</p>
                  {c.respuesta && (
                    <p className="rounded-lg bg-marca-clara p-3"><strong>Respuesta del orientador:</strong> {c.respuesta}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-suave">Todavía no enviaste consultas.</p>
          )}
        </section>
      )}
    </div>
  );
}
