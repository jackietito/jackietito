# Documento de requerimientos — Prototipo funcional

**Ventanilla Digital de Oportunidades de Posgrado en el Exterior**
Programa de Gobernabilidad e Innovación Pública PUCP–CAF · Grupo 2 · Fase 4: Prototipar

## 1. Propósito del prototipo

El prototipo tiene por objeto validar con usuarios la experiencia propuesta en el blueprint del servicio mejorado (Informe 2, Anexo B). Se trata de un producto mínimo viable de nivel funcional, según la clasificación de niveles de prototipado del material del curso, que permite recorrer las cinco etapas del servicio con datos de prueba.

El problema público que atiende es el limitado acceso a información sobre oportunidades de estudios de posgrado y becas en el exterior para bachilleres y titulados de universidades peruanas, con mayor afectación en quienes carecen de redes de contacto académico.

## 2. Alcance

**Incluye:**

- Catálogo único de oportunidades construido con la ficha estándar.
- Perfil de intereses del usuario, buscador con filtros y comparador de fichas.
- Ruta de preparación hacia la postulación con mapa de trámites y checklist personalizado.
- Alertas, panel de seguimiento, canal de orientación y encuesta de satisfacción.
- Módulo de gestión de contenidos para las entidades proveedoras.
- Tablero de indicadores para la entidad administradora.

**No incluye:**

- La postulación a programas o becas, ni la ejecución de trámites. La Ventanilla informa y deriva a los canales oficiales de cada entidad.
- Integración real con la PIDE ni con sistemas de MRE, MINEDU, SUNEDU, PRONABEC o universidades. Las integraciones se simulan con datos de prueba.
- Información real de convocatorias. Todo el contenido es ficticio o ilustrativo y se identifica como tal. Excepción: las entidades peruanas ante las que se realizan los trámites nacionales se nombran con su nombre real, con plazos y costos referenciales que deben verificarse en el sitio oficial de cada entidad, sin logotipos ni enlaces a sus sitios (ver `docs/decisiones.md`, D36 y D42).

## 3. Usuarios y roles

| Rol | Descripción | Etapas del blueprint |
|---|---|---|
| Usuario ciudadano | Bachiller o titulado interesado en un posgrado en el exterior | 1 a 5 |
| Gestor de contenidos | Responsable designado por cada entidad proveedora (MRE, PRONABEC, SUNEDU, universidades) para cargar y actualizar fichas y trámites | Backstage |
| Orientador | Personal que atiende consultas de orientación | 2 y 3 |
| Administrador | Entidad administradora de la Ventanilla (supuesto: MINEDU), que gestiona usuarios, entidades e indicadores | Soporte |

## 4. Requerimientos funcionales

Cada requerimiento indica la etapa del blueprint y la oportunidad de innovación (OI) del Informe 2 a la que responde.

### Etapa 1 — Descubrimiento (OI 1)

- **RF01. Punto único de acceso.** Página de inicio con acceso al catálogo, oportunidades destacadas, convocatorias próximas a cerrar y entidades proveedoras.
- **RF02. Catálogo de oportunidades.** Listado de programas y becas de distintas fuentes, con indicación de la entidad proveedora y la fecha de última actualización de cada ficha.

### Etapa 2 — Revisión y contacto (OI 1)

- **RF03. Registro y perfil de intereses.** El usuario registra área de estudio, nivel, países de interés, modalidades e idiomas (uno o varios de cada uno), rango de costo, necesidad de financiamiento, región de residencia y universidad de origen. El registro solicita consentimiento para el tratamiento de datos personales.
- **RF04. Buscador con filtros.** Filtros por país, área, nivel, modalidad, costo total, tipo de financiamiento, idioma, fecha de inicio y estado de la convocatoria (abierta, próxima, cerrada). País, área, nivel, modalidad, idioma y tipo de financiamiento admiten una o varias opciones a la vez. Búsqueda por texto libre.
- **RF05. Recomendaciones por perfil.** Listado de oportunidades que coinciden con el perfil registrado, con indicación de los criterios coincidentes.

### Etapa 3 — Comparación y decisión (OI 1)

