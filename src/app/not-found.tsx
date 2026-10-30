import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="tarjeta mx-auto max-w-xl text-center">
      <h1 className="titulo-pagina">No encontramos esta página</h1>
      <p className="mt-2 text-suave">Es posible que la oportunidad haya sido despublicada o que el enlace no sea correcto.</p>
      <Link href="/catalogo" className="btn-primario mt-4">Ir al catálogo</Link>
    </div>
  );
}
