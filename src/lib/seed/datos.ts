// Datos de prueba ficticios (docs/requerimientos.md, sección 8).
// Las fechas se expresan en días relativos a "hoy" para que siempre haya
// convocatorias abiertas, próximas y cerradas, sin importar cuándo se cargue el seed.
// Todas las instituciones, entidades, personas y enlaces son inventados.

export const ENTIDADES = [
  {
    sigla: "ORAE",
    nombre: "Oficina de Relaciones Académicas Exteriores",
    tipo: "cancilleria",
    descripcion:
      "Difunde becas de cooperación internacional ofrecidas por gobiernos y organismos extranjeros, y apostilla documentos para su uso en el exterior.",
  },
  {
    sigla: "FONABEP",
    nombre: "Fondo Nacional de Becas de Posgrado",
    tipo: "becas",
    descripcion: "Otorga becas y créditos educativos para estudios de posgrado en el exterior.",
  },
  {
    sigla: "SUGRAT",
    nombre: "Superintendencia de Grados y Títulos",
    tipo: "regulador",
    descripcion:
      "Mantiene el registro nacional de grados y títulos y emite constancias de inscripción.",
  },
  {
    sigla: "UHOR",
    nombre: "Red Universitaria Horizonte",
    tipo: "universidad",
    descripcion:
      "Consorcio de universidades que publica programas de posgrado en convenio con instituciones del exterior.",
  },
  {
    sigla: "DINES",
    nombre: "Dirección Nacional de Educación Superior",
    tipo: "administradora",
    descripcion:
      "Entidad administradora de la Ventanilla. Coordina a las entidades proveedoras y publica oportunidades propias.",
  },
] as const;

export type SiglaEntidad = (typeof ENTIDADES)[number]["sigla"];

// Trámites nacionales genéricos con valores referenciales (RF10).
export const TRAMITES = [
  {
    clave: "idioma",
    nombre: "Rendir un examen internacional de idioma",
    entidadResponsable: "Centro evaluador autorizado",
    entidad: "DINES",
    descripcion:
      "Acredita tu nivel del idioma en que se dicta el programa. Inscríbete con anticipación: las fechas de examen y la entrega de resultados pueden tardar varias semanas.",
    documentos: "Documento de identidad o pasaporte\nComprobante de pago del examen",
    plazoDias: 30,
    costoReferencial: 950,
    orden: 1,
    anticipacionDias: 120,
  },
  {
    clave: "diploma",
    nombre: "Solicitar copia certificada del diploma de grado",
    entidadResponsable: "Universidad de origen",
    entidad: "UHOR",
    descripcion:
      "Pide en tu universidad una copia certificada de tu diploma de bachiller, título o maestría. Es la base para los demás trámites de certificación.",
    documentos: "Solicitud dirigida a la universidad\nDocumento de identidad\nComprobante de pago",
    plazoDias: 10,
    costoReferencial: 90,
    orden: 2,
    anticipacionDias: 90,
  },
  {
    clave: "certificado",
    nombre: "Solicitar certificado de estudios",
    entidadResponsable: "Universidad de origen",
    entidad: "UHOR",
    descripcion:
      "Documento con todas las asignaturas cursadas, calificaciones y créditos. Muchas convocatorias lo piden junto con el promedio ponderado.",
    documentos: "Solicitud dirigida a la universidad\nDocumento de identidad\nComprobante de pago",
    plazoDias: 10,
    costoReferencial: 70,
    orden: 3,
    anticipacionDias: 90,
  },
  {
    clave: "constancia",
    nombre: "Obtener constancia de inscripción del grado",
    entidadResponsable: "Superintendencia de Grados y Títulos (SUGRAT)",
    entidad: "SUGRAT",
    descripcion:
      "Certifica que tu grado o título está inscrito en el registro nacional. Se solicita en línea.",
    documentos: "Documento de identidad\nDatos del grado o título",
    plazoDias: 3,
    costoReferencial: 15,
    orden: 4,
    anticipacionDias: 70,
  },
  {
    clave: "apostilla",
    nombre: "Apostillar documentos académicos",
    entidadResponsable: "Oficina de Relaciones Académicas Exteriores (ORAE)",
    entidad: "ORAE",
    descripcion:
      "La apostilla da validez a tus documentos peruanos en los países que forman parte del Convenio de La Haya. Antes, verifica que las firmas de tu universidad estén registradas.",
    documentos:
      "Copia certificada del diploma\nCertificado de estudios\nComprobante de pago por cada documento",
    plazoDias: 5,
    costoReferencial: 35,
    orden: 5,
    anticipacionDias: 55,
  },
  {
    clave: "traduccion",
    nombre: "Traducir oficialmente los documentos",
    entidadResponsable: "Traductor público certificado (registro de la ORAE)",
    entidad: "ORAE",
    descripcion:
      "Si el programa se dicta en otro idioma, traduce el diploma, el certificado de estudios y la apostilla con un traductor certificado.",
    documentos: "Documentos apostillados\nDocumento de identidad",
    plazoDias: 7,
    costoReferencial: 180,
    orden: 6,
    anticipacionDias: 45,
  },
  {
    clave: "antecedentes",
    nombre: "Obtener certificado de antecedentes",
    entidadResponsable: "Entidad competente en antecedentes penales y policiales",
    entidad: "DINES",
    descripcion:
      "Algunas becas y visas de estudiante piden acreditar que no tienes antecedentes. Revisa su vigencia: suele ser de 3 a 6 meses.",
    documentos: "Documento de identidad\nComprobante de pago",
    plazoDias: 2,
    costoReferencial: 55,
    orden: 7,
    anticipacionDias: 30,
  },
] as const;

