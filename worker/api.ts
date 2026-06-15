import { Hono } from "hono";
import type { Context, Next } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  advanceReport,
  completeModule,
  createReport,
  getProgress,
  getReportByCode,
  getReports,
  resetProgress,
} from "./db";
import { isCommittee } from "./auth";
import { STATUS_FLOW } from "../src/lib/constants";
import type { ReportStatus } from "../src/lib/types";

export interface Env {
  DB: D1Database;
  /** Clave compartida del comité (wrangler secret put COMMITTEE_KEY). */
  COMMITTEE_KEY?: string;
}

/* ----------------------------- Validación ----------------------------- */
// Equivalentes a los esquemas t.Object de la versión Elysia. Un error de
// validación responde 422 con un mensaje único (no se filtran detalles).

const newReportSchema = z.object({
  category: z.enum([
    "plagio",
    "conflicto",
    "mala-praxis",
    "uso-indebido",
    "deontologia",
  ]),
  title: z.string().min(6),
  description: z.string().min(20),
  context: z.string(),
  anonymous: z.boolean(),
  contactAlias: z.string().optional(),
  evidence: z.array(z.object({ name: z.string(), size: z.number() })),
});

const advanceSchema = z.object({
  status: z.enum(STATUS_FLOW as [string, ...string[]]),
  message: z.string(),
});

const completeSchema = z.object({ moduleId: z.string() });

const invalid = () =>
  new Response(JSON.stringify({ error: "Datos del reporte inválidos." }), {
    status: 422,
    headers: { "Content-Type": "application/json" },
  });

/* ------------------------------- Rutas -------------------------------- */

export const api = new Hono<{ Bindings: Env }>().basePath("/api");

api.onError((err, c) => {
  console.error("API error:", err);
  return c.json({ error: "Error interno." }, 500);
});

/** Middleware: exige clave válida del comité. */
const requireCommittee = async (c: Context<{ Bindings: Env }>, next: Next) => {
  if (!isCommittee(c.req.header("Authorization"), c.env.COMMITTEE_KEY)) {
    return c.json({ error: "Acceso restringido al comité." }, 401);
  }
  await next();
};

/* --------------------------- Comité (auth) ---------------------------- */

// Verifica la clave sin exponer datos: permite que el panel valide el acceso.
api.post("/committee/login", requireCommittee, (c) => c.json({ ok: true }));

// Listado completo de reportes: solo el comité.
api.get("/reports", requireCommittee, async (c) =>
  c.json(await getReports(c.env.DB))
);

api.post(
  "/reports/:code/advance",
  requireCommittee,
  zValidator("json", advanceSchema, (r) => (r.success ? undefined : invalid())),
  async (c) => {
    const { status, message } = c.req.valid("json");
    const updated = await advanceReport(
      c.env.DB,
      c.req.param("code"),
      status as ReportStatus,
      message
    );
    if (!updated) return c.json({ error: "No encontramos ese código." }, 404);
    return c.json(updated);
  }
);

/* --------------------------- Reportes (público) ----------------------- */

// Consulta por código confidencial: el código es la llave del reportante.
api.get("/reports/:code", async (c) => {
  const report = await getReportByCode(c.env.DB, c.req.param("code"));
  if (!report) return c.json({ error: "No encontramos ese código." }, 404);
  return c.json(report);
});

api.post(
  "/reports",
  zValidator("json", newReportSchema, (r) => (r.success ? undefined : invalid())),
  async (c) => c.json(await createReport(c.env.DB, c.req.valid("json")))
);

/* ----------------------------- Formación ------------------------------ */

api.get("/progress/:learnerId", async (c) =>
  c.json(await getProgress(c.env.DB, c.req.param("learnerId")))
);

api.post(
  "/progress/:learnerId/complete",
  zValidator("json", completeSchema, (r) => (r.success ? undefined : invalid())),
  async (c) =>
    c.json(
      await completeModule(
        c.env.DB,
        c.req.param("learnerId"),
        c.req.valid("json").moduleId
      )
    )
);

api.post("/progress/:learnerId/reset", async (c) =>
  c.json(await resetProgress(c.env.DB, c.req.param("learnerId")))
);
