# Ventanilla Digital de Oportunidades de Posgrado en el Exterior

> **Prototipo académico – datos ficticios.**
> Proyecto del Programa de Gobernabilidad e Innovación Pública PUCP–CAF (Grupo 2, Fase 4: Prototipar).

En el Perú, la información sobre posgrados y becas en el exterior está dispersa entre varias entidades públicas y universidades. La Ventanilla reúne esa información en un punto único, permite compararla, ordena los trámites previos a la postulación y avisa a tiempo. **No reemplaza la postulación ni los trámites:** informa y deriva a los canales oficiales.

Este prototipo funcional sirve para validar la experiencia con usuarios en pruebas de usabilidad.

**Versión publicada:** https://jackietito.vercel.app (Vercel + Neon). Se actualiza con cada cambio en `main`.

- Requerimientos: [`docs/requerimientos.md`](docs/requerimientos.md)
- Decisiones tomadas durante la construcción: [`docs/decisiones.md`](docs/decisiones.md)

## Estado de los incrementos

| # | Contenido | Estado |
|---|---|---|
| 1 | Modelo de datos, datos de prueba, catálogo, ficha, buscador y filtros | ✅ Listo |
| 2 | Registro, perfil, recomendaciones, comparador y guardado | ✅ Listo |
| 3 | Mapa de trámites, ruta paso a paso y checklist | ✅ Listo |
| 4 | Alertas, panel de seguimiento, orientación y encuesta | ✅ Listo |
| 5 | Gestión de contenidos, tablero de indicadores y reporte a entidades | ✅ Listo |

## Tecnología

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 6 (SQLite en local, PostgreSQL en el despliegue) · Playwright + axe-core para pruebas de extremo a extremo y de accesibilidad.

## Instalación local

Requisitos: Node.js 20 o superior.

```bash
git clone https://github.com/jackietito/jackietito.git ventanilla
cd ventanilla
cp .env.example .env
npm install
npm run setup      # crea la base SQLite (prisma/dev.db) y carga los datos de prueba
npm run dev        # http://localhost:3000
```

### Datos de prueba

`npm run db:seed` borra y vuelve a cargar todos los datos ficticios en cualquier momento. Las fechas de las convocatorias se calculan a partir del día de carga, de modo que siempre hay convocatorias abiertas, próximas y cerradas.

Contenido: 36 oportunidades (13 países, 8 áreas, 3 niveles), 7 trámites, 5 entidades proveedoras ficticias, 3 ciudadanos de prueba, 9 ciudadanos de población simulada y el personal de cada rol.

### Usuarios de prueba

Todas las cuentas usan la contraseña **`Prototipo2026!`**. Se ingresa desde **Ingresar**, en el encabezado.

| Rol | Correo | Descripción |
|---|---|---|
| Ciudadana | `rosa@ventanilla.test` | Titulada de una universidad de Ayacucho, sin redes de contacto académico (escena 1 del storyboard). Busca maestría en Educación y necesita financiamiento. |
| Ciudadano | `diego@ventanilla.test` | Ingeniero de Lima que busca doctorado en inglés; ya tiene una ruta con avances. |
| Ciudadana | `lucia@ventanilla.test` | Profesional de Arequipa que busca una especialización virtual en gestión pública. |
| Gestor | `gestor.orae@ventanilla.test` | Oficina de Relaciones Académicas Exteriores (rol de cancillería) |
| Gestora | `gestor.fonabep@ventanilla.test` | Fondo Nacional de Becas de Posgrado (rol de programa de becas) |
| Gestor | `gestor.sugrat@ventanilla.test` | Superintendencia de Grados y Títulos (rol de regulador) |
| Gestora | `gestor.uhor@ventanilla.test` | Red Universitaria Horizonte (rol de universidades) |
| Gestor | `gestor.dines@ventanilla.test` | Dirección Nacional de Educación Superior (entidad administradora) |
| Orientadora | `orientador@ventanilla.test` | Atiende la bandeja de consultas |
| Administrador | `admin@ventanilla.test` | Tablero de indicadores, reporte por entidad y fecha simulada |

