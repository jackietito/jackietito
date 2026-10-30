// Catálogos de valores de la ficha estándar y del perfil, con sus etiquetas en lenguaje claro.

export const TIPOS = {
  programa: "Programa de estudios",
  beca: "Beca",
  programa_con_beca: "Programa con beca",
} as const;

export const NIVELES = {
  maestria: "Maestría",
  doctorado: "Doctorado",
  especializacion: "Especialización",
} as const;

export const MODALIDADES = {
  presencial: "Presencial",
  virtual: "Virtual",
  semipresencial: "Semipresencial",
} as const;

export const FINANCIAMIENTOS = {
  integral: "Beca integral",
  parcial: "Beca parcial",
  credito: "Crédito educativo",
  ninguno: "Sin financiamiento",
} as const;

export const ESTADOS = {
  abierta: "Abierta",
  proxima: "Próxima a abrir",
  cerrada: "Cerrada",
} as const;

export const CATEGORIAS_REQUISITO = {
  academico: "Académico",
  idioma: "Idioma",
  documentario: "Documentos",
} as const;

export const ESTADOS_TRAMITE = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completado: "Completado",
} as const;

export const ROLES = {
  ciudadano: "Ciudadano",
  gestor: "Gestor de contenidos",
  orientador: "Orientador",
  admin: "Administrador",
} as const;

export const AREAS = [
  "Ingeniería y tecnología",
  "Ciencias de la salud",
  "Educación",
  "Gestión pública y políticas",
  "Economía y negocios",
  "Medio ambiente y sostenibilidad",
  "Ciencias sociales",
  "Artes y humanidades",
] as const;

export const PAISES = [
  "Alemania",
  "Argentina",
  "Australia",
  "Brasil",
  "Canadá",
  "Chile",
  "Corea del Sur",
  "España",
  "Francia",
  "Japón",
  "México",
  "Países Bajos",
  "Reino Unido",
] as const;

export const IDIOMAS = ["Español", "Inglés", "Portugués", "Francés", "Alemán"] as const;

export const REGIONES = [
  "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco",
  "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto",
  "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
] as const;

/** Tipo de cambio fijo y referencial a dólares, solo para filtrar y comparar. */
export const TASAS_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  JPY: 0.0067,
  KRW: 0.00073,
  CLP: 0.0011,
  MXN: 0.055,
  BRL: 0.18,
  ARS: 0.001,
  PEN: 0.27,
};

export const MONEDAS = Object.keys(TASAS_USD);

/** Plazo (días) tras el cual una ficha sin revisión se marca como desactualizada. */
export const DIAS_VIGENCIA_FICHA = 90;

/** Umbrales de alerta de vencimiento (RF12). */
export const UMBRALES_ALERTA = [7, 15, 30] as const;

export function etiqueta<T extends Record<string, string>>(mapa: T, clave: string): string {
  return (mapa as Record<string, string>)[clave] ?? clave;
}
