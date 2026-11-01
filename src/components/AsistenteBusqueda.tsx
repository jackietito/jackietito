"use client";
// Asistente de 3 preguntas con opciones de un toque (D60): qué estudiar, dónde y si
// necesita beca. Al responder la última, lleva al catálogo ya filtrado. Pensado para
// quien aún no sabe qué buscar.
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ISO2 } from "@/lib/paises";

type Respuestas = { area?: string; pais?: string };
const NO_SE = "";

export function AsistenteBusqueda({ areas, paises }: { areas: readonly string[]; paises: string[] }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [r, setR] = useState<Respuestas>({});
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);

  // Al cambiar de pregunta, el foco va a su título (útil con lector de pantalla y teclado).
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return; }
    titulo.current?.focus();
  }, [paso]);

  function terminar(beca: boolean) {
    const q = new URLSearchParams();
    if (r.area) q.append("area", r.area);
    if (r.pais) q.append("pais", r.pais);
    if (beca) for (const f of ["integral", "parcial", "credito"]) q.append("financiamiento", f);
    router.push(`/catalogo${q.toString() ? `?${q}` : ""}`);
  }

  const boton = "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-marca-100 bg-white px-4 py-2 text-left font-bold text-marca-oscura transition-colors duration-150 hover:border-marca hover:bg-marca-clara";
  const PREGUNTAS = ["¿Qué te gustaría estudiar?", "¿Dónde te gustaría estudiar?", "¿Necesitas una beca o crédito?"];

  return (
    <section aria-labelledby="asistente-titulo" className="rounded-[var(--radius-panel)] bg-white p-4 text-texto shadow-[var(--shadow-elevada)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-acento">¿No sabes por dónde empezar? · Pregunta {paso + 1} de 3</p>
        {paso > 0 && (
          <button type="button" onClick={() => setPaso(paso - 1)} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-marca underline">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Atrás
          </button>
        )}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-marca-clara" aria-hidden="true">
        <div className="h-full rounded-full bg-acento transition-[width] duration-250" style={{ width: `${((paso + 1) / 3) * 100}%` }} />
      </div>
      <h2 id="asistente-titulo" ref={titulo} tabIndex={-1} className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-marca-oscura">
        {PREGUNTAS[paso]}
      </h2>
      <div key={paso} className="anima-entrada mt-3">
        {paso === 0 && (
          <ul className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a}><button type="button" className={boton} onClick={() => { setR({ ...r, area: a }); setPaso(1); }}>{a}</button></li>
            ))}
            <li><button type="button" className={`${boton} border-dashed`} onClick={() => { setR({ ...r, area: NO_SE }); setPaso(1); }}>No sé aún</button></li>
          </ul>
        )}
        {paso === 1 && (
          <ul className="flex flex-wrap gap-2">
            {paises.map((p) => (
              <li key={p}>
                <button type="button" className={boton} onClick={() => { setR({ ...r, pais: p }); setPaso(2); }}>
                  {ISO2[p] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/banderas/${ISO2[p]}.svg`} alt="" width={20} height={15} className="h-[15px] w-5 rounded-[2px] object-cover ring-1 ring-black/10" />
                  )}
                  {p}
                </button>
              </li>
            ))}
            <li><button type="button" className={`${boton} border-dashed`} onClick={() => { setR({ ...r, pais: NO_SE }); setPaso(2); }}>No sé aún</button></li>
          </ul>
        )}
        {paso === 2 && (
          <ul className="flex flex-wrap gap-2">
            <li><button type="button" className={boton} onClick={() => terminar(true)}>Sí, necesito beca o crédito</button></li>
            <li><button type="button" className={boton} onClick={() => terminar(false)}>No necesariamente</button></li>
          </ul>
        )}
      </div>
    </section>
  );
}
