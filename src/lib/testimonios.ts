// Testimonios (D50). Los reales salen de comentarios de la encuesta que la persona
// autorizó publicar y que el administrador aprobó. Mientras no haya suficientes,
// se completan con testimonios ilustrativos de los personajes del storyboard,
// siempre rotulados como tales: no son personas reales.
import "server-only";
import { prisma } from "./db";

export type Testimonio = { texto: string; quien: string; ilustrativo: boolean; sobre?: string };

const ILUSTRATIVOS: Testimonio[] = [
  {
    texto: "No sabía que existían becas para alguien como yo. Encontré varias en un solo lugar, y la ruta me dijo qué trámite empezar primero.",
    quien: "Rosa, titulada en Ayacucho",
    ilustrativo: true,
  },
  {
    texto: "El checklist me ordenó la postulación: ya tengo el examen de idioma y el diploma en trámite, sin perderme ninguna fecha.",
    quien: "Diego, ingeniero en Lima",
    ilustrativo: true,
  },
  {
    texto: "Comparé dos especializaciones virtuales lado a lado y elegí la que cabía en mi presupuesto.",
    quien: "Lucía, profesional en Arequipa",
    ilustrativo: true,
  },
];

/** Hasta `cuantos` testimonios: primero los reales aprobados, luego los ilustrativos. */
export async function obtenerTestimonios(cuantos = 3): Promise<Testimonio[]> {
  const aprobados = await prisma.encuesta.findMany({
    where: { publicacion: "aprobado", comentario: { not: "" } },
    include: { usuario: { include: { perfil: true } }, oportunidad: true },
    orderBy: [{ creadaEn: "desc" }, { id: "desc" }],
    take: cuantos,
  });
  const reales: Testimonio[] = aprobados.map((e) => ({
    texto: e.comentario,
    quien: `Persona de ${e.usuario.perfil?.region ?? "Perú"}`,
    sobre: e.oportunidad?.nombre,
    ilustrativo: false,
  }));
  return [...reales, ...ILUSTRATIVOS].slice(0, cuantos);
}
