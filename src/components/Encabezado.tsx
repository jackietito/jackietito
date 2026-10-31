import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { salir } from "@/lib/acciones";
import { leerComparador } from "@/lib/comparador";
import { ROLES, etiqueta } from "@/lib/catalogos";

type Enlace = { href: string; texto: string };

function enlacesPorRol(rol: string | undefined, enComparador: number, alertas: number): Enlace[] {
  const catalogo: Enlace = { href: "/catalogo", texto: "Catálogo" };
  const tramites: Enlace = { href: "/tramites", texto: "Trámites" };
  const comparador: Enlace = { href: "/comparador", texto: enComparador ? `Comparador (${enComparador})` : "Comparador" };
  const orientacion: Enlace = { href: "/orientacion", texto: "Orientación" };
  switch (rol) {
    case "ciudadano":
      return [
        catalogo,
        { href: "/recomendaciones", texto: "Recomendaciones" },
        tramites,
        comparador,
        { href: "/panel", texto: "Mi panel" },
        { href: "/alertas", texto: alertas ? `Alertas (${alertas})` : "Alertas" },
        orientacion,
        { href: "/perfil", texto: "Mi perfil" },
      ];
    case "gestor":
      return [catalogo, { href: "/gestion", texto: "Gestión de contenidos" }, { href: "/reporte", texto: "Reporte de mi entidad" }];
    case "orientador":
      return [catalogo, { href: "/bandeja", texto: "Bandeja de consultas" }];
    case "admin":
      return [catalogo, { href: "/admin", texto: "Tablero de indicadores" }, { href: "/reporte", texto: "Reporte por entidad" }];
    default:
      return [catalogo, tramites, comparador, orientacion];
  }
}

const claseEnlace = "inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 font-semibold text-white hover:bg-white/10";

/** Encabezado con navegación adaptada al rol. En móvil el menú se despliega con <details> (sin JavaScript). */
export async function Encabezado() {
  const [usuario, comparar] = await Promise.all([usuarioActual(), leerComparador()]);
  const alertas = usuario?.rol === "ciudadano"
    ? await prisma.alerta.count({ where: { usuarioId: usuario.id, leida: false } })
    : 0;
  const enlaces = enlacesPorRol(usuario?.rol, comparar.length, alertas);

  const sesion = usuario ? (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">
        <span className="sr-only">Sesión iniciada como </span>
        {usuario.nombre ?? usuario.email}{" "}
        <span className="text-white/85">({etiqueta(ROLES, usuario.rol)})</span>
      </span>
      <form action={salir}>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-lg border border-white/60 px-3 font-semibold hover:bg-white/10">
          Salir
        </button>
      </form>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/ingresar" className={claseEnlace}>Ingresar</Link>
      <Link href="/registro" className="inline-flex min-h-11 items-center rounded-lg bg-amber-400 px-3 font-bold text-gray-900 no-underline hover:bg-amber-300">
        Crear cuenta
      </Link>
    </div>
  );

  return (
    <header className="bg-marca-oscura text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex flex-col leading-tight text-white no-underline">
          <span className="text-lg font-bold">Ventanilla de Posgrado</span>
          <span className="text-xs text-white/85">Oportunidades de estudio en el exterior</span>
        </Link>

        <div className="hidden xl:block">{sesion}</div>

        {/* Menú móvil */}
        <details className="relative xl:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-white/40 px-3 font-semibold">
            Menú
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-borde bg-marca-oscura p-3 shadow-lg">
            <nav aria-label="Principal (móvil)" className="flex flex-col">
              {enlaces.map((e) => (
                <Link key={e.href} href={e.href} className={claseEnlace}>{e.texto}</Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-white/20 pt-3">{sesion}</div>
          </div>
        </details>
      </div>

      {/* Navegación en pantallas anchas, en una segunda fila */}
      <div className="hidden border-t border-white/15 xl:block">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-2 py-1">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className={claseEnlace}>{e.texto}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
