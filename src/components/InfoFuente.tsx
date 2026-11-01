"use client";
// Ícono «i» con la fuente, la actualización y el aviso de ficha de ejemplo (D58).
// Funciona con toque, clic y teclado; Escape lo cierra. El texto está siempre en el
// documento (oculto hasta abrir), para que también lo lean los buscadores internos.
import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function InfoFuente({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", cerrar);
    document.addEventListener("mousedown", cerrar);
    return () => {
      document.removeEventListener("keydown", cerrar);
      document.removeEventListener("mousedown", cerrar);
    };
  }, [abierto]);
  return (
    <div ref={raiz} className="relative">
      <button type="button" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((v) => !v)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-meta hover:bg-marca-clara hover:text-marca"
        aria-label={`Fuente y actualización: ${nombre}`}>
        <Info aria-hidden="true" className="h-5 w-5" />
      </button>
      <div id={id} role="note" hidden={!abierto}
        className="anima-entrada absolute bottom-full right-0 z-30 mb-1 w-64 rounded-[var(--radius-tarjeta)] border border-borde bg-white p-3 text-xs text-suave shadow-[var(--shadow-elevada)]">
        {children}
      </div>
    </div>
  );
}
