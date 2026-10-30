import type { Metadata } from "next";
import Link from "next/link";
import { exigirRol } from "@/lib/auth";

export const metadata: Metadata = { title: "Bandeja de consultas" };

// Página provisional: el módulo se construye en el incremento 4 (decisión D19).
export default async function Pagina() {
  const u = await exigirRol(["orientador"], "/bandeja");
  return (
    <div className="space-y-4">
      <h1 className="titulo-pagina">Bandeja de consultas</h1>
      <div className="tarjeta space-y-2">
        <p>Hola, {u.nombre ?? u.email}{u.entidad ? ` (${u.entidad.nombre})` : ""}.</p>
        <p>Desde aquí podrás responder las consultas que derivan los ciudadanos. Este módulo se habilita en el incremento 4 del prototipo.</p>
        <p>Mientras tanto, puedes revisar el <Link href="/catalogo" className="enlace">catálogo de oportunidades</Link>.</p>
      </div>
    </div>
  );
}