- **RF06. Ficha de oportunidad.** Vista detallada con todos los campos de la ficha estándar (sección 5), enlace a la fuente oficial y trámites asociados.
- **RF07. Comparador.** Comparación lado a lado de hasta tres fichas, campo por campo, con resaltado de diferencias en costos, requisitos, financiamiento y plazos.
- **RF08. Guardado de oportunidades.** El usuario guarda oportunidades en su panel personal.

### Etapa 4 — Preparación y continuidad hacia la postulación (OI 2)

- **RF09. Ruta paso a paso.** Para cada oportunidad, secuencia ordenada de requisitos y trámites que indica qué hacer, ante qué entidad, en qué momento (calculado hacia atrás desde la fecha de cierre), con qué documentos y mediante qué enlace oficial.
- **RF10. Mapa de trámites.** Vista general de los trámites nacionales asociados a la postulación en el exterior (por ejemplo, certificación de documentos académicos, legalización y apostilla), con entidad responsable, plazo y costo referenciales.
- **RF11. Checklist personalizado.** Lista de requisitos y documentos generada a partir de la oportunidad elegida, que el usuario marca conforme avanza. Muestra el porcentaje de avance.

### Etapa 5 — Ex post y retroalimentación (OI 3)

- **RF12. Alertas.** Notificaciones dentro de la plataforma sobre nuevas oportunidades que coinciden con el perfil, convocatorias guardadas próximas a vencer (30, 15 y 7 días) y trámites de la ruta cuyo plazo recomendado se acerca. El envío por correo se simula.
- **RF13. Panel de seguimiento.** Vista con oportunidades guardadas, próximas fechas, avance del checklist y estado autodeclarado de cada trámite (pendiente, en curso, completado).
- **RF14. Canal de orientación.** Asistente con preguntas frecuentes por tema y opción de derivar la consulta a un orientador mediante un formulario. El orientador responde desde su bandeja.
- **RF15. Encuesta de satisfacción.** Evaluación de la claridad, suficiencia, oportunidad y utilidad de la información, en escala de 1 a 5, con un campo abierto de comentarios.

### Backstage y soporte

- **RF16. Gestión de contenidos.** El gestor de cada entidad crea, edita y despublica fichas y trámites de su competencia, conforme al estándar. El sistema valida campos obligatorios y registra la fecha de última actualización. Se marca como desactualizada toda ficha sin revisión en el plazo acordado (supuesto: 90 días).
- **RF17. Tablero de indicadores.** Vista para el administrador con los indicadores de la matriz de formulación: número de oportunidades publicadas con ficha estándar completa; porcentaje de usuarios registrados que generan su checklist; porcentaje de usuarios que califican la información como clara, oportuna y útil; y porcentaje de fichas actualizadas dentro del plazo acordado. Desagregación por región del usuario.
- **RF18. Retroalimentación a entidades.** Reporte por entidad con los resultados de la encuesta y los comentarios referidos a sus fichas.

## 5. Ficha estándar de oportunidades (modelo de datos)

La ficha estándar es el formato común de información que alimenta el catálogo, los filtros y el comparador.

| Grupo | Campos |
|---|---|
| Identificación | Tipo (programa, beca, programa con beca); nombre; institución oferente; país; ciudad |
| Académico | Área de estudio; nivel (maestría, doctorado, especialización); modalidad (presencial, virtual, semipresencial); idioma; duración; fecha de inicio |
| Convocatoria | Fecha de apertura; fecha de cierre; estado calculado |
| Costos | Costo de matrícula; costo de vida mensual estimado; otros costos (seguro, visa, fondo de garantía); moneda |
| Financiamiento | Tipo (beca integral, parcial, crédito, ninguno); cobertura; entidad que financia |
| Requisitos | Lista de requisitos académicos, de idioma y documentarios |
| Trámites | Trámites nacionales asociados (referencia al mapa de trámites) |
| Trazabilidad | Entidad proveedora; enlace oficial; fecha de última actualización; responsable de la actualización |

