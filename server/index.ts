import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import {
  advanceReport,
  completeModule,
  createReport,
  getProgress,
  getReportByCode,
  getReports,
  resetProgress,
  seedOnce,
} from "./db";
import { STATUS_FLOW } from "../src/lib/constants";

seedOnce();

const PORT = Number(process.env.PORT ?? 3001);

const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "Datos del reporte inválidos." };
    }
    set.status = 500;
    return { error: error instanceof Error ? error.message : "Error interno" };
  })

  /* --------------------------- Reportes --------------------------- */

  .get("/reports", () => getReports())

  .get("/reports/:code", ({ params, set }) => {
    const report = getReportByCode(params.code);
    if (!report) {
      set.status = 404;
      return { error: "No encontramos ese código." };
    }
    return report;
  })

  .post(
    "/reports",
    ({ body }) => createReport(body),
    {
      body: t.Object({
        category: t.Union([
          t.Literal("plagio"),
          t.Literal("conflicto"),
          t.Literal("mala-praxis"),
          t.Literal("uso-indebido"),
          t.Literal("deontologia"),
        ]),
        title: t.String({ minLength: 6 }),
        description: t.String({ minLength: 20 }),
        context: t.String(),
        anonymous: t.Boolean(),
        contactAlias: t.Optional(t.String()),
        evidence: t.Array(
          t.Object({ name: t.String(), size: t.Number() })
        ),
      }),
    }
  )

  .post(
    "/reports/:code/advance",
    ({ params, body, set }) => {
      const updated = advanceReport(params.code, body.status, body.message);
      if (!updated) {
        set.status = 404;
        return { error: "No encontramos ese código." };
      }
      return updated;
    },
    {
      body: t.Object({
        status: t.Union(STATUS_FLOW.map((s) => t.Literal(s))),
        message: t.String(),
      }),
    }
  )

  /* ------------------------- Formación ---------------------------- */

  .get("/progress/:learnerId", ({ params }) => getProgress(params.learnerId))

  .post(
    "/progress/:learnerId/complete",
    ({ params, body }) => completeModule(params.learnerId, body.moduleId),
    { body: t.Object({ moduleId: t.String() }) }
  )

  .post("/progress/:learnerId/reset", ({ params }) =>
    resetProgress(params.learnerId)
  )

  .listen(PORT);

console.log(
  `🌱 CivicTech API escuchando en http://localhost:${app.server?.port}/api`
);
