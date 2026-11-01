import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BannerPrototipo } from "@/components/BannerPrototipo";
import { Encabezado } from "@/components/Encabezado";
import { obtenerFechaSimulada } from "@/lib/hoy";
import { formatearFecha } from "@/lib/fechas";

export const metadata: Metadata = {
  title: {
    default: "Talento sin Fronteras – Prototipo",
    template: "%s · Talento sin Fronteras – Prototipo",
  },
  description:
    "Talento sin Fronteras: encuentra, compara y prepara tu posgrado en el exterior. Prototipo académico con datos ficticios.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Las páginas dependen de la sesión y de la fecha simulada: se generan en cada solicitud.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const simulada = await obtenerFechaSimulada();
  return (
    <html lang="es-PE">
      <body className="min-h-screen antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-12 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-marca"
        >
          Saltar al contenido
        </a>
        <BannerPrototipo fechaSimulada={simulada ? formatearFecha(simulada) : undefined} />
        <Encabezado />
        <main id="contenido" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {children}
        </main>
        <footer className="mt-12 border-t border-borde bg-white">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm text-suave">
            <p>
              <strong>Talento sin Fronteras</strong> · Encuentra, compara y prepara tu posgrado en el exterior. Prototipo académico del Programa de Gobernabilidad e
              Innovación Pública PUCP–CAF.
              Las oportunidades, becas, universidades y enlaces son ficticios. Las entidades públicas se mencionan
              solo como ejemplo de quién publicaría cada información.
            </p>
            <p>
              Talento sin Fronteras informa y deriva: no recibe postulaciones ni realiza trámites. Los plazos y costos de
              trámites son referenciales: verifícalos en el sitio oficial de cada entidad.
            </p>
            <p>
              <a href="/guia" className="enlace">Guía de uso: tu ruta al posgrado en seis pasos</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
