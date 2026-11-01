// Directorio oficial de entidades y fuentes de financiamiento (D48).
// Enlaces verificados el 1 de noviembre de 2026 con búsquedas web. No se incluyen
// teléfonos ni correos: solo aparecían en fuentes no oficiales o sin fecha; cada
// entidad publica sus canales de atención en su sitio oficial.

export const FECHA_VERIFICACION = "1 de noviembre de 2026";

export type Enlace = { texto: string; url: string };
export type Contacto = { nombre: string; sigla?: string; paraQue: string; sitio: Enlace; otros?: Enlace[] };

export const DIRECTORIO: Contacto[] = [
  {
    nombre: "Ministerio de Relaciones Exteriores",
    sigla: "MRE",
    paraQue: "Apostilla y legalización de documentos para uso en el exterior.",
    sitio: { texto: "gob.pe/rree", url: "https://www.gob.pe/rree" },
    otros: [
      { texto: "Apostilla y legalización en línea", url: "https://www.gob.pe/37302" },
      { texto: "Apostilla presencial con registro previo", url: "https://www.gob.pe/37301-apostilla-y-legalizacion-atencion-presencial-previo-registro-en-linea" },
    ],
  },
  {
    nombre: "Programa Nacional de Becas y Crédito Educativo",
    sigla: "PRONABEC",
    paraQue: "Becas propias y becas de cooperación internacional para peruanos.",
    sitio: { texto: "pronabec.gob.pe", url: "https://www.pronabec.gob.pe" },
  },
  {
    nombre: "Superintendencia Nacional de Educación Superior Universitaria",
    sigla: "SUNEDU",
    paraQue: "Registro Nacional de Grados y Títulos y constancia de inscripción del grado.",
    sitio: { texto: "gob.pe/sunedu", url: "https://www.gob.pe/sunedu" },
    otros: [{ texto: "Solicitudes en línea de la SUNEDU", url: "https://enlinea.sunedu.gob.pe/" }],
  },
  {
    nombre: "Ministerio de Educación",
    sigla: "MINEDU",
    paraQue: "Políticas de educación superior; entidad administradora en este prototipo.",
    sitio: { texto: "gob.pe/minedu", url: "https://www.gob.pe/minedu" },
  },
  {
    nombre: "Poder Judicial",
    paraQue: "Certificado de antecedentes penales.",
    sitio: { texto: "pj.gob.pe", url: "https://www.pj.gob.pe" },
    otros: [{ texto: "Certificado de antecedentes penales en línea (CAPE)", url: "https://cape.pj.gob.pe" }],
  },
  {
    nombre: "Policía Nacional del Perú",
    sigla: "PNP",
    paraQue: "Certificado de antecedentes policiales para uso en el extranjero.",
    sitio: { texto: "policia.gob.pe", url: "https://www.policia.gob.pe" },
    otros: [{ texto: "Certificado de antecedentes policiales para uso en el extranjero", url: "https://www.gob.pe/324" }],
  },
];

export const FINANCIAMIENTO: Contacto[] = [
  {
    nombre: "PRONABEC",
    paraQue: "Becas del Estado peruano y becas de cooperación internacional que difunde y canaliza.",
    sitio: { texto: "pronabec.gob.pe", url: "https://www.pronabec.gob.pe" },
  },
  {
    nombre: "Comisión Fulbright Perú",
    paraQue: "Becas de maestría en universidades de los Estados Unidos.",
    sitio: { texto: "fulbright.pe", url: "https://www.fulbright.pe" },
  },
  {
    nombre: "DAAD, Servicio Alemán de Intercambio Académico",
    paraQue: "Becas de maestría y doctorado en Alemania.",
    sitio: { texto: "daad.de", url: "https://www.daad.de" },
  },
  {
    nombre: "Chevening",
    paraQue: "Becas del gobierno británico para maestrías de un año en el Reino Unido.",
    sitio: { texto: "chevening.org", url: "https://www.chevening.org" },
  },
  {
    nombre: "Becas académicas de la OEA",
    paraQue: "Becas de maestría y doctorado en universidades de los Estados miembros de la OEA.",
    sitio: { texto: "oas.org/es/becas", url: "https://www.oas.org/es/becas" },
  },
  {
    nombre: "Erasmus Mundus (Unión Europea)",
    paraQue: "Catálogo de maestrías conjuntas europeas, muchas con beca completa.",
    sitio: { texto: "Catálogo Erasmus Mundus", url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en" },
  },
];