**Otras entidades del modelo:** Trámite (nombre, entidad responsable, descripción, documentos, plazo referencial, costo referencial, enlace oficial, orden en la ruta); Usuario y Perfil; Oportunidad guardada; Ítem de checklist; Alerta; Consulta de orientación; Respuesta de encuesta; Entidad proveedora.

## 6. Requerimientos no funcionales

- **Idioma y lenguaje:** español, con lenguaje claro y sin tecnicismos.
- **Diseño:** responsivo y orientado a dispositivos móviles, dado que la población objetivo descubre oportunidades principalmente desde redes sociales.
- **Accesibilidad:** pautas WCAG 2.1 nivel AA.
- **Datos personales:** consentimiento explícito y finalidad declarada, en línea con la Ley de Protección de Datos Personales. Solo se recogen los datos necesarios para el perfil.
- **Identificación del prototipo:** banner visible con la leyenda "Prototipo académico – datos ficticios". No se usan logotipos, marcas ni la identidad gráfica de gob.pe ni de ninguna entidad.
- **Mantenibilidad:** código documentado, datos de prueba regenerables con un comando y pruebas automatizadas de los flujos principales.

## 7. Restricciones del dominio

- La Ventanilla no reemplaza la postulación ni los trámites que cada entidad mantiene bajo su competencia. Toda acción final se deriva al enlace oficial correspondiente.
- La PIDE solo permite a las entidades compartir datos que poseen y producen. La información de universidades y gobiernos extranjeros no transita por la PIDE; en el prototipo ingresa mediante el módulo de gestión de contenidos.
- Los plazos y costos de trámites son referenciales y se presentan como tales.

## 8. Datos de prueba

- Entre 30 y 40 oportunidades ficticias, distribuidas en al menos 8 países, 6 áreas de estudio y los tres niveles, con convocatorias abiertas, próximas y cerradas respecto de la fecha actual. Las fechas se calibran para que en las revisiones del jurado (4 y 20 de noviembre) predominen las convocatorias abiertas.
- Entre 6 y 8 trámites con nombres genéricos, entidades responsables reales y valores referenciales.
- Cinco entidades proveedoras ficticias, que representen el rol de cada tipo de entidad real.
- Tres usuarios de prueba con perfiles distintos, entre ellos una titulada de una universidad de región sin redes de contacto académico, coherente con la escena 1 del storyboard.
- Un control para simular la fecha actual, que permita demostrar las alertas de vencimiento.

## 9. Criterios de aceptación (recorrido del storyboard)

El prototipo se considera aceptado cuando un usuario de prueba puede completar, sin asistencia, el siguiente recorrido:

1. Ingresa a la Ventanilla y visualiza oportunidades de varias fuentes en un solo lugar.
2. Se registra, define su perfil y recibe oportunidades recomendadas.
3. Filtra el catálogo, compara dos fichas y consulta al canal de orientación.
4. Elige una oportunidad, genera su ruta paso a paso y su checklist, y marca avances.
5. Recibe una alerta de vencimiento, revisa su panel de seguimiento y responde la encuesta.

Asimismo, un gestor de contenidos crea y actualiza una ficha, y el administrador visualiza el efecto en el tablero de indicadores.

## 10. Entregas iterativas

| Incremento | Contenido | Oportunidad de innovación |
|---|---|---|
| 1 | Modelo de datos, datos de prueba, catálogo, ficha, buscador y filtros | OI 1 |
| 2 | Registro, perfil, recomendaciones, comparador y guardado | OI 1 |
| 3 | Mapa de trámites, ruta paso a paso y checklist | OI 2 |
| 4 | Alertas, panel de seguimiento, orientación y encuesta | OI 3 |
| 5 | Gestión de contenidos, tablero de indicadores y reporte a entidades | Backstage |

## 11. Supuestos por validar con el grupo

- Entidad administradora: MINEDU, con el MRE como principal proveedor de información, conforme al Informe 2.
- Plazo de vigencia de una ficha antes de marcarse como desactualizada: 90 días.
- Canal de orientación basado en preguntas frecuentes y derivación a orientador, sin inteligencia artificial generativa en esta versión.
