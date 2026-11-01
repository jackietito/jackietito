"use client";
// Preguntas frecuentes con búsqueda en vivo (D64). Sin texto, se ven por tema y
// plegadas; al escribir, se filtran (sin importar tildes ni mayúsculas), se abren
// las que coinciden y se anuncia cuántas hay.
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

type Pregunta = { pregunta: string; respuesta: string };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function BuscadorFaq({ temas, anclas }: { temas: [string, Pregunta[]][]; anclas: Record<string, string> }) {
  const [q, setQ] = useState("");
  const terminos = normalizar(q).split(/\s+/).filter(Boolean);
  const filtrados = useMemo(
    () => temas
      .map(([t, l]) => [t, terminos.length ? l.filter((p) => terminos.every((x) => normalizar(`${p.pregunta} ${p.respuesta} ${t}`).includes(x))) : l] as const)
      .filter(([, l]) => l.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [temas, q],
  );
  const total = filtrados.reduce((n, [, l]) => n + l.length, 0);
  const buscando = terminos.length > 0;

  return (
    <div className="space-y-6">
      <div role="search" className="max-w-2xl">
        <label htmlFor="buscar-faq" className="font-semibold">Busca tu duda</label>
        <div className="relative mt-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-suave" />
          <input id="buscar-faq" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
            placeholder="Ej.: apostilla, beca integral, idioma"
            className="min-h-12 w-full rounded-[var(--radius-control)] border border-borde bg-white pl-10 pr-12 text-base [&::-webkit-search-cancel-button]:appearance-none" />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Borrar la búsqueda"
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-suave hover:text-texto">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-1 min-h-5 text-sm text-suave">
          {buscando ? (total === 1 ? "1 pregunta encontrada" : `${total} preguntas encontradas`) : ""}
        </p>
      </div>

      {buscando && total === 0 && (
        <p className="tarjeta">
          No encontramos preguntas con «{q}». Prueba con otra palabra o{" "}
          <a href="#titulo-consulta" className="enlace">escríbele a un orientador</a>.
        </p>
      )}

      {filtrados.map(([t, lista]) => (
        <section key={t} aria-labelledby={anclas[t]} className="space-y-2">
          <h3 id={anclas[t]} className="text-lg font-bold">{t}</h3>
          {lista.map((p) => (
            <details key={`${p.pregunta}-${buscando}`} open={buscando} className="tarjeta">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-marca-oscura">{p.pregunta}</summary>
              <p className="mt-2">{p.respuesta}</p>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
