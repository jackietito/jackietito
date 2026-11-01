"use client";
// Pestañas accesibles (patrón ARIA «tabs», D62): flechas izquierda/derecha, Inicio y
// Fin para moverse; cada panel queda en el documento aunque esté oculto.
import { useId, useRef, useState } from "react";

export type Pestana = { id: string; titulo: string; contenido: React.ReactNode };

export function Pestanas({ pestanas, etiqueta }: { pestanas: Pestana[]; etiqueta: string }) {
  const [activa, setActiva] = useState(0);
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  function mover(i: number) {
    const n = (i + pestanas.length) % pestanas.length;
    setActiva(n);
    botones.current[n]?.focus();
  }
  return (
    <div>
      <div role="tablist" aria-label={etiqueta} className="flex gap-1 overflow-x-auto border-b border-borde">
        {pestanas.map((p, i) => (
          <button key={p.id} ref={(el) => { botones.current[i] = el; }} type="button" role="tab"
            id={`${base}-tab-${p.id}`} aria-controls={`${base}-panel-${p.id}`} aria-selected={i === activa} tabIndex={i === activa ? 0 : -1}
            onClick={() => setActiva(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); mover(i + 1); }
              if (e.key === "ArrowLeft") { e.preventDefault(); mover(i - 1); }
              if (e.key === "Home") { e.preventDefault(); mover(0); }
              if (e.key === "End") { e.preventDefault(); mover(pestanas.length - 1); }
            }}
            className={`-mb-px min-h-11 shrink-0 border-b-4 px-4 font-bold transition-colors duration-150 ${
              i === activa ? "border-acento text-marca-oscura" : "border-transparent text-suave hover:text-marca-oscura"
            }`}>
            {p.titulo}
          </button>
        ))}
      </div>
      {pestanas.map((p, i) => (
        <div key={p.id} role="tabpanel" id={`${base}-panel-${p.id}`} aria-labelledby={`${base}-tab-${p.id}`}
          hidden={i !== activa} tabIndex={0} className="anima-entrada pt-4 focus-visible:outline-offset-4">
          {p.contenido}
        </div>
      ))}
    </div>
  );
}