export type ClaveTramite = (typeof TRAMITES)[number]["clave"];

type Op = {
  tipo: "programa" | "beca" | "programa_con_beca";
  nombre: string;
  inst: string;
  pais: string;
  ciudad: string;
  area: string;
  nivel: "maestria" | "doctorado" | "especializacion";
  mod: "presencial" | "virtual" | "semipresencial";
  idioma: string;
  dur: number;
  /** días relativos a hoy: apertura, cierre e inicio de clases */
  ap: number;
  ci: number;
  ini: number;
  mat: number;
  vida: number;
  otros: number;
  mon: string;
  fin: "integral" | "parcial" | "credito" | "ninguno";
  cob?: string;
  financ?: string;
  ent: SiglaEntidad;
  /** días desde la última actualización */
  act: number;
  dest?: boolean;
  /** publicada hace pocos días (genera alertas de "nueva oportunidad") */
  nueva?: boolean;
};

export const OPORTUNIDADES: Op[] = [
  { tipo: "beca", nombre: "Beca de Cooperación Iberoamericana en Innovación Educativa", inst: "Universidad de Valdemora", pais: "España", ciudad: "Madrid", area: "Educación", nivel: "maestria", mod: "presencial", idioma: "Español", dur: 12, ap: -30, ci: 25, ini: 200, mat: 9800, vida: 1100, otros: 1500, mon: "EUR", fin: "integral", cob: "Matrícula, pasajes, seguro médico y asignación mensual de 1 100 EUR", financ: "Fondo de Cooperación Iberoamericana (ficticio)", ent: "ORAE", act: 20, dest: true },
  { tipo: "programa", nombre: "Maestría en Gestión Educativa Rural", inst: "Universidad de Los Aromos", pais: "Chile", ciudad: "Valparaíso", area: "Educación", nivel: "maestria", mod: "semipresencial", idioma: "Español", dur: 18, ap: -45, ci: 12, ini: 120, mat: 6500000, vida: 650000, otros: 400000, mon: "CLP", fin: "parcial", cob: "50 % de la matrícula para egresados de universidades públicas de regiones", financ: "Universidad de Los Aromos", ent: "UHOR", act: 40 },
  { tipo: "beca", nombre: "Beca Nacional de Posgrado en Pedagogía e Interculturalidad", inst: "Universidad Autónoma de Tlalcoyan", pais: "México", ciudad: "Puebla", area: "Educación", nivel: "maestria", mod: "presencial", idioma: "Español", dur: 24, ap: -10, ci: 40, ini: 220, mat: 90000, vida: 14000, otros: 12000, mon: "MXN", fin: "integral", cob: "Matrícula, manutención mensual, pasajes y seguro médico", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 10, dest: true },
  { tipo: "programa_con_beca", nombre: "Doctorado en Energías Renovables con beca de investigación", inst: "Hochschule Lindenfeld", pais: "Alemania", ciudad: "Bremen", area: "Ingeniería y tecnología", nivel: "doctorado", mod: "presencial", idioma: "Inglés", dur: 36, ap: -20, ci: 18, ini: 250, mat: 900, vida: 1050, otros: 2500, mon: "EUR", fin: "integral", cob: "Asignación mensual de 1 300 EUR, seguro de salud y pasajes", financ: "Agencia de Intercambio Académico Lindenfeld (ficticia)", ent: "ORAE", act: 15, dest: true },
  { tipo: "programa", nombre: "Maestría en Ciencia de Datos", inst: "Maplewood University", pais: "Canadá", ciudad: "Toronto", area: "Ingeniería y tecnología", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 20, ap: -60, ci: 6, ini: 150, mat: 38000, vida: 1800, otros: 3000, mon: "CAD", fin: "ninguno", ent: "UHOR", act: 70 },
  { tipo: "beca", nombre: "Beca de Excelencia en Gestión del Agua", inst: "Hogeschool Veldmeer", pais: "Países Bajos", ciudad: "Utrecht", area: "Medio ambiente y sostenibilidad", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 12, ap: -5, ci: 55, ini: 230, mat: 18000, vida: 1200, otros: 2000, mon: "EUR", fin: "integral", cob: "Matrícula completa, manutención, seguro y pasajes", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 5, dest: true },
  { tipo: "beca", nombre: "Beca de Gobierno para Investigación en Robótica", inst: "Universidad de Kitahara", pais: "Japón", ciudad: "Osaka", area: "Ingeniería y tecnología", nivel: "doctorado", mod: "presencial", idioma: "Inglés", dur: 42, ap: 15, ci: 75, ini: 330, mat: 535800, vida: 144000, otros: 150000, mon: "JPY", fin: "integral", cob: "Matrícula, asignación mensual y pasajes de ida y vuelta", financ: "Programa de Becas de Cooperación Japón–Perú (ficticio)", ent: "ORAE", act: 30 },
  { tipo: "programa", nombre: "Maestría en Economía del Desarrollo", inst: "Ashmoor University", pais: "Reino Unido", ciudad: "Mánchester", area: "Economía y negocios", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 12, ap: -90, ci: -10, ini: 60, mat: 24000, vida: 1300, otros: 2500, mon: "GBP", fin: "ninguno", ent: "UHOR", act: 100 },
  { tipo: "beca", nombre: "Crédito Educativo para Maestría en Políticas Públicas", inst: "Ashmoor University", pais: "Reino Unido", ciudad: "Londres", area: "Gestión pública y políticas", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 12, ap: -15, ci: 28, ini: 180, mat: 26000, vida: 1500, otros: 3000, mon: "GBP", fin: "credito", cob: "Préstamo de hasta 40 000 USD con periodo de gracia de 12 meses", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 25 },
  { tipo: "beca", nombre: "Beca de Movilidad en Estudios Latinoamericanos", inst: "Université de Beaucastel", pais: "Francia", ciudad: "Lyon", area: "Ciencias sociales", nivel: "maestria", mod: "presencial", idioma: "Francés", dur: 24, ap: 20, ci: 90, ini: 300, mat: 3800, vida: 950, otros: 1200, mon: "EUR", fin: "integral", cob: "Matrícula, alojamiento universitario y asignación mensual", financ: "Programa Franco-Andino de Becas (ficticio)", ent: "ORAE", act: 12 },
  { tipo: "programa", nombre: "Especialización en Salud Pública Digital", inst: "Universidad de Valdemora", pais: "España", ciudad: "Madrid", area: "Ciencias de la salud", nivel: "especializacion", mod: "virtual", idioma: "Español", dur: 9, ap: -40, ci: 35, ini: 90, mat: 4200, vida: 0, otros: 150, mon: "EUR", fin: "parcial", cob: "25 % de descuento para profesionales de salud del sector público", financ: "Universidad de Valdemora", ent: "UHOR", act: 50 },
  { tipo: "beca", nombre: "Beca de Doctorado en Ecología Amazónica", inst: "Universidade Federal de Serra Clara", pais: "Brasil", ciudad: "Manaos", area: "Medio ambiente y sostenibilidad", nivel: "doctorado", mod: "presencial", idioma: "Portugués", dur: 48, ap: -25, ci: 3, ini: 140, mat: 0, vida: 3500, otros: 2500, mon: "BRL", fin: "integral", cob: "Asignación mensual de investigación y seguro de salud", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 18 },
  { tipo: "programa", nombre: "Especialización en Gobierno Digital", inst: "Universidad de Puerto Albar", pais: "Argentina", ciudad: "Buenos Aires", area: "Gestión pública y políticas", nivel: "especializacion", mod: "virtual", idioma: "Español", dur: 12, ap: -50, ci: 20, ini: 70, mat: 2400, vida: 0, otros: 100, mon: "USD", fin: "ninguno", ent: "DINES", act: 35 },
  { tipo: "programa_con_beca", nombre: "Maestría en Ciudades Inteligentes con beca completa", inst: "Universidad Nacional de Seoryeong", pais: "Corea del Sur", ciudad: "Seúl", area: "Ingeniería y tecnología", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 24, ap: 5, ci: 60, ini: 280, mat: 9000000, vida: 1200000, otros: 2000000, mon: "KRW", fin: "integral", cob: "Matrícula, curso de coreano, manutención y pasajes", financ: "Programa de Becas Corea–Andes (ficticio)", ent: "ORAE", act: 8 },
  { tipo: "programa", nombre: "Maestría en Salud Global", inst: "Coralbay University", pais: "Australia", ciudad: "Brisbane", area: "Ciencias de la salud", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 24, ap: -120, ci: -30, ini: 30, mat: 70000, vida: 2200, otros: 6000, mon: "AUD", fin: "ninguno", ent: "UHOR", act: 130 },
  { tipo: "beca", nombre: "Beca de Doctorado en Estudios Andinos", inst: "Universidad de Los Aromos", pais: "Chile", ciudad: "Santiago", area: "Ciencias sociales", nivel: "doctorado", mod: "presencial", idioma: "Español", dur: 48, ap: -35, ci: 45, ini: 240, mat: 5000000, vida: 800000, otros: 500000, mon: "CLP", fin: "integral", cob: "Matrícula, manutención y seguro de salud", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 22 },
  { tipo: "programa", nombre: "Maestría en Finanzas Sostenibles", inst: "Universidad Autónoma de Tlalcoyan", pais: "México", ciudad: "Ciudad de México", area: "Economía y negocios", nivel: "maestria", mod: "semipresencial", idioma: "Español", dur: 24, ap: -70, ci: -5, ini: 45, mat: 140000, vida: 16000, otros: 8000, mon: "MXN", fin: "parcial", cob: "30 % de la matrícula por rendimiento académico", financ: "Universidad Autónoma de Tlalcoyan", ent: "UHOR", act: 60 },
  { tipo: "beca", nombre: "Beca de Investigación en Patrimonio Cultural", inst: "Universidad de Valdemora", pais: "España", ciudad: "Sevilla", area: "Artes y humanidades", nivel: "doctorado", mod: "presencial", idioma: "Español", dur: 36, ap: -12, ci: 30, ini: 210, mat: 2500, vida: 1000, otros: 1500, mon: "EUR", fin: "integral", cob: "Contrato predoctoral con asignación mensual y matrícula", financ: "Fondo de Cooperación Iberoamericana (ficticio)", ent: "ORAE", act: 14 },
  { tipo: "programa_con_beca", nombre: "Especialización en Didáctica del Francés", inst: "Université de Beaucastel", pais: "Francia", ciudad: "Burdeos", area: "Educación", nivel: "especializacion", mod: "semipresencial", idioma: "Francés", dur: 10, ap: -8, ci: 14, ini: 100, mat: 3000, vida: 900, otros: 800, mon: "EUR", fin: "parcial", cob: "Matrícula y pasajes para la fase presencial", financ: "Dirección Nacional de Educación Superior", ent: "DINES", act: 9 },
  { tipo: "programa", nombre: "Maestría en Administración Pública Internacional", inst: "Hochschule Lindenfeld", pais: "Alemania", ciudad: "Berlín", area: "Gestión pública y políticas", nivel: "maestria", mod: "presencial", idioma: "Alemán", dur: 24, ap: 30, ci: 100, ini: 330, mat: 1200, vida: 1000, otros: 2200, mon: "EUR", fin: "ninguno", ent: "UHOR", act: 45 },
  { tipo: "beca", nombre: "Crédito para Doctorado en Epidemiología", inst: "Maplewood University", pais: "Canadá", ciudad: "Montreal", area: "Ciencias de la salud", nivel: "doctorado", mod: "presencial", idioma: "Inglés", dur: 48, ap: -18, ci: 50, ini: 260, mat: 22000, vida: 1700, otros: 3500, mon: "CAD", fin: "credito", cob: "Préstamo de hasta 60 000 USD con tasa preferencial", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 30 },
  { tipo: "beca", nombre: "Beca de Maestría en Gestión Cultural", inst: "Universidad de Puerto Albar", pais: "Argentina", ciudad: "Córdoba", area: "Artes y humanidades", nivel: "maestria", mod: "presencial", idioma: "Español", dur: 24, ap: -100, ci: -40, ini: 20, mat: 6000, vida: 700, otros: 500, mon: "USD", fin: "integral", cob: "Matrícula y manutención", financ: "Programa de Cooperación Cultural Sur–Sur (ficticio)", ent: "ORAE", act: 95 },
  { tipo: "programa", nombre: "Máster en Dirección Pública y Gobernanza", inst: "Universidad de Valdemora", pais: "España", ciudad: "Barcelona", area: "Gestión pública y políticas", nivel: "maestria", mod: "presencial", idioma: "Español", dur: 12, ap: -20, ci: 65, ini: 250, mat: 11000, vida: 1200, otros: 1800, mon: "EUR", fin: "ninguno", ent: "UHOR", act: 28 },
  { tipo: "beca", nombre: "Beca de Doctorado en Ciencias del Clima", inst: "Coralbay University", pais: "Australia", ciudad: "Perth", area: "Medio ambiente y sostenibilidad", nivel: "doctorado", mod: "presencial", idioma: "Inglés", dur: 42, ap: 45, ci: 120, ini: 400, mat: 45000, vida: 2300, otros: 5000, mon: "AUD", fin: "integral", cob: "Matrícula, manutención, seguro de salud y pasajes", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 6 },
  { tipo: "programa", nombre: "Especialización en Atención Primaria de Salud", inst: "Universidade Federal de Serra Clara", pais: "Brasil", ciudad: "São Paulo", area: "Ciencias de la salud", nivel: "especializacion", mod: "virtual", idioma: "Portugués", dur: 12, ap: -30, ci: 9, ini: 60, mat: 9000, vida: 0, otros: 300, mon: "BRL", fin: "parcial", cob: "40 % de descuento en la matrícula", financ: "Universidade Federal de Serra Clara", ent: "DINES", act: 40 },
  { tipo: "programa_con_beca", nombre: "Doctorado en Migración y Desarrollo con beca", inst: "Hogeschool Veldmeer", pais: "Países Bajos", ciudad: "Ámsterdam", area: "Ciencias sociales", nivel: "doctorado", mod: "presencial", idioma: "Inglés", dur: 48, ap: -150, ci: -60, ini: 10, mat: 2300, vida: 1300, otros: 2500, mon: "EUR", fin: "integral", cob: "Salario de investigador doctoral y seguro", financ: "Hogeschool Veldmeer", ent: "ORAE", act: 160 },
  { tipo: "programa", nombre: "Especialización en Inteligencia Artificial Aplicada", inst: "Universidad Nacional de Seoryeong", pais: "Corea del Sur", ciudad: "Busan", area: "Ingeniería y tecnología", nivel: "especializacion", mod: "virtual", idioma: "Inglés", dur: 6, ap: -14, ci: 21, ini: 80, mat: 6000000, vida: 0, otros: 0, mon: "KRW", fin: "ninguno", ent: "UHOR", act: 14 },
  { tipo: "beca", nombre: "Beca de Maestría en Educación Inclusiva", inst: "Universidad de Kitahara", pais: "Japón", ciudad: "Tokio", area: "Educación", nivel: "maestria", mod: "presencial", idioma: "Inglés", dur: 24, ap: -40, ci: -2, ini: 150, mat: 820000, vida: 140000, otros: 180000, mon: "JPY", fin: "integral", cob: "Matrícula, asignación mensual y pasajes", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 50 },
  { tipo: "programa", nombre: "Especialización en Proyectos de Inversión Pública", inst: "Universidad de Los Aromos", pais: "Chile", ciudad: "Concepción", area: "Gestión pública y políticas", nivel: "especializacion", mod: "semipresencial", idioma: "Español", dur: 8, ap: 10, ci: 40, ini: 120, mat: 2800000, vida: 600000, otros: 200000, mon: "CLP", fin: "parcial", cob: "Media beca para servidores públicos", financ: "Dirección Nacional de Educación Superior", ent: "DINES", act: 20 },
  { tipo: "programa", nombre: "Máster en Economía Circular", inst: "Université de Beaucastel", pais: "Francia", ciudad: "París", area: "Medio ambiente y sostenibilidad", nivel: "maestria", mod: "presencial", idioma: "Francés", dur: 24, ap: -55, ci: 16, ini: 170, mat: 4500, vida: 1150, otros: 1600, mon: "EUR", fin: "ninguno", ent: "UHOR", act: 100 },
  { tipo: "beca", nombre: "Beca de Doctorado en Ingeniería Sísmica", inst: "Universidad Autónoma de Tlalcoyan", pais: "México", ciudad: "Puebla", area: "Ingeniería y tecnología", nivel: "doctorado", mod: "presencial", idioma: "Español", dur: 48, ap: -3, ci: 80, ini: 300, mat: 60000, vida: 15000, otros: 10000, mon: "MXN", fin: "integral", cob: "Matrícula, manutención y seguro médico", financ: "Programa de Cooperación Científica México–Perú (ficticio)", ent: "ORAE", act: 3, nueva: true },
  { tipo: "beca", nombre: "Beca para Maestría en Educación y Tecnologías", inst: "Universidad de Valdemora", pais: "España", ciudad: "Valencia", area: "Educación", nivel: "maestria", mod: "semipresencial", idioma: "Español", dur: 18, ap: -3, ci: 33, ini: 210, mat: 7000, vida: 1000, otros: 1200, mon: "EUR", fin: "integral", cob: "Matrícula, pasajes para la fase presencial y asignación mensual", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 3, nueva: true, dest: true },
  { tipo: "programa", nombre: "Especialización en Comercio Internacional", inst: "Maplewood University", pais: "Canadá", ciudad: "Vancouver", area: "Economía y negocios", nivel: "especializacion", mod: "virtual", idioma: "Inglés", dur: 10, ap: 25, ci: 85, ini: 200, mat: 9000, vida: 0, otros: 200, mon: "CAD", fin: "ninguno", ent: "UHOR", act: 25 },
  { tipo: "programa_con_beca", nombre: "Maestría en Políticas Sociales con beca parcial", inst: "Universidad de Puerto Albar", pais: "Argentina", ciudad: "Rosario", area: "Ciencias sociales", nivel: "maestria", mod: "semipresencial", idioma: "Español", dur: 24, ap: -22, ci: 27, ini: 160, mat: 8000, vida: 600, otros: 500, mon: "USD", fin: "parcial", cob: "50 % de la matrícula", financ: "Dirección Nacional de Educación Superior", ent: "DINES", act: 22 },
  { tipo: "beca", nombre: "Beca de Maestría en Conservación del Patrimonio", inst: "Hochschule Lindenfeld", pais: "Alemania", ciudad: "Múnich", area: "Artes y humanidades", nivel: "maestria", mod: "presencial", idioma: "Alemán", dur: 24, ap: 40, ci: 110, ini: 360, mat: 600, vida: 1050, otros: 2000, mon: "EUR", fin: "integral", cob: "Curso de alemán, manutención, seguro y pasajes", financ: "Agencia de Intercambio Académico Lindenfeld (ficticia)", ent: "ORAE", act: 3, nueva: true },
  { tipo: "beca", nombre: "Crédito Educativo para Maestría en Agronegocios", inst: "Universidade Federal de Serra Clara", pais: "Brasil", ciudad: "Porto Alegre", area: "Economía y negocios", nivel: "maestria", mod: "presencial", idioma: "Portugués", dur: 24, ap: -48, ci: -15, ini: 40, mat: 30000, vida: 3000, otros: 2000, mon: "BRL", fin: "credito", cob: "Préstamo de hasta 30 000 USD", financ: "Fondo Nacional de Becas de Posgrado", ent: "FONABEP", act: 70 },
];

