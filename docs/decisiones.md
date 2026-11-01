# Registro de decisiones

Decisiones tomadas ante ambigüedades del documento de requerimientos (`docs/requerimientos.md`) o por razones técnicas del prototipo. Cada entrada indica el requerimiento relacionado.

## Técnicas

**D01. Autenticación propia en lugar de NextAuth.** Sesión en una cookie `httpOnly` firmada (JWT con `jose`) y contraseñas cifradas con `bcryptjs`. Admite cualquier número de usuarios y sesiones simultáneas; solo se necesita correo y contraseña, por lo que NextAuth no aportaba capacidad adicional.

**D02. SQLite en local, PostgreSQL en el despliegue.** La app se publica en Vercel con una base PostgreSQL gestionada (Neon), porque el disco de Vercel no es persistente. Prisma no permite elegir el proveedor con una variable de entorno, así que `scripts/prisma-provider.mjs` ajusta `provider` en `prisma/schema.prisma` según el prefijo de `DATABASE_URL`. Se usa `prisma db push` (sin migraciones), suficiente para un prototipo y compatible con ambos motores.

**D03. Valores de catálogo como texto.** Tipo, nivel, modalidad, financiamiento, estado, rol, etc. se guardan como `String` y se validan en la aplicación (`src/lib/catalogos.ts`), porque SQLite no tiene enums.

**D04. Búsqueda y filtros en memoria.** Con 30–40 fichas, filtrar en el servidor de la aplicación es inmediato y evita diferencias entre SQLite y PostgreSQL en búsquedas sin distinguir mayúsculas ni tildes.

**D05. Fechas de calendario a las 12:00 UTC** y mostradas en hora de Lima, para evitar desfases de un día.

## Del dominio

**D06. Estado de la convocatoria (RF04, sección 5).** *Próxima*: aún no abre (hoy < apertura). *Abierta*: entre apertura y cierre, ambos incluidos. *Cerrada*: después del cierre. Las convocatorias "próximas a cerrar" de la página de inicio (RF01) son las abiertas que cierran en 30 días o menos.

**D07. Costo total (RF04, RF07).** Costo total = matrícula del programa completo + costo de vida mensual × duración en meses + otros costos. Para filtrar y comparar fichas en distintas monedas se convierte a USD con un tipo de cambio fijo y referencial (`TASAS_USD` en `src/lib/catalogos.ts`), indicado como tal en la interfaz.

**D08. Fecha simulada (sección 8, regla 4).** Es un valor global guardado en la tabla `Configuracion`; solo el administrador puede cambiarla. Afecta el estado de las convocatorias, la ruta, las alertas y el criterio de ficha desactualizada. Sin fecha simulada se usa la fecha real de Lima.

**D09. Datos de prueba relativos a la fecha de carga (sección 8).** Las fechas del seed se calculan a partir del día en que se ejecuta, para que siempre haya convocatorias abiertas, próximas y cerradas. Hay 36 oportunidades en 13 países, 8 áreas y 3 niveles; 7 trámites; 5 entidades ficticias que representan los roles de cancillería (ORAE), programa de becas (FONABEP), regulador de grados (SUGRAT), universidades (UHOR) y entidad administradora (DINES).

**D10. Población simulada para el tablero (RF17).** Además de los tres ciudadanos de prueba de la sección 8, el seed crea nueve usuarios de distintas regiones con rutas, encuestas y consultas, para que el tablero muestre datos desagregados por región. Se identifican como `usuarioNN@ventanilla.test`.

**D11. Datos del ciudadano (RF03, regla 7).** Al ciudadano solo se le piden correo y contraseña (necesarios para la cuenta) y los datos del perfil de RF03. No se pide nombre, documento de identidad ni teléfono. El nombre solo existe para cuentas del personal.

**D12. Trámites asociados (RF09, RF10).** Cada trámite tiene un orden sugerido y una anticipación en días; la fecha recomendada de cada paso de la ruta es *fecha de cierre − anticipación*. La asociación ficha–trámite se deriva del idioma, la modalidad y el financiamiento de la ficha (p. ej., la traducción oficial solo aparece si el programa no se dicta en español).

**D13. Entidades sin oportunidades propias.** SUGRAT (rol de regulador) no publica oportunidades: es responsable de trámites del mapa de trámites.

**D14. Enlaces oficiales de ejemplo (regla 5).** Todos los enlaces oficiales apuntan a `https://example.org/...`, dominio reservado para ejemplos.

