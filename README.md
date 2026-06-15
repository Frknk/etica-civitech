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

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4 (carpeta `src/`).
- **Backend**: API REST con [Elysia](https://elysiajs.com/) sobre **Bun**
  (carpeta `server/`).
- **Base de datos**: **SQLite** mediante `bun:sqlite` (archivo `civictech.db`).
  El esquema está documentado en [`docs/ESQUEMA_BD.md`](docs/ESQUEMA_BD.md).

Toda la persistencia vive en la base de datos compartida: los reportes que
crean los estudiantes son visibles para el comité desde cualquier dispositivo.

## Cómo ejecutarlo

Requiere [Bun](https://bun.sh) instalado.

```bash
bun install      # instala dependencias (una sola vez)
bun run dev:all  # inicia API (http://localhost:3001) y web (http://localhost:5173)
```

O en dos terminales separadas:

```bash
bun run server   # API Elysia con recarga en caliente
bun run dev       # servidor de desarrollo de Vite
```

Para generar la versión de demostración (por ejemplo, para publicarla y
generar el **código QR** de captación):

```bash
bun run build    # genera la carpeta dist/
bun run preview  # sirve la versión de producción localmente
```

> En producción, el frontend (`dist/`) y la API deben servirse juntos (mismo
> origen) o configurar CORS; el backend necesita un host con **disco
> persistente** para el archivo SQLite (Railway, Fly.io, un VPS…).

## Notas para la validación

- Los datos (reportes, bitácora y progreso formativo) se guardan en la base de
  datos SQLite del servidor. El archivo `civictech.db` se crea solo al arrancar
  y se siembra con reportes de muestra la primera vez.
- El progreso formativo se separa por aprendiz mediante un identificador local
  anónimo (no hay inicio de sesión ni datos personales).
- Para probar el flujo completo: crea un reporte en `/reportar`, copia el
  código, síguelo en `/seguimiento` y avánzalo desde `/comite`.

## Tecnología

React + TypeScript + Vite + Tailwind CSS v4 · Elysia + Bun + SQLite.
Tipografías: Fraunces (display), Inter (cuerpo), IBM Plex Mono (códigos y
etiquetas).
