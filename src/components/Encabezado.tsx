import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { ROLES, etiqueta } from "@/lib/catalogos";

type Enlace = { href: string; texto: string };

function enlacesPorRol(rol: string | undefined): Enlace[] {
  const publicos: Enlace[] = [
    { href: "/catalogo", texto: "Catálogo" },
  ];
  switch (rol) {
    default:
      return publicos;
  }
}

/** Encabezado con navegación adaptada al rol. En móvil el menú se despliega con <details> (sin JavaScript). */
export async function Encabezado() {
  const usuario = await usuarioActual();
  const enlaces = enlacesPorRol(usuario?.rol);

  // El ingreso y el registro se incorporan en el incremento 2.
  const sesion = usuario ? <span className="text-sm">{usuario.nombre ?? usuario.email} ({etiqueta(ROLES, usuario.rol)})</span> : null;

  return (
    <header className="bg-marca-oscura text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex flex-col leading-tight text-white no-underline">
          <span className="text-lg font-bold">Ventanilla de Posgrado</span>
          <span className="text-xs text-white/85">Oportunidades de estudio en el exterior</span>
        </Link>

        {/* Navegación en pantallas medianas y grandes */}
        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold text-white hover:bg-white/10">
              {e.texto}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">{sesion}</div>

        {/* Menú móvil */}
        <details className="relative lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-white/40 px-3 font-semibold">
            Menú
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-borde bg-marca-oscura p-3 shadow-lg">
            <nav aria-label="Principal (móvil)" className="flex flex-col">
              {enlaces.map((e) => (
                <Link key={e.href} href={e.href} className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-white hover:bg-white/10">
                  {e.texto}
                </Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-white/20 pt-3">{sesion}</div>
          </div>
        </details>
      </div>
    </header>
  );
}