**D15. Conexión con Neon (complementa D02).** Siguiendo la guía de Neon para Prisma en Vercel:
- *Cadenas de conexión.* `DATABASE_URL` es la cadena **con pooling** (host `-pooler`) y la usa la aplicación; `DATABASE_URL_UNPOOLED` es la **directa** y la usan `prisma db push` (`directUrl`) y el seed. Son los nombres que entregan `neon env pull` y la integración Neon–Vercel. `scripts/prisma-provider.mjs` agrega `directUrl` al datasource solo en PostgreSQL, porque SQLite no lo necesita.
- *Driver.* En PostgreSQL, `src/lib/db.ts` usa el driver `node-postgres` (`pg`) mediante el adaptador `@prisma/adapter-pg`, y registra el pool con `attachDatabasePool` de `@vercel/functions` para que Vercel (Fluid compute) cierre las conexiones inactivas antes de suspender la función. Es el driver que Neon recomienda para Next.js en Vercel; `@neondatabase/serverless` queda para entornos *edge*, que la app no usa. En SQLite se mantiene el motor por defecto de Prisma.
- *Archivos de entorno.* Las variables de Neon se guardan en `.env.neon` (`npm run neon:env`), no en `.env` ni `.env.local`: Next.js da prioridad a `.env.local` y el desarrollo local y las pruebas E2E deben seguir en SQLite. `scripts/con-neon.mjs` carga `.env.neon` solo para los comandos `npm run neon:*`. Como `neon deploy` escribe por defecto en `.env` (si existe), se ejecuta con `--no-env-pull`.
- *Proyecto.* Organización `org-billowing-rice-24597176`, proyecto `summer-haze-17674729` (PosgradoEnElExterior), rama `production`. El archivo `.neon` y los `.env*` no se versionan.

## Incremento 2

**D16. Registro e ingreso (RF03, regla de datos personales).** El registro pide solo correo, contraseña (mínimo 8 caracteres, guardada con bcrypt) y la aceptación explícita del tratamiento de datos, con la lista de datos, la finalidad y los derechos a la vista. Sin aceptación no se crea la cuenta; la fecha de aceptación se guarda en `Usuario.consentimientoEn`. Solo se registran ciudadanos: las cuentas del personal vienen del seed. Después de registrarse, la persona va a su perfil; al ingresar, cada rol va a su página (ciudadano con perfil → recomendaciones; sin perfil → perfil; gestor → `/gestion`; orientador → `/bandeja`; administrador → `/admin`). El parámetro `volver` solo acepta rutas internas.

**D17. Recomendaciones por perfil (RF05).** Se comparan siete criterios: área, nivel, país de interés, modalidad, idioma, costo (costo total en USD referenciales dentro del máximo del perfil, o sin límite) y financiamiento. Este último solo cuenta si la persona indicó que lo necesita (la ficha ofrece beca o crédito); si no lo necesita, el total es seis. Se recomiendan las fichas **no cerradas** con al menos **4** criterios coincidentes, ordenadas por número de coincidencias y luego por fecha de cierre. Cada tarjeta lista los criterios coincidentes. Con el seed, las tres ciudadanas y ciudadanos de prueba reciben entre 3 y 13 recomendaciones.

**D18. Comparador (RF07).** La selección (máximo 3 fichas) se guarda en una cookie, por lo que se puede comparar sin cuenta, como parte de la etapa de descubrimiento. Al intentar agregar una cuarta, se avisa y no se agrega. Las diferencias se resaltan en las filas de plazos, costos, financiamiento y requisitos con fondo amarillo **y** la marca de texto «Diferente» (no solo con color, WCAG 1.4.1). Además, se marca la ficha con el «Menor costo total» (en USD referenciales). En móvil la tabla se desplaza en horizontal y la columna de campos queda fija.

**D19. Guardado (RF08) y panel.** Solo las cuentas de ciudadano guardan oportunidades; sin sesión, el botón lleva a ingresar y vuelve a la misma página. Guardar y comparar se confirman con un mensaje en una región `aria-live`, sin recargar la página. En «Mi panel», al quitar una guardada la tarjeta sigue visible hasta recargar, para poder deshacer sin perder el foco. El panel de seguimiento completo (RF13) se construye en el incremento 4.

