/** Banner fijo y siempre visible que identifica el prototipo (requerimiento no funcional). */
export function BannerPrototipo({ fechaSimulada }: { fechaSimulada?: string }) {
  return (
    <div
      role="note"
      aria-label="Aviso de prototipo"
      className="sticky top-0 z-50 border-b-2 border-amber-500 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950"
    >
      {/* En mayúsculas por estilo (el texto sigue en minúsculas para los lectores de pantalla). */}
      <strong className="font-bold uppercase tracking-wide">Prototipo académico – datos ficticios · No es un servicio oficial.</strong>
      {fechaSimulada && <span className="block font-semibold sm:inline"> · Fecha simulada: {fechaSimulada}</span>}
    </div>
  );
}
