import { STATUS_META, LEARN_MODULES, BADGES } from "../src/lib/constants";
import type {
  CategoryId,
  LearnProgress,
  Report,
  ReportEvidence,
  ReportStatus,
} from "../src/lib/types";

/* ============================================================
   Capa de datos del backend CivicTech sobre Cloudflare D1.
   Reemplaza la versión síncrona con bun:sqlite (server/db.ts):
   todas las operaciones son asíncronas y usan sentencias
   preparadas con parámetros enlazados (sin interpolar SQL).
   El esquema vive en migrations/0001_init.sql.
   ============================================================ */

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

async function hydrate(db: D1Database, row: ReportRow): Promise<Report> {
  const [evidence, notes] = await db.batch([
    db
      .prepare(
        "SELECT name, size FROM report_evidence WHERE report_code = ? ORDER BY id"
      )
      .bind(row.code),
    db
      .prepare(
        'SELECT status_id AS status, "by", message, at FROM report_note WHERE report_code = ? ORDER BY at, id'
      )
      .bind(row.code),
  ]);

  return {
    code: row.code,
    category: row.category_id,
    title: row.title,
    description: row.description,
    context: row.context,
    anonymous: row.anonymous === 1,
    contactAlias: row.contact_alias ?? undefined,
    evidence: evidence.results as ReportEvidence[],
    status: row.status_id,
    createdAt: row.created_at,
    notes: notes.results as Report["notes"],
  };
}

export async function getReports(db: D1Database): Promise<Report[]> {
  const { results } = await db
    .prepare("SELECT * FROM report ORDER BY created_at DESC")
    .all<ReportRow>();
  return Promise.all(results.map((row) => hydrate(db, row)));
}

export async function getReportByCode(
  db: D1Database,
  code: string
): Promise<Report | undefined> {
  const row = await db
    .prepare("SELECT * FROM report WHERE code = ?")
    .bind(code.trim().toUpperCase())
    .first<ReportRow>();
  return row ? hydrate(db, row) : undefined;
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

export async function createReport(
  db: D1Database,
  input: NewReportInput
): Promise<Report> {
  // Garantiza un código único antes de insertar.
  let code = generateCode();
  while (
    await db.prepare("SELECT 1 FROM report WHERE code = ?").bind(code).first()
  )
    code = generateCode();

  const now = Date.now();

  const statements = [
    db
      .prepare(
        `INSERT INTO report (code, category_id, title, description, context, anonymous, contact_alias, status_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'recibido', ?)`
      )
      .bind(
        code,
        input.category,
        input.title.trim(),
        input.description.trim(),
        input.context.trim(),
        input.anonymous ? 1 : 0,
        input.anonymous ? null : input.contactAlias?.trim() ?? null,
        now
      ),
    db
      .prepare(
        'INSERT INTO report_note (report_code, status_id, "by", message, at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        code,
        "recibido",
        "sistema",
        "Reporte recibido de forma segura. Conserva tu código para seguir su atención.",
        now
      ),
    ...input.evidence.map((e) =>
      db
        .prepare(
          "INSERT INTO report_evidence (report_code, name, size) VALUES (?, ?, ?)"
        )
        .bind(code, e.name, e.size)
    ),
  ];

  await db.batch(statements);
  return (await getReportByCode(db, code))!;
}

export async function advanceReport(
  db: D1Database,
  code: string,
  status: ReportStatus,
  message: string
): Promise<Report | undefined> {
  const norm = code.trim().toUpperCase();
  const exists = await db
    .prepare("SELECT 1 FROM report WHERE code = ?")
    .bind(norm)
    .first();
  if (!exists) return undefined;

  await db.batch([
    db
      .prepare("UPDATE report SET status_id = ? WHERE code = ?")
      .bind(status, norm),
    db
      .prepare(
        'INSERT INTO report_note (report_code, status_id, "by", message, at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        norm,
        status,
        "comité",
        message.trim() || STATUS_META[status].help,
        Date.now()
      ),
  ]);

  return getReportByCode(db, norm);
}

/* ------------------------- Formación ---------------------------- */

async function ensureLearner(db: D1Database, learnerId: string): Promise<void> {
  await db
    .prepare(
      "INSERT INTO learner (id, points, created_at) VALUES (?, 0, ?) ON CONFLICT(id) DO NOTHING"
    )
    .bind(learnerId, Date.now())
    .run();
}

export async function getProgress(
  db: D1Database,
  learnerId: string
): Promise<LearnProgress> {
  await ensureLearner(db, learnerId);
  const [modules, badges, learner] = await db.batch([
    db
      .prepare("SELECT module_id FROM learner_module WHERE learner_id = ?")
      .bind(learnerId),
    db
      .prepare("SELECT badge_id FROM learner_badge WHERE learner_id = ?")
      .bind(learnerId),
    db.prepare("SELECT points FROM learner WHERE id = ?").bind(learnerId),
  ]);

  return {
    completed: (modules.results as { module_id: string }[]).map(
      (r) => r.module_id
    ),
    badges: (badges.results as { badge_id: string }[]).map((r) => r.badge_id),
    points: (learner.results[0] as { points: number }).points,
  };
}

export async function completeModule(
  db: D1Database,
  learnerId: string,
  moduleId: string
): Promise<LearnProgress> {
  await ensureLearner(db, learnerId);
  const current = await getProgress(db, learnerId);
  const mod = LEARN_MODULES.find((m) => m.id === moduleId);
  if (!mod || current.completed.includes(moduleId)) return current;

  const now = Date.now();
  const completed = [...current.completed, moduleId];
  const points = current.points + mod.points;

  const statements = [
    db
      .prepare(
        "INSERT OR IGNORE INTO learner_module (learner_id, module_id, completed_at) VALUES (?, ?, ?)"
      )
      .bind(learnerId, moduleId, now),
    db
      .prepare("UPDATE learner SET points = ? WHERE id = ?")
      .bind(points, learnerId),
    // Las insignias se ganan SIEMPRE por formación e integridad, nunca por nº de reportes.
    ...BADGES.filter((b) => b.rule({ points, completed })).map((b) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO learner_badge (learner_id, badge_id, earned_at) VALUES (?, ?, ?)"
        )
        .bind(learnerId, b.id, now)
    ),
  ];

  await db.batch(statements);
  return getProgress(db, learnerId);
}

export async function resetProgress(
  db: D1Database,
  learnerId: string
): Promise<LearnProgress> {
  await ensureLearner(db, learnerId);
  await db.batch([
    db
      .prepare("DELETE FROM learner_module WHERE learner_id = ?")
      .bind(learnerId),
    db.prepare("DELETE FROM learner_badge WHERE learner_id = ?").bind(learnerId),
    db.prepare("UPDATE learner SET points = 0 WHERE id = ?").bind(learnerId),
  ]);
  return getProgress(db, learnerId);
}
