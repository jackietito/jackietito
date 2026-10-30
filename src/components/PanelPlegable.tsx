"use client";

import { useId, useState } from "react";

/**
 * Panel que en móvil se pliega con un botón y en pantallas grandes siempre se muestra.
 * Usado para los filtros del catálogo.
 */
export function PanelPlegable({
  titulo,
  abiertoInicial = false,
  children,
}: {
  titulo: string;
  abiertoInicial?: boolean;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
        className="btn-secundario w-full lg:hidden"
      >
        {abierto ? `Ocultar ${titulo.toLowerCase()}` : `Mostrar ${titulo.toLowerCase()}`}
      </button>
      <div id={id} className={`${abierto ? "block" : "hidden"} mt-3 lg:mt-0 lg:block`}>
        {children}
      </div>
    </div>
  );
}
