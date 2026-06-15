import { Database } from "bun:sqlite";
import { CATEGORIES, STATUS_META, STATUS_FLOW, LEARN_MODULES, BADGES } from "../src/lib/constants";
import type {
  CategoryId,
  LearnProgress,
  Report,
  ReportEvidence,
  ReportStatus,
} from "../src/lib/types";

/* ============================================================
   Capa de datos del backend CivicTech (SQLite vía bun:sqlite).
   Sustituye la persistencia en localStorage del prototipo.
   Esquema documentado en docs/ESQUEMA_BD.md.
   ============================================================ */

const db = new Database(process.env.CIVICTECH_DB ?? "civictech.db", {
  create: true,
});
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

/* ---------------------------- Esquema ---------------------------- */

db.run(`
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
`);

/* ----------------------- Catálogos de referencia ----------------------- */
// Las categorías y estados son datos de referencia (FK targets). Se siembran
// desde src/lib/constants.ts para mantener una sola fuente de verdad.

const upsertCategory = db.query(
  `INSERT INTO category (id, label, short, description) VALUES (?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET label=excluded.label, short=excluded.short, description=excluded.description`
);
for (const c of CATEGORIES)
  upsertCategory.run(c.id, c.label, c.short, c.description);

const upsertStatus = db.query(
  `INSERT INTO report_status (id, label, help, flow_order) VALUES (?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET label=excluded.label, help=excluded.help, flow_order=excluded.flow_order`
);
STATUS_FLOW.forEach((s, i) =>
  upsertStatus.run(s, STATUS_META[s].label, STATUS_META[s].help, i)
);

/* --------------------------- Reportes --------------------------- */

function generateCode(): string {
  const blocks = ["CVT"];
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  for (let b = 0; b < 2; b++) {
    let s = "";
    for (let i = 0; i < 4; i++)
      s += chars[Math.floor(Math.random() * chars.length)];
    blocks.push(s);
  }
  return blocks.join("-");
}

interface ReportRow {
  code: string;
  category_id: CategoryId;
  title: string;
  description: string;
  context: string;
  anonymous: number;
  contact_alias: string | null;
  status_id: ReportStatus;
  created_at: number;
}

const qEvidence = db.query(
  "SELECT name, size FROM report_evidence WHERE report_code = ? ORDER BY id"
);
const qNotes = db.query(
  'SELECT status_id as status, "by", message, at FROM report_note WHERE report_code = ? ORDER BY at, id'
);

function hydrate(row: ReportRow): Report {
  return {
    code: row.code,
    category: row.category_id,
    title: row.title,
    description: row.description,
    context: row.context,
    anonymous: row.anonymous === 1,
    contactAlias: row.contact_alias ?? undefined,
    evidence: qEvidence.all(row.code) as ReportEvidence[],
    status: row.status_id,
    createdAt: row.created_at,
    notes: qNotes.all(row.code) as Report["notes"],
  };
}

const qAllReports = db.query(
  "SELECT * FROM report ORDER BY created_at DESC"
);
const qReportByCode = db.query("SELECT * FROM report WHERE code = ?");

export function getReports(): Report[] {
  return (qAllReports.all() as ReportRow[]).map(hydrate);
}

export function getReportByCode(code: string): Report | undefined {
  const row = qReportByCode.get(code.trim().toUpperCase()) as
    | ReportRow
    | null;
  return row ? hydrate(row) : undefined;
}

export interface NewReportInput {
  category: CategoryId;
  title: string;
  description: string;
  context: string;
  anonymous: boolean;
  contactAlias?: string;
  evidence: ReportEvidence[];
}

const insertReport = db.query(
  `INSERT INTO report (code, category_id, title, description, context, anonymous, contact_alias, status_id, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, 'recibido', ?)`
);
const insertEvidence = db.query(
  "INSERT INTO report_evidence (report_code, name, size) VALUES (?, ?, ?)"
);
const insertNote = db.query(
  'INSERT INTO report_note (report_code, status_id, "by", message, at) VALUES (?, ?, ?, ?, ?)'
);

export const createReport = db.transaction((input: NewReportInput): Report => {
  // Garantiza un código único.
  let code = generateCode();
  while (qReportByCode.get(code)) code = generateCode();
  const now = Date.now();

  insertReport.run(
    code,
    input.category,
    input.title.trim(),
    input.description.trim(),
    input.context.trim(),
    input.anonymous ? 1 : 0,
    input.anonymous ? null : input.contactAlias?.trim() ?? null,
    now
  );
  for (const e of input.evidence) insertEvidence.run(code, e.name, e.size);
  insertNote.run(
    code,
    "recibido",
    "sistema",
    "Reporte recibido de forma segura. Conserva tu código para seguir su atención.",
    now
  );
  return getReportByCode(code)!;
});

const updateReportStatus = db.query(
  "UPDATE report SET status_id = ? WHERE code = ?"
);