**D20. Páginas provisionales por rol.** Los enlaces del gestor (Gestión de contenidos), orientador (Bandeja de consultas) y administrador (Tablero de indicadores) llevan a páginas protegidas por rol que indican en qué incremento se habilita el módulo, para que la navegación por rol ya pueda probarse.

## Incremento 3

**D21. Ruta paso a paso (RF09).** La ruta incluye los trámites asociados a la ficha (D12), en el orden del mapa de trámites. Cada paso indica qué hacer, ante qué entidad, los documentos, el enlace oficial y la fecha en que conviene empezar: *cierre − anticipación del trámite*. El último paso es «Postular en el canal oficial», con fecha *cierre − 7 días* (`DIAS_MARGEN_POSTULACION`). Si la fecha recomendada ya pasó, el paso se marca en rojo («hazlo cuanto antes»); si faltan 14 días o menos, se marca como próximo. No se genera una ruta para una convocatoria cerrada. Al generarla, la oportunidad se guarda en el panel y se registra `Guardada.rutaGeneradaEn`, que usará el indicador de RF17.

**D22. Checklist y avance (RF11, RF13).** El checklist es la lista de requisitos de la ficha (académicos, de idioma y documentarios). El porcentaje de avance se calcula solo sobre el checklist; los trámites se cuentan aparte («N de M trámites completados») con su estado autodeclarado (pendiente, en curso, completado), que se cambia en la misma ruta. Las casillas y los estados se guardan al instante, sin botón de envío, y el cambio se anuncia a los lectores de pantalla. Si la gestora agrega requisitos a la ficha, al volver a generar la ruta se agregan sin perder lo ya marcado.

**D23. Mapa de trámites (RF10).** Es una página pública (`/tramites`) con los 7 trámites en orden sugerido, entidad responsable, documentos, plazo, costo y anticipación referenciales, y cuántas oportunidades del catálogo lo piden. Se accede desde el encabezado y desde la sección de trámites de cada ficha.

## Incremento 4

**D24. Alertas (RF12).** Se calculan al ingresar y al abrir «Mi panel» o «Alertas», con la fecha actual o simulada; no hay tareas programadas, porque Vercel no las necesita para el prototipo y así la fecha simulada surte efecto de inmediato. Tipos: *vencimiento* de una convocatoria guardada y abierta (solo el umbral más cercano alcanzado entre 30, 15 y 7 días, para no repetir avisos); *trámite* de una ruta generada, pendiente o en curso, cuya fecha recomendada está a 7 días o menos o ya pasó; *nueva oportunidad* publicada en los últimos 14 días que cumple el criterio de recomendación (D17); y *respuesta* del orientador. Cada alerta tiene una clave única (p. ej. `venc-7-<oportunidad>`) para no duplicarse. El correo se simula en las alertas de vencimiento y de respuesta: se guarda el destinatario en `correoSimulado` y se muestra «envío simulado».

**D25. Panel de seguimiento (RF13).** Reúne un resumen (guardadas, fechas próximas, alertas sin leer), una lista de «Próximas fechas» de los próximos 60 días (cierres y pasos pendientes de las rutas, incluidos los atrasados) y, por cada oportunidad guardada, el avance del checklist y el estado autodeclarado de cada trámite. El estado se cambia en la ruta (D22).

**D26. Canal de orientación (RF14).** Preguntas frecuentes por cinco temas (sin IA generativa, sección 11), visibles sin cuenta. Para derivar una consulta se necesita una cuenta de ciudadano; puede asociarse a una oportunidad guardada. El orientador responde desde «Bandeja de consultas», donde ve el tema, la región y la universidad de la persona, pero no su correo (minimización de datos). Cada consulta se responde una sola vez y la respuesta genera una alerta para el ciudadano.

**D27. Encuesta de satisfacción (RF15).** Cuatro dimensiones en escala de 1 a 5 (claridad, suficiencia, oportunidad y utilidad) y un comentario opcional. Se puede asociar a una oportunidad guardada, lo que permitirá el reporte por entidad (RF18). Hay una respuesta por persona y oportunidad (o una general): si se responde de nuevo, se actualiza.

**D28. Fecha simulada (sección 8, D08).** El control está en `/admin`, solo para el administrador, y se adelantó a este incremento para poder demostrar las alertas. Mientras está activa, el banner del prototipo muestra «Fecha simulada: …» para todas las personas.

**D29. Navegación.** Con más enlaces por rol, en pantallas anchas la navegación pasa a una segunda fila del encabezado; en pantallas menores a 1280 px se usa el menú desplegable.