Cualquier persona puede, además, crear su propia cuenta de ciudadano desde **Crear cuenta** (pide aceptar el tratamiento de datos personales).

### Qué probar en el incremento 2

| Requerimiento | Dónde | Cómo |
|---|---|---|
| RF03 Registro y perfil | `/registro`, `/perfil` | Crea una cuenta (prueba primero sin marcar el consentimiento) y completa tu perfil. |
| RF05 Recomendaciones | `/recomendaciones` | Ingresa como `rosa@ventanilla.test`: cada tarjeta dice en cuántos criterios coincide y cuáles. |
| RF07 Comparador | `/comparador` | En el catálogo pulsa «Comparar» en 3 fichas (la cuarta no entra). Las filas que cambian se marcan como «Diferente». No requiere cuenta. |
| RF08 Guardado | Catálogo, ficha, `/panel` | Con una cuenta de ciudadano pulsa «Guardar» y revisa «Mi panel». |
| Roles | Encabezado | Ingresa como gestor, orientador o administrador: cada rol ve sus propios enlaces. |

### Qué probar en el incremento 3

| Requerimiento | Dónde | Cómo |
|---|---|---|
| RF10 Mapa de trámites | `/tramites` (enlace «Trámites») | Revisa los 7 trámites con entidad, documentos, plazo y costo referenciales. |
| RF09 Ruta paso a paso | Ficha → «Preparar mi postulación» | Ingresa como `rosa@ventanilla.test`, abre la *Beca de Cooperación Iberoamericana en Innovación Educativa* (en «Mi panel») y genera la ruta. Cada paso dice qué hacer, ante quién y desde qué fecha. |
| RF11 Checklist | `/ruta/…` | Marca requisitos y mira cómo sube el porcentaje. Cambia el estado de un trámite a «En curso». |
| Ruta con avances | «Mi panel» de `diego@ventanilla.test` | Ruta ya generada con 30 % del checklist listo y trámites en curso. |

### Qué probar en el incremento 4

| Requerimiento | Dónde | Cómo |
|---|---|---|
| RF12 Alertas | «Alertas» | Con `rosa@ventanilla.test`: aviso de vencimiento de su beca guardada (con correo simulado) y de una oportunidad nueva para su perfil. |
| Fecha simulada | `/admin` | Con `admin@ventanilla.test`, adelanta la fecha 2 semanas; ingresa como Diego y verás la alerta de 7 días. Vuelve luego a la fecha real. |
| RF13 Panel de seguimiento | «Mi panel» | Con `diego@ventanilla.test`: próximas fechas, avance del checklist y estado de cada trámite. |
| RF14 Orientación | «Orientación» y `/bandeja` | Lee las preguntas frecuentes; con Rosa envía una consulta; con `orientador@ventanilla.test` respóndela; Rosa recibe la alerta y ve la respuesta. |
| RF15 Encuesta | «Mi panel» → «Responder la encuesta» | Califica de 1 a 5 las cuatro dimensiones y deja un comentario. |

### Qué probar en el incremento 5

| Requerimiento | Dónde | Cómo |
|---|---|---|
| RF16 Gestión de contenidos | `/gestion` | Con `gestor.fonabep@ventanilla.test`: crea una ficha con «Nueva ficha» (prueba guardarla incompleta), edítala, despublícala. Completa la cobertura de la ficha marcada «Incompleta». Con `gestor.uhor@ventanilla.test`, usa «Confirmar que sigue vigente» en una ficha desactualizada. |
| RF17 Tablero de indicadores | `/admin` | Con `admin@ventanilla.test`: los cuatro indicadores, la tabla por región y la tabla por entidad. Cambian al publicar o completar fichas, al generar rutas o al responder encuestas. |
| RF18 Reporte a entidades | `/reporte` | Con el administrador, elige una entidad; con un gestor, ves el de tu entidad. |
| Criterio de aceptación | `/gestion` y `/admin` | Mira el indicador 1 como administrador, crea o completa una ficha como gestor y vuelve al tablero: el número cambia. |

## Pruebas

```bash
npm run test:e2e
```

