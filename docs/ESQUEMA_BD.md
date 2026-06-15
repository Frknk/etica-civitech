# Esquema de base de datos — CivicTech Ética (SQLite)

Modelo derivado del prototipo actual (`src/lib/types.ts` y `src/lib/store.ts`).
Sustituye la persistencia en `localStorage` por SQLite.

## Diagrama Entidad–Relación

```mermaid
erDiagram
    CATEGORY ||--o{ REPORT : clasifica
    REPORT ||--o{ REPORT_EVIDENCE : adjunta
    REPORT ||--o{ REPORT_NOTE : registra
    REPORT }o--|| REPORT_STATUS : tiene
    REPORT_NOTE }o--|| REPORT_STATUS : refleja

    LEARNER ||--o{ LEARNER_MODULE : completa
    LEARNER ||--o{ LEARNER_BADGE : obtiene
    LEARN_MODULE ||--o{ LEARNER_MODULE : es_completado_en
    BADGE ||--o{ LEARNER_BADGE : es_otorgada_en

    CATEGORY {
        text id PK "plagio | conflicto | mala-praxis | uso-indebido | deontologia"
        text label
        text short
        text description
    }

    REPORT_STATUS {
        text id PK "recibido | clasificado | derivado | atendido"
        text label
        text help
        int  flow_order
    }

    REPORT {
        text code PK "Código confidencial CVT-XXXX-XXXX"
        text category_id FK
        text title
        text description
        text context
        int  anonymous "0/1"
        text contact_alias "NULL si es anónimo"
        text status_id FK
        int  created_at "epoch ms"
    }

    REPORT_EVIDENCE {
        integer id PK
        text report_code FK
        text name
        int  size "bytes"
    }

    REPORT_NOTE {
        integer id PK
        text report_code FK
        text status_id FK
        text by "comité | sistema"
        text message
        int  at "epoch ms"
    }

    LEARNER {
        text id PK "código/perfil del aprendiz"
        text alias "opcional"
        int  points
        int  created_at
    }

    LEARN_MODULE {
        text id PK
        text title
        int  minutes
        text summary
        int  points
        text question
        text options "JSON"
        int  answer
    }

    BADGE {
        text id PK
        text label
        text description
    }

    LEVEL {
        text name PK "Semilla | Brote | Planta | Árbol"
        int  min_points
    }

    LEARNER_MODULE {
        text learner_id FK
        text module_id FK
        int  completed_at
    }

    LEARNER_BADGE {
        text learner_id FK
        text badge_id FK
        int  earned_at
    }
```

## Notas de diseño

- **`REPORT.code`** es la clave natural (no se usa autoincrement) porque es el
  único identificador que conserva el reportante. Nunca se vincula a una
  identidad real: `contact_alias` solo existe si el reportante decide no ser
  anónimo.
- **`CATEGORY`, `REPORT_STATUS`, `LEARN_MODULE`, `BADGE`, `LEVEL`** son tablas de
  catálogo (datos de referencia). Hoy viven en `src/lib/constants.ts`; se
  pueden sembrar (seed) o dejarse en código y guardar solo los IDs como FK.
- **`LEARNER`** es nuevo: hoy el progreso formativo es único por navegador y sin
  identidad. Con BD se necesita un identificador de aprendiz (un código
  generado, igual que el del reporte) para separar el progreso de cada persona.
  `LEARNER_BADGE` materializa las insignias; las reglas de obtención siguen en
  código.
- Las insignias y niveles **se ganan por formación e integridad, nunca por
  número de reportes** — el esquema mantiene esa separación: no hay relación
  entre `LEARNER` y `REPORT`.
```sql
-- Ejemplo de definición de las tablas principales
CREATE TABLE report (
  code         TEXT PRIMARY KEY,
  category_id  TEXT NOT NULL REFERENCES category(id),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  context      TEXT NOT NULL,
  anonymous    INTEGER NOT NULL DEFAULT 1,
  contact_alias TEXT,
  status_id    TEXT NOT NULL REFERENCES report_status(id),
  created_at   INTEGER NOT NULL
);

CREATE TABLE report_evidence (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_code TEXT NOT NULL REFERENCES report(code) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  size        INTEGER NOT NULL
);

CREATE TABLE report_note (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_code TEXT NOT NULL REFERENCES report(code) ON DELETE CASCADE,
  status_id   TEXT NOT NULL REFERENCES report_status(id),
  by          TEXT NOT NULL CHECK (by IN ('comité','sistema')),
  message     TEXT NOT NULL,
  at          INTEGER NOT NULL
);
```
