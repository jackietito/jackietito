/**
 * Ilustración del inicio (D60): un avión de papel sale del Perú y llega a un birrete
 * de graduación sobre un globo. SVG propio, sin imágenes externas; se adapta al ancho.
 */
export function IlustracionInicio() {
  return (
    <svg viewBox="0 0 360 300" role="img" aria-labelledby="ilustracion-titulo" className="h-auto w-full max-w-sm">
      <title id="ilustracion-titulo">
        Ilustración: un avión de papel parte desde el Perú y llega a un birrete de graduación sobre el mundo.
      </title>
      {/* Globo */}
      <circle cx="190" cy="170" r="110" fill="#16406f" />
      <circle cx="190" cy="170" r="110" fill="none" stroke="#2c5d93" strokeWidth="2" />
      <ellipse cx="190" cy="170" rx="50" ry="110" fill="none" stroke="#2c5d93" strokeWidth="2" />
      <ellipse cx="190" cy="170" rx="110" ry="38" fill="none" stroke="#2c5d93" strokeWidth="2" />
      <path d="M90 130 q30 -12 55 4 t40 16 q-10 22 -38 26 q-30 2 -50 -18 z" fill="#3b7bc0" opacity="0.55" />
      <path d="M205 95 q28 -10 52 6 q14 14 4 34 q-24 10 -44 -2 q-18 -14 -12 -38 z" fill="#3b7bc0" opacity="0.55" />
      <path d="M175 215 q20 -6 34 10 q4 22 -16 30 q-22 -2 -24 -22 z" fill="#3b7bc0" opacity="0.55" />
      {/* Perú: punto de partida */}
      <circle cx="128" cy="205" r="9" fill="#f5b301" />
      <circle cx="128" cy="205" r="16" fill="none" stroke="#f5b301" strokeWidth="2" opacity="0.6" />
      {/* Trayectoria */}
      <path d="M128 205 C 120 120, 200 70, 262 70" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" opacity="0.85" />
      {/* Avión de papel */}
      <g transform="translate(176 92) rotate(-28)">
        <path d="M0 0 L44 14 L0 28 L10 14 Z" fill="#ffffff" />
        <path d="M10 14 L44 14 L14 22 Z" fill="#d5e1f0" />
      </g>
      {/* Birrete */}
      <g transform="translate(262 42)">
        <path d="M0 26 L44 8 L88 26 L44 44 Z" fill="#c2410c" />
        <path d="M20 34 V52 q24 14 48 0 V34 L44 44 Z" fill="#9a3412" />
        <path d="M82 28 V54" stroke="#f5b301" strokeWidth="3" strokeLinecap="round" />
        <circle cx="82" cy="57" r="4" fill="#f5b301" />
      </g>
      {/* Libros */}
      <g transform="translate(36 236)">
        <rect width="70" height="14" rx="3" fill="#f5b301" />
        <rect x="6" y="-14" width="62" height="14" rx="3" fill="#ffffff" />
        <rect x="2" y="-28" width="58" height="14" rx="3" fill="#c2410c" />
      </g>
    </svg>
  );
}
