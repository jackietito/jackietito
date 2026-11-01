import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FormTramite } from "@/components/FormulariosGestion";

export const metadata: Metadata = { title: "Trámite" };

/** Crear (id = "nuevo") o editar un trámite a cargo de la entidad del gestor. */
export default async function EditarTramite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await exigirRol(["gestor"], "/gestion");
  let inicial: Record<string, string> = { publicado: "si" };
  if (id !== "nuevo") {
    const t = await prisma.tramite.findFirst({ where: { id, entidadId: u.entidadId! } });
    if (!t) notFound();
    inicial = {
      id: t.id, nombre: t.nombre, entidadResponsable: t.entidadResponsable, descripcion: t.descripcion,
      documentos: t.documentos, plazoDias: String(t.plazoDias), costoReferencial: String(t.costoReferencial),
      orden: String(t.orden), anticipacionDias: String(t.anticipacionDias), enlaceOficial: t.enlaceOficial,
      publicado: t.publicado ? "si" : "no",
    };
  }
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <nav aria-label="Ruta de navegación" className="text-sm"><Link href="/gestion#tramites" className="enlace">← Volver a gestión de contenidos</Link></nav>
      <h1 className="titulo-pagina">{id === "nuevo" ? "Nuevo trámite" : `Editar trámite: ${inicial.nombre}`}</h1>
      <p className="text-suave">Las entidades responsables se nombran con su nombre real; los plazos y costos se muestran a los ciudadanos como ilustrativos, no oficiales.</p>
      <FormTramite inicial={inicial} />
    </div>
  );
}