## Incremento 5

**D30. Indicadores del tablero (RF17).** Se calculan en el momento con la fecha actual o simulada:
1. *Oportunidades publicadas con ficha estándar completa*: fichas publicadas con todos los campos obligatorios, cobertura si hay financiamiento y al menos un requisito (`camposFaltantes`), sobre el total de fichas publicadas.
2. *Usuarios registrados que generan su checklist*: ciudadanos con al menos una ruta generada, sobre el total de ciudadanos.
3. *Usuarios que califican la información como clara, oportuna y útil*: personas cuya última encuesta tiene nota 4 o 5 en claridad, oportunidad y utilidad, sobre las personas que respondieron la encuesta (la suficiencia se informa en el reporte por entidad, pero no forma parte del indicador).
4. *Fichas actualizadas dentro del plazo acordado*: fichas publicadas revisadas en los últimos 90 días, sobre el total de fichas publicadas.

Los indicadores 2 y 3 se desagregan por la región del perfil; los 1 y 4, también por entidad. Para que el indicador 1 no quede en 100 %, el seed publica dos fichas sin cobertura (UHOR y FONABEP), como si se hubieran migrado a medias.

**D31. Reporte a entidades (RF18).** Muestra, para las fichas de una entidad, el número de respuestas, el promedio de cada dimensión, el porcentaje de respuestas «clara, oportuna y útil», una tabla por ficha y los comentarios escritos, sin datos de quién respondió. El administrador elige la entidad; cada gestor ve solo el de la suya.

**D32. Gestión de contenidos (RF16).** Cada gestor ve, crea y edita solo las fichas y los trámites de su entidad; la ficha de otra entidad responde «no encontrada». No se puede guardar una ficha con campos obligatorios vacíos, sin requisitos, con cierre anterior a la apertura, sin cobertura si hay financiamiento o con un enlace oficial que no empiece con `https://`. Al guardar se registran la fecha de actualización (actual o simulada) y el nombre del gestor como responsable. «Despublicar» retira la ficha del catálogo sin borrarla (las rutas y encuestas existentes se conservan) y se puede volver a publicar. Una ficha desactualizada puede renovarse con «Confirmar que sigue vigente» sin cambiar sus datos. Al editar los requisitos, los que no cambian se conservan para no duplicar ítems en los checklists ya generados. Los trámites despublicados dejan de aparecer en fichas, rutas, panel y alertas.

**D33. Fuera de alcance del prototipo.** La gestión de cuentas de usuarios y de entidades por el administrador (sección 3) no tiene un requerimiento funcional propio; las cuentas del personal y las entidades vienen del seed.

**D34. Restablecer los datos de prueba.** En `/admin` hay un botón para volver a cargar el seed (borra todo, incluida la fecha simulada), pensado para usarse entre sesiones de pruebas con participantes. Exige: (1) sesión de administrador, (2) marcar una casilla de confirmación y (3) una **contraseña propia de restablecimiento**, guardada en la variable de entorno `CLAVE_RESTABLECER` y que no está en el repositorio. No se usa la contraseña del administrador porque las cuentas de prueba son públicas en el README. La comparación se hace en tiempo constante y un intento fallido espera 1,5 s. Si la variable no está configurada, el botón aparece desactivado. Al terminar se cierra la sesión, porque las cuentas se recrean con otros identificadores. La función tiene hasta 120 s en Vercel (`maxDuration`).

**D35. Guía visual de uso en `/guia`.** La guía para ciudadanos («Tu ruta al posgrado», seis pasos con capturas reales en marcos de teléfono) se sirve como página estática desde `public/guia/index.html`, con una reescritura de `/guia` en `next.config.ts`, para que cualquier participante la abra sin cuenta en ningún servicio. Se enlaza desde el pie de todas las páginas. Usa enlaces relativos, así que funciona con cualquier dominio. Las capturas se tomaron con los datos de prueba del seed; si la interfaz cambia, conviene volver a tomarlas.

## Ajustes tras la revisión de noviembre

