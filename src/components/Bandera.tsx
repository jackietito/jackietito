import { ISO2 } from "@/lib/paises";

/**
 * Bandera de un país. Es decorativa (alt vacío) porque siempre va junto al nombre
 * del país; un país sin bandera disponible no muestra nada.
 */
export function Bandera({ pais, className = "" }: { pais: string; className?: string }) {
  const iso = ISO2[pais];
  if (!iso) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/banderas/${iso}.svg`} alt="" width={20} height={15}
      className={`inline-block h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10 ${className}`} />
  );
}
