import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIAS_REQUISITO } from "@/lib/catalogos";
import { aISO } from "@/lib/fechas";
import { FormOportunidad } from "@/components/FormulariosGestion";

export const metadata: Metadata = { title: "Ficha de oportunidad" };

/** Crear (id = "nueva") o editar una ficha de la entidad del gestor. */
export default async function EditarOportunidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await exigirRol(["gestor"], "/gestion");
  const tramites = await prisma.tramite.findMany({ where: { publicado: true }, orderBy: { orden: "asc" }, select: { id: true, nombre: true } });
  let inicial: Record<string, string | string[]> = { publicada: "si" };
  if (id !== "nueva") {
    const o = await prisma.oportunidad.findFirst({
      where: { id, entidadId: u.entidadId! },
      include: { requisitos: { orderBy: { orden: "asc" } }, tramites: true },
    });
    if (!o) notFound();
    inicial = {
      id: o.id, tipo: o.tipo, nombre: o.nombre, institucion: o.institucion, pais: o.pais, ciudad: o.ciudad,
      descripcion: o.descripcion, area: o.area, nivel: o.nivel, modalidad: o.modalidad, idioma: o.idioma,
      duracionMeses: String(o.duracionMeses), fechaInicio: aISO(o.fechaInicio), fechaApertura: aISO(o.fechaApertura),
      fechaCierre: aISO(o.fechaCierre), costoMatricula: String(o.costoMatricula), costoVidaMensual: String(o.costoVidaMensual),
      otrosCostos: String(o.otrosCostos), otrosCostosDetalle: o.otrosCostosDetalle, moneda: o.moneda,
      financiamientoTipo: o.financiamientoTipo, cobertura: o.cobertura, entidadFinanciadora: o.entidadFinanciadora,
      coberturaMatriculaPct: String(o.coberturaMatriculaPct), cubreManutencion: o.cubreManutencion ? "si" : "no",
      enlaceOficial: o.enlaceOficial, publicada: o.publicada ? "si" : "no",
      tramites: o.tramites.map((t) => t.tramiteId),
      ...Object.fromEntries(Object.keys(CATEGORIAS_REQUISITO).map((c) => [
        `requisitos_${c}`, o.requisitos.filter((r) => r.categoria === c).map((r) => r.descripcion).join("\n"),
      ])),
    };
  }
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <nav aria-label="Ruta de navegación" className="text-sm"><Link href="/gestion" className="enlace">← Volver a gestión de contenidos</Link></nav>
      <h1 className="titulo-pagina">{id === "nueva" ? "Nueva ficha de oportunidad" : `Editar: ${inicial.nombre}`}</h1>
      <p className="text-suave">Ficha estándar de {u.entidad?.nombre}. Se publicará con tu nombre como responsable de la actualización.</p>
      <FormOportunidad inicial={inicial} tramites={tramites} />
    </div>
  );
}
