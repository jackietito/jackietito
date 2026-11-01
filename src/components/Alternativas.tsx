// Alternativas cuando una convocatoria ya no es alcanzable (D63): oportunidades
// similares que cierran después, con su urgencia y un enlace a la ficha.
import Link from "next/link";
import type { Oportunidad } from "@prisma/client";
import { formatearFecha } from "@/lib/fechas";
import { Bandera } from "./Bandera";
import { EtiquetaUrgencia } from "./oportunidad";

export function Alternativas({ lista, hoy }: { lista: Oportunidad[]; hoy: Date }) {
  if (!lista.length) {
    return (
      <p className="text-sm">
        No encontramos oportunidades parecidas que cierren después. Busca otras en el{" "}
        <Link href="/catalogo?estado=abierta" className="enlace">catálogo</Link> o en tus{" "}
        <Link href="/recomendaciones" className="enlace">recomendaciones</Link>.
      </p>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {lista.map((s) => (
        <li key={s.id} className="rounded-[var(--radius-control)] border border-borde bg-white p-3 text-sm text-texto">
          <p className="mb-1 inline-flex items-center gap-1.5 text-meta"><Bandera pais={s.pais} />{s.pais}</p>
          <Link href={`/oportunidades/${s.id}`} className="enlace block font-bold">{s.nombre}</Link>
          <p className="text-suave">{s.institucion}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span>Cierra el {formatearFecha(s.fechaCierre)}</span>
            <EtiquetaUrgencia o={s} hoy={hoy} />
          </p>
        </li>
      ))}
    </ul>
  );
}
