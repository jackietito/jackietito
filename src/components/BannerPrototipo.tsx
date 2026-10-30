/** Banner fijo y siempre visible que identifica el prototipo (requerimiento no funcional). */
export function BannerPrototipo({ fechaSimulada }: { fechaSimulada?: string }) {
  return (
    <div
      role="note"
      aria-label="Aviso de prototipo"
      className="sticky top-0 z-50 border-b-2 border-amber-500 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950"
    >
      <strong className="font-bold">Prototipo académico – datos ficticios</strong>
      <span className="hidden sm:inline">
        {" "}· No es un servicio oficial. Las postulaciones y trámites se realizan en los canales de cada entidad.
      </span>
      {fechaSimulada && <span className="block font-semibold sm:inline"> · Fecha simulada: {fechaSimulada}</span>}
    </div>
  );
}