Las pruebas levantan un servidor propio en el puerto 3100 con una base aparte (`prisma/e2e.db`), recargada con el seed en cada ejecución. Se ejecutan en una vista de escritorio y otra móvil, e incluyen una revisión automática de accesibilidad WCAG 2.1 A/AA con axe-core. El reporte HTML queda en `playwright-report/`.

## Despliegue en Vercel + Neon

La aplicación se publica en Vercel con una base PostgreSQL en Neon, para que el jurado y los participantes de las pruebas puedan entrar desde cualquier dispositivo con un enlace. En local y en las pruebas se sigue usando SQLite (ver decisiones D02 y D15).

| Variable | Valor | La usa |
|---|---|---|
| `DATABASE_URL` | Cadena de Neon **con pooling** (host con `-pooler`) | La aplicación (driver `pg` con `@prisma/adapter-pg`) |
| `DATABASE_URL_UNPOOLED` | Cadena de Neon **directa** (sin `-pooler`) | `prisma db push` (`directUrl`) y el seed |
| `SESSION_SECRET` | Cadena larga y aleatoria (`openssl rand -base64 32`) | Firma de la cookie de sesión |

### Proyecto Neon vinculado

El repositorio ya está vinculado al proyecto Neon *PosgradoEnElExterior* (`summer-haze-17674729`, rama `production`) mediante `neon.ts`. En un clon nuevo:

```bash
npm i -g neon@latest
```

```bash
neon init -y --org-id org-billowing-rice-24597176 --project-id summer-haze-17674729 --branch production --services postgres
```

```bash
neon deploy --no-env-pull
```

```bash
npm run neon:env      # guarda DATABASE_URL y DATABASE_URL_UNPOOLED en .env.neon (no se versiona)
```

Las variables de Neon van en `.env.neon` y no en `.env` ni `.env.local`, para que `npm run dev` y `npm run test:e2e` sigan usando SQLite. *(Si `neon init` crea un `.env.local` con esas variables, bórralo o renómbralo.)*

Comandos contra Neon (cargan `.env.neon` solo para ese comando):

```bash
npm run neon:setup    # crea las tablas en Neon y carga los datos de prueba (borra los existentes)
```

```bash
npm run neon:build    # compila la aplicación apuntando a Neon
```

```bash
npm run neon:start    # levanta la aplicación compilada (http://localhost:3000)
```

```bash
npm run db:sqlite     # después de usar Neon: vuelve a generar el cliente de Prisma para SQLite
```

### Publicar en Vercel

1. Crea una cuenta en [vercel.com](https://vercel.com) con tu cuenta de GitHub e importa este repositorio.
2. Conecta la base: en **Storage**, agrega la integración de Neon y elige el proyecto existente (crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`), o copia ambas cadenas desde `.env.neon` en **Settings → Environment Variables**.
3. Agrega `SESSION_SECRET` en **Settings → Environment Variables**.
4. En **Settings → Build and Deployment**, cambia el *Build Command* a `npm run vercel-build`. Deja activado *Fluid compute* (es el valor por defecto).
5. Despliega. El build crea o actualiza las tablas y, si la base está vacía, carga los datos de prueba.

Cada `git push` a la rama principal vuelve a desplegar la aplicación sin borrar los datos.

## Estructura

```
docs/                  requerimientos y registro de decisiones
prisma/                esquema de datos (ficha estándar) y script de seed
scripts/               ajuste del proveedor de base de datos (SQLite/PostgreSQL)
src/app/               páginas (App Router)
src/components/        componentes de interfaz
src/lib/               reglas de negocio: fechas, estado de convocatorias, costos, filtros, ruta, sesión
src/lib/seed/          datos de prueba ficticios
e2e/                   pruebas de Playwright
```

## Avisos

- Todo el contenido es ficticio. Las entidades, instituciones, personas y enlaces son inventados; los enlaces oficiales apuntan a `example.org`.
- No se usan logotipos, marcas ni la identidad gráfica de gob.pe ni de ninguna entidad real.
- No hay integraciones reales con sistemas del Estado ni con la Plataforma de Interoperabilidad del Estado (PIDE). La información externa ingresa por el módulo de gestión de contenidos.
