// Preguntas frecuentes del canal de orientación (RF14), por tema.
// Contenido ilustrativo para el prototipo; no reemplaza la información oficial.
import type { TEMAS_ORIENTACION } from "./catalogos";

type Tema = (typeof TEMAS_ORIENTACION)[number];

export const PREGUNTAS_FRECUENTES: Record<Tema, { pregunta: string; respuesta: string }[]> = {
  Financiamiento: [
    {
      pregunta: "¿Qué diferencia hay entre una beca integral, una parcial y un crédito educativo?",
      respuesta: "La beca integral cubre la matrícula y, por lo general, la manutención, el seguro y los pasajes. La beca parcial cubre solo una parte (por ejemplo, la matrícula). El crédito educativo es un préstamo que debes devolver, normalmente al terminar tus estudios. En cada ficha verás el tipo de financiamiento y su cobertura.",
    },
    {
      pregunta: "¿Puedo combinar dos becas?",
      respuesta: "Depende de las bases de cada convocatoria. Muchas becas piden una declaración jurada de no contar con otro financiamiento para el mismo fin. Revisa los requisitos de la ficha y confirma en el enlace oficial.",
    },
    {
      pregunta: "¿Cómo se calcula el costo total estimado?",
      respuesta: "Sumamos la matrícula del programa completo, el costo de vida mensual multiplicado por los meses de duración y otros costos (seguro, visa, fondo de garantía). Para comparar entre monedas usamos un tipo de cambio referencial a dólares.",
    },
  ],
  "Requisitos y documentos": [
    {
      pregunta: "¿Qué es el checklist y cómo lo uso?",
      respuesta: "Es la lista de requisitos y documentos de la convocatoria que elegiste. Lo generas desde la ficha con «Preparar mi postulación». Marca cada requisito cuando lo tengas listo y verás tu porcentaje de avance.",
    },
    {
      pregunta: "¿Puedo postular con el grado de bachiller?",
      respuesta: "Algunas maestrías y especializaciones aceptan el grado de bachiller; los doctorados suelen pedir maestría. Lo indica la sección «Requisitos» de cada ficha. Si no está claro, consulta a un orientador o a la entidad en el enlace oficial.",
    },
    {
      pregunta: "¿Qué pasa si todavía no tengo el certificado de idioma?",
      respuesta: "Algunas convocatorias aceptan que lo presentes después, pero la mayoría lo pide al postular. Inscríbete en el examen con anticipación: la ruta te indica desde cuándo conviene empezar.",
    },
  ],
  Trámites: [
    {
      pregunta: "¿Qué es la apostilla y para qué sirve?",
      respuesta: "Es una certificación que da validez a tus documentos peruanos en los países que forman parte del Convenio de La Haya. Antes de apostillar, verifica que las firmas de las autoridades de tu universidad estén registradas. Encontrarás el detalle en el mapa de trámites.",
    },
    {
      pregunta: "¿En qué orden hago los trámites?",
      respuesta: "El mapa de trámites muestra el orden sugerido: primero el idioma (es lo que más tarda), luego el diploma y el certificado de estudios, la constancia de grado, la apostilla y, si hace falta, la traducción oficial. Tu ruta calcula las fechas hacia atrás desde el cierre de la convocatoria.",
    },
    {
      pregunta: "¿La Ventanilla hace los trámites por mí?",
      respuesta: "No. La Ventanilla te informa y te deriva al canal oficial de cada entidad. Los plazos y costos que mostramos son referenciales.",
    },
  ],
  Idiomas: [
    {
      pregunta: "¿Qué examen de idioma necesito?",
      respuesta: "Depende del idioma del programa y de la universidad. La ficha indica el nivel exigido (por ejemplo, B2). Si el programa es en español, normalmente no se pide examen.",
    },
    {
      pregunta: "¿Cuánto tiempo antes debo rendir el examen?",
      respuesta: "Te recomendamos empezar unos cuatro meses antes del cierre: las fechas de examen y la entrega de resultados pueden tardar varias semanas.",
    },
  ],
  "Uso de la Ventanilla": [
    {
      pregunta: "¿Cómo recibo recomendaciones?",
      respuesta: "Crea una cuenta y completa tu perfil de intereses. En «Recomendaciones» verás las oportunidades que coinciden con tu perfil y en qué criterios.",
    },
    {
      pregunta: "¿Cuándo recibo alertas?",
      respuesta: "Cuando una convocatoria que guardaste está a 30, 15 o 7 días de cerrar, cuando se acerca la fecha recomendada de un trámite de tu ruta, cuando se publica una oportunidad que coincide con tu perfil y cuando un orientador responde tu consulta. Las verás en «Alertas»; el aviso por correo es simulado en este prototipo.",
    },
    {
      pregunta: "¿Qué datos personales guardan?",
      respuesta: "Solo tu correo, tu contraseña cifrada y los datos de tu perfil de intereses. No pedimos nombre, documento de identidad ni teléfono.",
    },
  ],
};
