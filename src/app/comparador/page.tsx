import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { MAX_COMPARAR, leerComparador } from "@/lib/comparador";
import { vaciarComparador } from "@/lib/acciones";
import {
  CATEGORIAS_REQUISITO, FINANCIAMIENTOS, MODALIDADES, NIVELES, TIPOS, etiqueta,
} from "@/lib/catalogos";
import { diasEntre, formatearFecha } from "@/lib/fechas";
import { costoTotal, costoTotalUsd, estadoConvocatoria, formatearMonto, pagariasPen } from "@/lib/oportunidades";
import { soles } from "@/lib/tramites";
import { usuarioActual } from "@/lib/auth";
import { recomendar } from "@/lib/recomendaciones";
import { Award } from "lucide-react";
import { EtiquetaEstado, TarjetaOportunidad, textoPlazo } from "@/components/oportunidad";
import { BotonComparar } from "@/components/BotonesOportunidad";

export const metadata: Metadata = { title: "Comparador de oportunidades" };

/** Grupos en los que se resaltan las diferencias (RF07). */
type Grupo = "general" | "plazos" | "costos" | "financiamiento" | "requisitos";

type Fila = {
  titulo: string;
  grupo: Grupo;
  /** Contenido de cada columna */
  celdas: React.ReactNode[];
  /** Valor comparable de cada columna, para detectar diferencias */
  claves: string[];
  /** Columnas destacadas (p. ej. el menor costo) con su texto */
  destacadas?: { indice: number; texto: string }[];
};

const RESALTAR: Grupo[] = ["plazos", "costos", "financiamiento", "requisitos"];

async function cargar(ids: string[]) {
  const lista = await prisma.oportunidad.findMany({
    where: { id: { in: ids }, publicada: true },
    include: { entidad: true, requisitos: { orderBy: { orden: "asc" } } },
  });
  // Conserva el orden en que se agregaron al comparador.
  return ids.map((id) => lista.find((o) => o.id === id)).filter((o) => o !== undefined);
}

/**
 * Sugerencias para llenar el comparador (D64): las más recomendadas según el perfil;
 * sin perfil, las destacadas vigentes que cierran primero. Nunca las que ya están.
 */
async function sugerencias(excluir: string[], hoy: Date, cuantas: number) {
  const [u, todas] = await Promise.all([
    usuarioActual(),
    prisma.oportunidad.findMany({ where: { publicada: true }, include: { entidad: true } }),
  ]);
  const libres = todas.filter((o) => !excluir.includes(o.id) && estadoConvocatoria(o, hoy) !== "cerrada");
  if (u?.rol === "ciudadano" && u.perfil) {
    const r = recomendar(u.perfil, libres, hoy).map((x) => x.oportunidad);
    if (r.length) return { porPerfil: true, lista: r.slice(0, cuantas) };
  }
  const orden = [...libres].sort((a, b) => Number(b.destacada) - Number(a.destacada) || a.fechaCierre.getTime() - b.fechaCierre.getTime());
  return { porPerfil: false, lista: orden.slice(0, cuantas) };
}