**D36. Nombres reales de las entidades de trámites (excepción a la sección 2 y a D14).** A pedido del equipo, las entidades peruanas ante las que se realizan los trámites del mapa y de las rutas se nombran con su nombre real: Superintendencia Nacional de Educación Superior Universitaria (SUNEDU) para la constancia de inscripción del grado, Ministerio de Relaciones Exteriores (Cancillería) para la apostilla, Policía Nacional del Perú y Poder Judicial para los antecedentes, además de «tu universidad de origen», el traductor público juramentado y el centro evaluador del examen de idioma. Para no hacer pasar datos inventados por oficiales: los plazos y costos se rotulan como **ilustrativos, no oficiales**; no se usan logotipos; los enlaces de los trámites apuntan a `example.org` y se rotulan «Enlace de ejemplo». Siguen siendo ficticias las universidades extranjeras, las oportunidades y becas, y las cinco entidades proveedoras que publican fichas (ORAE, FONABEP, SUGRAT, UHOR, DINES), porque atribuir becas inventadas a instituciones reales induciría a error.

**D37. Fechas calibradas para las revisiones del jurado (complementa D09).** Las fechas siguen calculándose desde el día en que se cargan los datos, pero se ajustaron para cargarlos entre el 1 y el 3 de noviembre: todas las convocatorias abiertas cierran al menos 21 días después de la carga (siguen abiertas el 20/11); 14 de ellas cierran entre 21 y 33 días después, para que en ambas revisiones haya avisos de vencimiento; hay 8 próximas a abrir (unas abren antes del 20/11 y otras después) y solo 4 cerradas, que los requerimientos piden mantener. En la versión publicada, los datos se recargan con «Restablecer los datos de prueba» (D34).

**D38. Varias modalidades e idiomas en el perfil (RF03, RF05).** El perfil admite una o varias modalidades y uno o varios idiomas, guardados como los países: valores separados por «|» en las columnas `modalidad` e `idioma` (sin cambiar el tipo de columna, para no migrar datos). Para las recomendaciones, el criterio coincide si la modalidad o el idioma de la ficha está entre los elegidos.

**D39. Filtros con varias opciones (RF04).** País, área, nivel, modalidad, idioma y tipo de financiamiento se eligen con grupos plegables de casillas; en la URL se repite el parámetro (`?pais=Chile&pais=España`). Dentro de un filtro basta con coincidir con una de las opciones; entre filtros distintos se exigen todos. Cada opción elegida aparece como una etiqueta que se quita por separado. Estado, costo máximo y fechas siguen siendo de una sola opción.

## Identidad, trámites y entidades reales

**D40. Identidad del prototipo.** El prototipo se llama **Talento sin Fronteras**, con el lema «Encuentra, compara y prepara tu posgrado en el exterior». El nombre y el lema aparecen en el título de las páginas, el encabezado, el pie, la guía de uso y el README, y reemplazan las menciones a «la Ventanilla» en la interfaz. «Ventanilla Digital de Oportunidades de Posgrado en el Exterior» se conserva solo como descripción del servicio en la guía. Los documentos de trabajo (`docs/`) mantienen el nombre del servicio con que se formuló el proyecto.

**D41. Enlaces de cada entidad en la página de inicio.** Cada entidad enlaza a lo que publica: sus oportunidades en el catálogo (filtro `?entidad=SIGLA`, que reemplaza la búsqueda por texto) y/o sus trámites en el mapa (`/tramites?entidad=SIGLA`). Así, una entidad que no publica oportunidades, como la responsable de los trámites de grados, también tiene su enlace.

**D42. Valores referenciales del mapa de trámites (reemplaza los valores ilustrativos de D36).** El equipo proporcionó los plazos y costos de los trámites, que se muestran como **referenciales**, con la indicación de verificarlos en el sitio oficial de cada entidad. Hay 8 trámites: el certificado de antecedentes se separó en penales (Poder Judicial, S/ 40.40, descarga inmediata si no hay observaciones) y policiales (Policía Nacional del Perú, S/ 133.28 para uso en el extranjero, entrega en 24 horas); la apostilla (Cancillería) y la constancia de inscripción del grado (SUNEDU, en línea, aprox. 1 día hábil) son gratuitas. Cuando el costo no es un monto fijo (copia certificada y certificado de estudios: «Según el TUPA de tu universidad»; examen de idioma: «Según el examen elegido (TOEFL, IELTS u otro)»; traducción oficial: «Tarifa del traductor»), `costoReferencial` queda vacío y el texto va en `costoNota`; ese trámite no se suma y el total se muestra como «desde S/ X». Los plazos que no se expresan en días van en `plazoTexto`. Las fichas que piden antecedentes incluyen ambos certificados.