export const advanceReport = db.transaction(
  (code: string, status: ReportStatus, message: string): Report | undefined => {
    const existing = qReportByCode.get(code) as ReportRow | null;
    if (!existing) return undefined;
    updateReportStatus.run(status, code);
    insertNote.run(
      code,
      status,
      "comité",
      message.trim() || STATUS_META[status].help,
      Date.now()
    );
    return getReportByCode(code);
  }
);

/* ------------------------- Formación ---------------------------- */

const ensureLearner = db.query(
  "INSERT INTO learner (id, points, created_at) VALUES (?, 0, ?) ON CONFLICT(id) DO NOTHING"
);
const qLearnerModules = db.query(
  "SELECT module_id FROM learner_module WHERE learner_id = ?"
);
const qLearnerBadges = db.query(
  "SELECT badge_id FROM learner_badge WHERE learner_id = ?"
);
const qLearnerPoints = db.query("SELECT points FROM learner WHERE id = ?");

export function getProgress(learnerId: string): LearnProgress {
  ensureLearner.run(learnerId, Date.now());
  const completed = (qLearnerModules.all(learnerId) as { module_id: string }[]).map(
    (r) => r.module_id
  );
  const badges = (qLearnerBadges.all(learnerId) as { badge_id: string }[]).map(
    (r) => r.badge_id
  );
  const points = (qLearnerPoints.get(learnerId) as { points: number }).points;
  return { completed, points, badges };
}

const insertLearnerModule = db.query(
  "INSERT OR IGNORE INTO learner_module (learner_id, module_id, completed_at) VALUES (?, ?, ?)"
);
const setLearnerPoints = db.query("UPDATE learner SET points = ? WHERE id = ?");
const insertLearnerBadge = db.query(
  "INSERT OR IGNORE INTO learner_badge (learner_id, badge_id, earned_at) VALUES (?, ?, ?)"
);

export const completeModule = db.transaction(
  (learnerId: string, moduleId: string): LearnProgress => {
    ensureLearner.run(learnerId, Date.now());
    const current = getProgress(learnerId);
    const mod = LEARN_MODULES.find((m) => m.id === moduleId);
    if (!mod || current.completed.includes(moduleId)) return current;

    const now = Date.now();
    insertLearnerModule.run(learnerId, moduleId, now);
    const completed = [...current.completed, moduleId];
    const points = current.points + mod.points;
    setLearnerPoints.run(points, learnerId);

    // Las insignias se ganan SIEMPRE por formación e integridad, nunca por nº de reportes.
    for (const b of BADGES) {
      if (b.rule({ points, completed }))
        insertLearnerBadge.run(learnerId, b.id, now);
    }
    return getProgress(learnerId);
  }
);

const delLearnerModules = db.query(
  "DELETE FROM learner_module WHERE learner_id = ?"
);
const delLearnerBadges = db.query(
  "DELETE FROM learner_badge WHERE learner_id = ?"
);

export const resetProgress = db.transaction((learnerId: string): LearnProgress => {
  ensureLearner.run(learnerId, Date.now());
  delLearnerModules.run(learnerId);
  delLearnerBadges.run(learnerId);
  setLearnerPoints.run(0, learnerId);
  return getProgress(learnerId);
});

/* ----------------------- Datos de muestra ----------------------- */
// Siembra reportes de ejemplo una sola vez (cuando la tabla está vacía),
// para que el panel del comité no luzca vacío en la primera demostración.

export function seedOnce() {
  const count = (db.query("SELECT COUNT(*) as n FROM report").get() as {
    n: number;
  }).n;
  if (count > 0) return;

  const now = Date.now();
  const day = 86400000;

  const seed = db.transaction(() => {
    insertReport.run(
      "CVT-7K2M-9XQP",
      "plagio",
      "Trabajo presentado sin citar la fuente original",
      "Se observó un informe que reproduce párrafos completos de otra autoría sin referencia.",
      "Curso de pregrado, entrega grupal.",
      1,
      null,
      now - day * 3
    );
    updateReportStatus.run("clasificado", "CVT-7K2M-9XQP");
    insertNote.run(
      "CVT-7K2M-9XQP",
      "recibido",
      "sistema",
      "Reporte recibido de forma segura. Conserva tu código para seguir su atención.",
      now - day * 3
    );
    insertNote.run(
      "CVT-7K2M-9XQP",
      "clasificado",
      "comité",
      "El comité revisó el reporte y lo clasificó como posible plagio académico.",
      now - day * 2
    );

    insertReport.run(
      "CVT-4A8D-2RLT",
      "conflicto",
      "Posible conflicto de interés en una evaluación",
      "Un evaluador tendría relación cercana con una de las personas evaluadas.",
      "Proceso de evaluación interna.",
      0,
      "Estudiante de 5.º ciclo",
      now - day
    );
    insertNote.run(
      "CVT-4A8D-2RLT",
      "recibido",
      "sistema",
      "Reporte recibido de forma segura. Conserva tu código para seguir su atención.",
      now - day
    );
  });
  seed();
}