/** Requisitos de la ficha, derivados del nivel, idioma, modalidad y financiamiento. */
export function requisitosDe(o: Op): { categoria: string; descripcion: string }[] {
  const r: { categoria: string; descripcion: string }[] = [];
  if (o.nivel === "doctorado") {
    r.push({ categoria: "academico", descripcion: `Grado de maestro en ${o.area.toLowerCase()} o área afín` });
    r.push({ categoria: "academico", descripcion: "Propuesta de investigación de 3 a 5 páginas" });
  } else if (o.nivel === "maestria") {
    r.push({ categoria: "academico", descripcion: `Grado de bachiller o título profesional en ${o.area.toLowerCase()} o área afín` });
    r.push({ categoria: "academico", descripcion: "Promedio ponderado mínimo de 14 (escala vigesimal)" });
  } else {
    r.push({ categoria: "academico", descripcion: "Grado de bachiller o título profesional" });
    r.push({ categoria: "academico", descripcion: "Experiencia laboral mínima de un año en el área" });
  }
  if (o.idioma !== "Español") {
    r.push({ categoria: "idioma", descripcion: `Certificado de ${o.idioma.toLowerCase()} nivel B2 o superior (examen internacional reconocido)` });
  }
  r.push({ categoria: "documentario", descripcion: "Copia certificada del diploma de grado, apostillada" });
  r.push({ categoria: "documentario", descripcion: "Certificado de estudios con calificaciones, apostillado" });
  if (o.idioma !== "Español") {
    r.push({ categoria: "documentario", descripcion: "Traducción oficial del diploma y del certificado de estudios" });
  }
  r.push({ categoria: "documentario", descripcion: "Carta de motivación (máximo 2 páginas)" });
  r.push({ categoria: "documentario", descripcion: "Dos cartas de recomendación académica o profesional" });
  if (o.mod !== "virtual") r.push({ categoria: "documentario", descripcion: "Pasaporte vigente" });
  if (o.fin === "integral" || o.fin === "parcial") {
    r.push({ categoria: "documentario", descripcion: "Declaración jurada de no contar con otra beca para el mismo fin" });
  }
  if (o.fin === "credito") {
    r.push({ categoria: "documentario", descripcion: "Garante o aval según las condiciones del crédito" });
  }
  return r;
}

