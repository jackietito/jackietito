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
