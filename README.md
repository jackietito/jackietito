# Ventanilla Digital de Oportunidades de Posgrado en el Exterior

> **Prototipo académico – datos ficticios.**
> Proyecto del Programa de Gobernabilidad e Innovación Pública PUCP–CAF (Grupo 2, Fase 4: Prototipar).

En el Perú, la información sobre posgrados y becas en el exterior está dispersa entre varias entidades públicas y universidades. La Ventanilla reúne esa información en un punto único, permite compararla, ordena los trámites previos a la postulación y avisa a tiempo. **No reemplaza la postulación ni los trámites:** informa y deriva a los canales oficiales.

Este prototipo funcional sirve para validar la experiencia con usuarios en pruebas de usabilidad.

- Requerimientos: [`docs/requerimientos.md`](docs/requerimientos.md)
- Decisiones tomadas durante la construcción: [`docs/decisiones.md`](docs/decisiones.md)

## Estado de los incrementos

| # | Contenido | Estado |
|---|---|---|
| 1 | Modelo de datos, datos de prueba, catálogo, ficha, buscador y filtros | ✅ Listo |
| 2 | Registro, perfil, recomendaciones, comparador y guardado | ⏳ Pendiente |
| 3 | Mapa de trámites, ruta paso a paso y checklist | ⏳ Pendiente |
| 4 | Alertas, panel de seguimiento, orientación y encuesta | ⏳ Pendiente |
| 5 | Gestión de contenidos, tablero de indicadores y reporte a entidades | ⏳ Pendiente |

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

Todas las cuentas usan la contraseña **`Prototipo2026!`**. *(El ingreso se habilita en el incremento 2.)*

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

Cualquier persona puede, además, crear su propia cuenta de ciudadano desde la aplicación.

## Pruebas

```bash
npm run test:e2e
```

Las pruebas levantan un servidor propio en el puerto 3100 con una base aparte (`prisma/e2e.db`), recargada con el seed en cada ejecución. Se ejecutan en una vista de escritorio y otra móvil, e incluyen una revisión automática de accesibilidad WCAG 2.1 A/AA con axe-core. El reporte HTML queda en `playwright-report/`.

## Despliegue en Vercel + Neon

La aplicación se publica en Vercel con una base PostgreSQL gratuita en Neon, para que el jurado y los participantes de las pruebas puedan entrar desde cualquier dispositivo con un enlace.

1. Crea una cuenta en [neon.tech](https://neon.tech) y un proyecto nuevo. Copia la cadena de conexión (`postgresql://...`).
2. Crea una cuenta en [vercel.com](https://vercel.com) con tu cuenta de GitHub e importa este repositorio.
3. En **Settings → Environment Variables** agrega:
   - `DATABASE_URL`: la cadena de conexión de Neon.
   - `SESSION_SECRET`: una cadena larga y aleatoria (por ejemplo, el resultado de `openssl rand -base64 32`).
4. En **Settings → Build and Deployment**, cambia el *Build Command* a `npm run vercel-build`.
5. Despliega. El build crea las tablas y, si la base está vacía, carga los datos de prueba.

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
