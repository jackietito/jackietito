import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";

export const metadata: Metadata = { title: "Tablero de indicadores" };

// Página provisional: el módulo se construye en el incremento 5 (decisión D19).
export default async function Pagina() {
  const u = await exigirRol(["admin"], "/admin");
  return (
    <div className="space-y-4">
      <h1 className="titulo-pagina">Tablero de indicadores</h1>
      <div className="tarjeta space-y-2">
        <p>Hola, {u.nombre ?? u.email}{u.entidad ? ` (${u.entidad.nombre})` : ""}.</p>
        <p>Desde aquí podrás ver los indicadores, el reporte por entidad y cambiar la fecha simulada. Este módulo se habilita en el incremento 5 del prototipo.</p>
        <p>Mientras tanto, puedes revisar el <Link href="/catalogo" className="enlace">catálogo de oportunidades</Link>.</p>
      </div>
    </div>
  );
}
