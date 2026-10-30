"use client";
// Controles interactivos de la ruta: casillas del checklist (RF11) y estado
// de cada trámite. Guardan al instante y anuncian el resultado (aria-live).
import { useOptimistic, useState, useTransition } from "react";
import { cambiarEstadoTramite, marcarItem } from "@/lib/acciones-ruta";
import { ESTADOS_TRAMITE } from "@/lib/catalogos";

export function CasillaChecklist({ id, texto, completado }: { id: string; texto: string; completado: boolean }) {
  const [marcado, setMarcado] = useOptimistic(completado);
  const [error, setError] = useState(false);
  const [, iniciar] = useTransition();
  return (
    <div>
      <div className="flex min-h-11 items-start gap-3 py-1">
        <input
          id={`item-${id}`}
          type="checkbox"
          checked={marcado}
          onChange={(e) => {
            const valor = e.target.checked;
            iniciar(async () => {
              setMarcado(valor);
              const r = await marcarItem(id, valor);
              setError(!r.ok);
            });
          }}
          className="mt-0.5 h-6 w-6 shrink-0 accent-marca"
        />
        <label htmlFor={`item-${id}`} className={marcado ? "text-suave line-through" : ""}>{texto}</label>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-peligro">No pudimos guardar el cambio. Inténtalo de nuevo.</p>}
    </div>
  );
}

export function SelectorEstadoTramite({ avanceId, estado, tramite }: { avanceId: string; estado: string; tramite: string }) {
  const [valor, setValor] = useState(estado);
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  const id = `estado-${avanceId}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        Mi avance<span className="sr-only"> en {tramite}</span>:
      </label>
      <select
        id={id}
        value={valor}
        disabled={pendiente}
        onChange={(e) => {
          const nuevo = e.target.value;
          setValor(nuevo);
          iniciar(async () => {
            const r = await cambiarEstadoTramite(avanceId, nuevo);
            setMensaje(r.ok ? `Guardado: ${ESTADOS_TRAMITE[nuevo as keyof typeof ESTADOS_TRAMITE]}.` : "No pudimos guardar el cambio.");
          });
        }}
        className="min-h-11 rounded-lg border border-gray-400 bg-white px-3 text-base"
      >
        {Object.entries(ESTADOS_TRAMITE).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      <span aria-live="polite" className="text-sm text-suave">{mensaje}</span>
    </div>
  );
}
