-- ============================================================
-- CivicTech – Ética Profesional · esquema inicial (Cloudflare D1)
-- Migra el esquema de bun:sqlite (server/db.ts) a D1.
-- Incluye el sembrado de catálogos de referencia (categorías y
-- estados) y dos reportes de muestra para la primera demostración.
-- ============================================================

-- ----------------------------- Esquema -----------------------------

CREATE TABLE IF NOT EXISTS category (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  short       TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_status (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  help       TEXT NOT NULL,
  flow_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS report (
  code          TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL REFERENCES category(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  context       TEXT NOT NULL,
  anonymous     INTEGER NOT NULL DEFAULT 1,
  contact_alias TEXT,
  status_id     TEXT NOT NULL REFERENCES report_status(id),
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS report_evidence (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_code TEXT NOT NULL REFERENCES report(code) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  size        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS report_note (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_code TEXT NOT NULL REFERENCES report(code) ON DELETE CASCADE,
  status_id   TEXT NOT NULL REFERENCES report_status(id),
  "by"        TEXT NOT NULL CHECK ("by" IN ('comité','sistema')),
  message     TEXT NOT NULL,
  at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS learner (
  id         TEXT PRIMARY KEY,
  alias      TEXT,
  points     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS learner_module (
  learner_id   TEXT NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  module_id    TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (learner_id, module_id)
);

CREATE TABLE IF NOT EXISTS learner_badge (
  learner_id TEXT NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  INTEGER NOT NULL,
  PRIMARY KEY (learner_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_report_created_at ON report(created_at);
CREATE INDEX IF NOT EXISTS idx_report_evidence_code ON report_evidence(report_code);
CREATE INDEX IF NOT EXISTS idx_report_note_code ON report_note(report_code, at);

-- ----------------------- Catálogos de referencia -----------------------
-- Datos de referencia (objetivo de las FK). Reflejan src/lib/constants.ts;
-- mantén ambos sincronizados si cambian las categorías o el flujo.

INSERT INTO category (id, label, short, description) VALUES
  ('plagio',      'Plagio',                          'Apropiación de trabajo ajeno',     'Presentar como propio el trabajo, las ideas o los datos de otra persona sin reconocerlo.'),
  ('conflicto',   'Conflicto de interés',            'Interés personal sobre el deber',  'Situaciones donde un interés personal puede influir de forma indebida en una decisión profesional.'),
  ('mala-praxis', 'Mala praxis',                     'Ejercicio negligente o indebido',  'Actuación profesional negligente o contraria a las buenas prácticas de la disciplina.'),
  ('uso-indebido','Uso indebido de información',     'Datos usados sin autorización',    'Manejo, divulgación o aprovechamiento de información o datos sin la debida autorización.'),
  ('deontologia', 'Incumplimiento deontológico',     'Falta al código profesional',      'Incumplimiento de los códigos deontológicos o normas del ejercicio profesional.')
ON CONFLICT(id) DO UPDATE SET
  label=excluded.label, short=excluded.short, description=excluded.description;

INSERT INTO report_status (id, label, help, flow_order) VALUES
  ('recibido',    'Recibido',    'Tu reporte llegó de forma segura y está registrado.', 0),
  ('clasificado', 'Clasificado', 'El comité revisó y categorizó el reporte.',           1),
  ('derivado',    'Derivado',    'Se envió al área competente para su atención.',       2),
  ('atendido',    'Atendido',    'El caso recibió una respuesta o cierre formativo.',   3)
ON CONFLICT(id) DO UPDATE SET
  label=excluded.label, help=excluded.help, flow_order=excluded.flow_order;

-- ----------------------- Reportes de muestra -----------------------
-- Solo se insertan si la tabla está vacía (primera demostración).
-- Marcas de tiempo relativas a un instante fijo de referencia para que
-- el sembrado sea determinista (no dependen de la hora de migración).

INSERT INTO report (code, category_id, title, description, context, anonymous, contact_alias, status_id, created_at)
SELECT 'CVT-7K2M-9XQP', 'plagio',
       'Trabajo presentado sin citar la fuente original',
       'Se observó un informe que reproduce párrafos completos de otra autoría sin referencia.',
       'Curso de pregrado, entrega grupal.',
       1, NULL, 'clasificado', 1749000000000
WHERE NOT EXISTS (SELECT 1 FROM report);

INSERT INTO report_note (report_code, status_id, "by", message, at)
SELECT 'CVT-7K2M-9XQP', 'recibido', 'sistema',
       'Reporte recibido de forma segura. Conserva tu código para seguir su atención.',
       1749000000000
WHERE EXISTS (SELECT 1 FROM report WHERE code = 'CVT-7K2M-9XQP');

INSERT INTO report_note (report_code, status_id, "by", message, at)
SELECT 'CVT-7K2M-9XQP', 'clasificado', 'comité',
       'El comité revisó el reporte y lo clasificó como posible plagio académico.',
       1749086400000
WHERE EXISTS (SELECT 1 FROM report WHERE code = 'CVT-7K2M-9XQP');

INSERT INTO report (code, category_id, title, description, context, anonymous, contact_alias, status_id, created_at)
SELECT 'CVT-4A8D-2RLT', 'conflicto',
       'Posible conflicto de interés en una evaluación',
       'Un evaluador tendría relación cercana con una de las personas evaluadas.',
       'Proceso de evaluación interna.',
       0, 'Estudiante de 5.º ciclo', 'recibido', 1749172800000
WHERE EXISTS (SELECT 1 FROM report WHERE code = 'CVT-7K2M-9XQP')
  AND NOT EXISTS (SELECT 1 FROM report WHERE code = 'CVT-4A8D-2RLT');

INSERT INTO report_note (report_code, status_id, "by", message, at)
SELECT 'CVT-4A8D-2RLT', 'recibido', 'sistema',
       'Reporte recibido de forma segura. Conserva tu código para seguir su atención.',
       1749172800000
WHERE EXISTS (SELECT 1 FROM report WHERE code = 'CVT-4A8D-2RLT');