/** Trámites nacionales asociados a la ficha. */
export function tramitesDe(o: Op): ClaveTramite[] {
  const t: ClaveTramite[] = [];
  if (o.idioma !== "Español") t.push("idioma");
  t.push("diploma", "certificado", "constancia", "apostilla");
  if (o.idioma !== "Español") t.push("traduccion");
  if (o.mod !== "virtual" && (o.fin === "integral" || o.fin === "credito")) t.push("antecedentes");
  return t;
}

export function otrosCostosDetalle(o: Op): string {
  if (o.otros === 0) return "No se reportan otros costos";
  return o.mod === "virtual"
    ? "Derechos administrativos y emisión del diploma"
    : "Seguro médico, visa de estudiante y fondo de garantía (si aplica)";
}

// ---------- Usuarios de prueba ----------

export const CLAVE_PRUEBA = "Prototipo2026!";

export const PERSONAL = [
  { email: "admin@ventanilla.test", nombre: "Administración de la Ventanilla", rol: "admin", entidad: "DINES" },
  { email: "orientador@ventanilla.test", nombre: "Carmen Villanueva (orientadora)", rol: "orientador", entidad: "DINES" },
  { email: "gestor.orae@ventanilla.test", nombre: "Gestor ORAE", rol: "gestor", entidad: "ORAE" },
  { email: "gestor.fonabep@ventanilla.test", nombre: "Gestora FONABEP", rol: "gestor", entidad: "FONABEP" },
  { email: "gestor.sugrat@ventanilla.test", nombre: "Gestor SUGRAT", rol: "gestor", entidad: "SUGRAT" },
  { email: "gestor.uhor@ventanilla.test", nombre: "Gestora Red Horizonte", rol: "gestor", entidad: "UHOR" },
  { email: "gestor.dines@ventanilla.test", nombre: "Gestor DINES", rol: "gestor", entidad: "DINES" },
] as const;