function Sugerencias({ lista, porPerfil, hoy, titulo }: { lista: Awaited<ReturnType<typeof sugerencias>>["lista"]; porPerfil: boolean; hoy: Date; titulo: string }) {
  if (!lista.length) return null;
  return (
    <section aria-labelledby="titulo-sugerencias" className="space-y-3">
      <h2 id="titulo-sugerencias" className="titulo-seccion">{titulo}</h2>
      <p className="text-sm text-suave">
        {porPerfil
          ? <>Elegidas según <Link href="/perfil" className="enlace">tu perfil</Link>.</>
          : <>Oportunidades destacadas y vigentes. <Link href="/perfil" className="enlace">Completa tu perfil</Link> para recibir sugerencias a tu medida.</>}
      </p>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lista.map((o) => (
          <li key={o.id}>
            <TarjetaOportunidad o={o} hoy={hoy}>
              <BotonComparar id={o.id} enComparador={false} nombre={o.nombre} textoAgregar="Agregar al comparador" />
            </TarjetaOportunidad>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Índices con el mejor valor; ninguno si todos son iguales o hay menos de dos para comparar. */
function mejor(valores: (number | null)[], mayor: boolean): number[] {
  const validos = valores.filter((v): v is number => v !== null);
  if (validos.length < 2 || new Set(validos).size === 1) return [];
  const top = mayor ? Math.max(...validos) : Math.min(...validos);
  return valores.flatMap((v, i) => (v === top ? [i] : []));
}

export default async function Comparador() {
  const [ids, hoy] = await Promise.all([leerComparador(), obtenerHoy()]);
  const fichas = await cargar(ids);
  const sug = fichas.length < MAX_COMPARAR ? await sugerencias(ids, hoy, MAX_COMPARAR - (fichas.length ? fichas.length : 0)) : null;

  if (fichas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="titulo-pagina">Comparador de oportunidades</h1>
        <div className="tarjeta space-y-2">
          <p className="font-semibold">Aún no agregaste fichas al comparador.</p>
          <p className="text-suave">
            Agrega hasta {MAX_COMPARAR} oportunidades para verlas lado a lado. Puedes empezar con estas sugerencias o
            usar el botón «Comparar» en el <Link href="/catalogo" className="enlace">catálogo</Link>.
          </p>
        </div>
        {sug && <Sugerencias {...sug} hoy={hoy} titulo="Sugerencias para empezar" />}
      </div>
    );
  }

  const m = (n: number, moneda: string) => formatearMonto(n, moneda);
  const usd = fichas.map((o) => costoTotalUsd(o));
  const menorCosto = mejor(usd, false);
  const pagos = fichas.map((o) => (o.financiamientoTipo === "integral" ? 0 : pagariasPen(o)));
  const menorPago = mejor(pagos, false);
  const cierreLejano = mejor(fichas.map((o) => (estadoConvocatoria(o, hoy) === "cerrada" ? null : o.fechaCierre.getTime())), true);
  // Cobertura: porcentaje de la matrícula más la manutención (vale como otro 100 %).
  const mayorCobertura = mejor(fichas.map((o) => o.coberturaMatriculaPct + (o.cubreManutencion ? 100 : 0)), true);
  const destacar = (indices: number[], texto: string) => indices.map((indice) => ({ indice, texto }));
  const fila = (titulo: string, grupo: Grupo, valores: string[], extra?: Partial<Fila>): Fila => ({
    titulo, grupo, celdas: valores, claves: valores, ...extra,
  });

  const filas: Fila[] = [
    fila("Tipo", "general", fichas.map((o) => etiqueta(TIPOS, o.tipo))),
    fila("Institución", "general", fichas.map((o) => o.institucion)),
    fila("País y ciudad", "general", fichas.map((o) => `${o.ciudad}, ${o.pais}`)),
    fila("Área de estudio", "general", fichas.map((o) => o.area)),
    fila("Nivel", "general", fichas.map((o) => etiqueta(NIVELES, o.nivel))),
    fila("Modalidad", "general", fichas.map((o) => etiqueta(MODALIDADES, o.modalidad))),
    fila("Idioma", "general", fichas.map((o) => o.idioma)),
    fila("Duración", "general", fichas.map((o) => `${o.duracionMeses} meses`)),
    {
      titulo: "Estado de la convocatoria", grupo: "plazos",
      celdas: fichas.map((o) => <EtiquetaEstado key={o.id} estado={estadoConvocatoria(o, hoy)} />),
      claves: fichas.map((o) => estadoConvocatoria(o, hoy)),
    },
    fila("Plazo", "plazos", fichas.map((o) => textoPlazo(o, hoy))),
    fila("Apertura", "plazos", fichas.map((o) => formatearFecha(o.fechaApertura))),
    fila("Cierre", "plazos", fichas.map((o) => formatearFecha(o.fechaCierre)), { destacadas: destacar(cierreLejano, "Cierre más lejano") }),
    fila("Inicio de clases", "plazos", fichas.map((o) => formatearFecha(o.fechaInicio))),
    fila("Matrícula", "costos", fichas.map((o) => m(o.costoMatricula, o.moneda))),
    fila("Costo de vida mensual", "costos", fichas.map((o) => (o.costoVidaMensual ? m(o.costoVidaMensual, o.moneda) : "No aplica"))),
    fila("Otros costos", "costos", fichas.map((o) => `${m(o.otrosCostos, o.moneda)} (${o.otrosCostosDetalle})`)),
    {
      titulo: "Costo total estimado", grupo: "costos",
      celdas: fichas.map((o, i) => (
        <span key={o.id}>
          <strong>{m(costoTotal(o), o.moneda)}</strong>
          {o.moneda !== "USD" && <span className="block text-sm text-suave">≈ {m(usd[i], "USD")}</span>}
        </span>
      )),
      claves: usd.map((n) => String(Math.round(n))),
      destacadas: destacar(menorCosto, "Menor costo total"),
    },
    {
      titulo: "Pagarías aprox.", grupo: "costos",
      celdas: fichas.map((o, i) => (
        <span key={o.id}>
          <strong>{o.financiamientoTipo === "integral" ? "S/ 0 en matrícula" : soles(pagos[i])}</strong>
          <span className="block text-sm text-suave">Costo total menos la cobertura</span>
        </span>
      )),
      claves: pagos.map(String),
      destacadas: destacar(menorPago, "Pagas menos"),
    },
    fila("Tipo de financiamiento", "financiamiento", fichas.map((o) => etiqueta(FINANCIAMIENTOS, o.financiamientoTipo))),
    fila("Cobertura", "financiamiento", fichas.map((o) => o.cobertura || "—"), { destacadas: destacar(mayorCobertura, "Mayor cobertura") }),
    fila("Entidad que financia", "financiamiento", fichas.map((o) => o.entidadFinanciadora || "—")),
    ...Object.entries(CATEGORIAS_REQUISITO).map(([cat, nombre]) => {
      const listas = fichas.map((o) => o.requisitos.filter((r) => r.categoria === cat).map((r) => r.descripcion));
      return {
        titulo: `Requisitos: ${nombre.toLowerCase()}`,
        grupo: "requisitos" as Grupo,
        celdas: listas.map((l, i) =>
          l.length ? (
            <ul key={i} className="list-disc space-y-1 pl-4">{l.map((r) => <li key={r}>{r}</li>)}</ul>
          ) : "—",
        ),
        claves: listas.map((l) => [...l].sort().join("|")),
      };
    }),
    fila("Fuente", "general", fichas.map((o) => `${o.entidad.sigla} · actualizada el ${formatearFecha(o.actualizadoEn)}`)),
  ];

  const difiere = (f: Fila) => fichas.length > 1 && RESALTAR.includes(f.grupo) && new Set(f.claves).size > 1;
  const nDiferencias = filas.filter(difiere).length;
  const urgentes = fichas.filter((o) => estadoConvocatoria(o, hoy) === "abierta" && diasEntre(hoy, o.fechaCierre) <= 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Comparador de oportunidades</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Comparas {fichas.length} de {MAX_COMPARAR} fichas posibles.{" "}
          {fichas.length > 1
            ? <>Resaltamos en amarillo y con la marca «Diferente» los datos de plazos, costos, financiamiento y requisitos que cambian entre ellas ({nDiferencias} {nDiferencias === 1 ? "fila" : "filas"}), y en verde lo mejor de cada fila: menor costo, cierre más lejano y mayor cobertura.</>
            : <>Agrega al menos otra ficha desde el <Link href="/catalogo" className="enlace">catálogo</Link> para ver las diferencias.</>}
        </p>
        {urgentes.length > 0 && (
          <p className="mt-2 font-semibold text-peligro">
            Atención: {new Intl.ListFormat("es", { type: "conjunction" }).format(urgentes.map((o) => o.nombre))} {urgentes.length === 1 ? "cierra" : "cierran"} en 15 días o menos.
          </p>
        )}
        <p className="mt-2 text-sm text-suave">Los montos en otras monedas se convierten a dólares con un tipo de cambio referencial.</p>
      </div>

      <div role="region" aria-labelledby="titulo-tabla" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde bg-white">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <caption id="titulo-tabla" className="sr-only">Comparación campo por campo de las fichas seleccionadas</caption>
          <thead>
            <tr className="bg-marca-clara align-top">
              <th scope="col" className="sticky left-0 w-28 bg-marca-clara p-3 text-left sm:w-44">Campo</th>
              {fichas.map((o) => (
                <th key={o.id} scope="col" className="p-3 text-left">
                  <Link href={`/oportunidades/${o.id}`} className="enlace text-base">{o.nombre}</Link>
                  <div className="mt-2 font-normal">
                    <BotonComparar id={o.id} enComparador nombre={o.nombre} dentroDelComparador />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const d = difiere(f);
              return (
                <tr key={f.titulo} className={`border-t border-borde align-top ${d ? "bg-alerta-claro" : ""}`}>
                  <th scope="row" className={`sticky left-0 w-28 p-3 text-left font-semibold sm:w-44 ${d ? "bg-alerta-claro" : "bg-white"}`}>
                    {f.titulo}
                    {d && (
                      <span className="mt-1 block w-fit rounded-full border border-alerta bg-white px-2 text-xs font-bold text-alerta">
                        Diferente
                      </span>
                    )}
                  </th>
                  {f.celdas.map((c, i) => {
                    const dest = f.destacadas?.find((x) => x.indice === i);
                    return (
                      <td key={i} className={`p-3 ${dest ? "bg-exito-claro shadow-[inset_4px_0_0_var(--color-exito)]" : ""}`}>
                        {c}
                        {dest && (
                          <span className="mt-1 flex w-fit items-center gap-1 rounded-full border border-exito bg-white px-2 py-0.5 text-xs font-bold text-exito">
                            <Award aria-hidden="true" className="h-3.5 w-3.5" />{dest.texto}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sug && <Sugerencias {...sug} hoy={hoy} titulo="Agrega otra para comparar" />}

      <form action={vaciarComparador}>
        <button type="submit" className="btn-secundario">Vaciar el comparador</button>
      </form>
    </div>
  );
}
