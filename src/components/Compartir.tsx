"use client";
// Compartir una oportunidad (D46): enlaces de cada red (sin logotipos de marca),
// copiar el enlace y, en el celular, el menú para compartir del sistema.
import { useEffect, useState } from "react";

export function Compartir({ url, titulo }: { url: string; titulo: string }) {
  const [mensaje, setMensaje] = useState("");
  const [nativo, setNativo] = useState(false);
  // El texto aclara que es una ficha de ejemplo, para que nadie la tome por una convocatoria real.
  const texto = `${titulo} (ficha de ejemplo del prototipo Talento sin Fronteras)`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(texto);
  const redes = [
    { nombre: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}` },
    { nombre: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { nombre: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { nombre: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
  ];

  useEffect(() => {
    setNativo(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setMensaje("Copiamos el enlace.");
    } catch {
      setMensaje(`No pudimos copiar automáticamente. El enlace es: ${url}`);
    }
  }

  async function compartirNativo() {
    try {
      await navigator.share({ title: titulo, text: texto, url });
    } catch {
      // La persona canceló o el sistema no lo permitió: no hace falta avisar.
    }
  }

  return (
    <section aria-labelledby="titulo-compartir" className="space-y-2">
      <h2 id="titulo-compartir" className="text-sm font-bold">Compartir esta oportunidad</h2>
      <ul className="flex flex-wrap gap-2">
        {nativo && (
          <li>
            <button type="button" onClick={compartirNativo} className="btn-secundario min-h-10 px-3 py-1 text-sm">Compartir…</button>
          </li>
        )}
        {redes.map((r) => (
          <li key={r.nombre}>
            <a href={r.href} target="_blank" rel="noopener noreferrer" className="btn-secundario min-h-10 px-3 py-1 text-sm">
              {r.nombre}<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </li>
        ))}
        <li>
          <button type="button" onClick={copiar} className="btn-secundario min-h-10 px-3 py-1 text-sm">Copiar enlace</button>
        </li>
      </ul>
      <p aria-live="polite" className="break-all text-sm text-suave">{mensaje}</p>
    </section>
  );
}