type PerfilSemilla = {
  email: string;
  area: string;
  nivel: string;
  paises: string[];
  modalidad: string;
  idioma: string;
  costoMaxUsd: number;
  necesitaFinanciamiento: boolean;
  region: string;
  universidadOrigen: string;
};

/** Los tres usuarios ciudadanos de prueba (sección 8). Rosa corresponde a la escena 1 del storyboard. */
export const CIUDADANOS: PerfilSemilla[] = [
  { email: "rosa@ventanilla.test", area: "Educación", nivel: "maestria", paises: ["España", "Chile", "México"], modalidad: "presencial", idioma: "Español", costoMaxUsd: 30000, necesitaFinanciamiento: true, region: "Ayacucho", universidadOrigen: "Universidad Pública de Huanta (ficticia)" },
  { email: "diego@ventanilla.test", area: "Ingeniería y tecnología", nivel: "doctorado", paises: ["Alemania", "Canadá", "Japón"], modalidad: "presencial", idioma: "Inglés", costoMaxUsd: 0, necesitaFinanciamiento: true, region: "Lima", universidadOrigen: "Universidad Metropolitana de Lima (ficticia)" },
  { email: "lucia@ventanilla.test", area: "Gestión pública y políticas", nivel: "especializacion", paises: ["Argentina", "Chile", "España"], modalidad: "virtual", idioma: "Español", costoMaxUsd: 8000, necesitaFinanciamiento: false, region: "Arequipa", universidadOrigen: "Universidad del Misti (ficticia)" },
];

