# CivicTech – Ética Profesional

Prototipo web para **promover la ética profesional mediante el reporte
responsable y confidencial de incidentes éticos**, desarrollado para la
asignatura *Ética y Práctica Profesional* — Universidad Nacional Agraria de la
Selva (UNAS), Tingo María, Perú.

> La ética no se impone: se cultiva. La plataforma reconoce la formación y la
> integridad, **no el número de denuncias**, y evita todo enfoque punitivo.

## Módulos implementados

Según el plan de actividades del proyecto:

1. **Reporte de incidentes** — categoría, descripción, contexto y evidencia
   documental opcional (`/reportar`).
2. **Confidencialidad y anonimato** — el reportante decide no identificarse;
   recibe un código de seguimiento como única llave.
3. **Clasificación y seguimiento** — flujo *recibido → clasificado → derivado →
   atendido*, visible para el reportante (`/seguimiento`).
4. **Reconocimiento de buenas prácticas** — puntos, niveles (Semilla → Brote →
   Planta → Árbol) e insignias ganadas por formación e integridad
   (`/formacion`).
5. **Notificaciones con conciencia ética** — mensajes formativos que acompañan
   el uso del sistema.
6. **Panel del comité de ética** — clasificar, derivar y registrar la atención
   de cada reporte con bitácora trazable (`/comite`).

## Arquitectura

Todo se despliega en **Cloudflare** como un único Worker (mismo origen, sin
CORS):

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4 (carpeta `src/`),
  servido como SPA estática (binding `ASSETS`).
- **Backend**: API REST con [Hono](https://hono.dev/) sobre **Cloudflare
  Workers** (carpeta `worker/`). El Worker atiende `/api/*` y delega el resto
  al SPA.
- **Base de datos**: **Cloudflare D1** (SQLite serverless), binding `DB`. El
  esquema y el sembrado están en [`migrations/`](migrations/) y documentados en
  [`docs/ESQUEMA_BD.md`](docs/ESQUEMA_BD.md).

Toda la persistencia vive en la base de datos compartida: los reportes que
crean los estudiantes son visibles para el comité desde cualquier dispositivo.

### Seguridad

- El **panel del comité** (`/comite`) y la acción de avanzar un reporte exigen
  una **clave del comité**, guardada como secreto del Worker
  (`COMMITTEE_KEY`). El resto del API es público por diseño: el reportante usa
  su **código de seguimiento confidencial** como única llave.
- Cabeceras de seguridad (CSP, HSTS, `X-Content-Type-Options`, etc.) definidas
  en [`public/_headers`](public/_headers).

## Desarrollo local

Requiere [Bun](https://bun.sh) (o npm) instalado.

```bash
bun install                  # instala dependencias (una sola vez)
bun run db:migrate:local     # crea el esquema en la D1 local (una vez)
bun run dev                  # Vite + Worker + D1 en local (http://localhost:5173)
```

`vite dev` levanta el SPA y el API `/api/*` en el mismo origen mediante el
plugin de Cloudflare, con D1 local en `.wrangler/`.

Para validar el build de producción localmente:

```bash
bun run build    # type-check (app + worker) y build a dist/
bun run preview  # sirve el Worker construido en local
```

## Despliegue a Cloudflare

Una sola vez, autenticación y recursos:

```bash
bun run build                         # genera dist/ (también verifica tipos)
wrangler login                        # autentica tu cuenta
wrangler d1 create civictech          # crea la base D1
#  → copia el "database_id" devuelto en wrangler.jsonc
wrangler secret put COMMITTEE_KEY     # define la clave de acceso del comité
wrangler d1 migrations apply civictech --remote   # aplica el esquema en producción
```

Despliegues posteriores:

```bash
bun run deploy   # build + wrangler deploy
```

## Notas para la validación

- Los datos (reportes, bitácora y progreso formativo) se guardan en Cloudflare
  D1. El esquema y los reportes de muestra se cargan con las migraciones de
  [`migrations/`](migrations/).
- El progreso formativo se separa por aprendiz mediante un identificador local
  anónimo (no hay inicio de sesión ni datos personales del reportante).
- El panel del comité pide la clave `COMMITTEE_KEY`; sin ella, el API no expone
  el listado de reportes.
- Para probar el flujo completo: crea un reporte en `/reportar`, copia el
  código, síguelo en `/seguimiento` y avánzalo desde `/comite` (tras introducir
  la clave del comité).

## Tecnología

React + TypeScript + Vite + Tailwind CSS v4 · Hono + Cloudflare Workers + D1.
Tipografías: Fraunces (display), Inter (cuerpo), IBM Plex Mono (códigos y
etiquetas).