/** Población simulada adicional para que el tablero de indicadores muestre datos por región. */
export const POBLACION_SIMULADA: PerfilSemilla[] = [
  { email: "usuario01@ventanilla.test", area: "Ciencias de la salud", nivel: "maestria", paises: ["España"], modalidad: "presencial", idioma: "Español", costoMaxUsd: 20000, necesitaFinanciamiento: true, region: "Puno", universidadOrigen: "Universidad del Altiplano (ficticia)" },
  { email: "usuario02@ventanilla.test", area: "Medio ambiente y sostenibilidad", nivel: "doctorado", paises: ["Brasil", "Países Bajos"], modalidad: "presencial", idioma: "Inglés", costoMaxUsd: 0, necesitaFinanciamiento: true, region: "Loreto", universidadOrigen: "Universidad Amazónica (ficticia)" },
  { email: "usuario03@ventanilla.test", area: "Economía y negocios", nivel: "maestria", paises: ["Reino Unido", "Canadá"], modalidad: "presencial", idioma: "Inglés", costoMaxUsd: 0, necesitaFinanciamiento: false, region: "Lima", universidadOrigen: "Universidad Metropolitana de Lima (ficticia)" },
  { email: "usuario04@ventanilla.test", area: "Educación", nivel: "especializacion", paises: ["Francia", "España"], modalidad: "semipresencial", idioma: "Español", costoMaxUsd: 10000, necesitaFinanciamiento: true, region: "Cusco", universidadOrigen: "Universidad Imperial (ficticia)" },
  { email: "usuario05@ventanilla.test", area: "Ingeniería y tecnología", nivel: "maestria", paises: ["Corea del Sur", "Japón"], modalidad: "presencial", idioma: "Inglés", costoMaxUsd: 0, necesitaFinanciamiento: true, region: "Piura", universidadOrigen: "Universidad del Norte Grau (ficticia)" },
  { email: "usuario06@ventanilla.test", area: "Gestión pública y políticas", nivel: "maestria", paises: ["España", "Reino Unido"], modalidad: "presencial", idioma: "Español", costoMaxUsd: 25000, necesitaFinanciamiento: true, region: "Junín", universidadOrigen: "Universidad del Centro (ficticia)" },
  { email: "usuario07@ventanilla.test", area: "Ciencias sociales", nivel: "doctorado", paises: ["Chile", "Argentina"], modalidad: "presencial", idioma: "Español", costoMaxUsd: 0, necesitaFinanciamiento: true, region: "Ayacucho", universidadOrigen: "Universidad Pública de Huanta (ficticia)" },
  { email: "usuario08@ventanilla.test", area: "Artes y humanidades", nivel: "maestria", paises: ["Alemania", "España"], modalidad: "presencial", idioma: "Español", costoMaxUsd: 15000, necesitaFinanciamiento: true, region: "La Libertad", universidadOrigen: "Universidad Moche (ficticia)" },
  { email: "usuario09@ventanilla.test", area: "Ciencias de la salud", nivel: "especializacion", paises: ["Brasil", "España"], modalidad: "virtual", idioma: "Español", costoMaxUsd: 5000, necesitaFinanciamiento: false, region: "Cajamarca", universidadOrigen: "Universidad de los Andes del Norte (ficticia)" },
];
