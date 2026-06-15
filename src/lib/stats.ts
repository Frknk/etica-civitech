import {
  CATEGORIES,
  STATUS_FLOW,
  STATUS_META,
} from "./constants";
import type { Report, ReportStatus } from "./types";

/* ============================================================
   Agregaciones para el panel de estadísticas del comité.
   Funciones puras: reciben Report[] y devuelven datasets
   listos para Recharts. Todo se calcula en el cliente a partir
   de lo que ya entrega useReports() — sin endpoints nuevos.
   ============================================================ */

export interface Slice {
  id: string;
  label: string;
  value: number;
}

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

/** Reportes por categoría, en el orden de CATEGORIES. */
export function byCategory(reports: Report[]): Slice[] {
  return CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    value: reports.filter((r) => r.category === c.id).length,
  }));
}

/** Reportes por estado actual, en el orden del flujo. */
export function byStatus(reports: Report[]): Slice[] {
  return STATUS_FLOW.map((s) => ({
    id: s,
    label: STATUS_META[s].label,
    value: reports.filter((r) => r.status === s).length,
  }));
}

/** Anónimos vs identificados. */
export function byAnonymity(reports: Report[]): Slice[] {
  const anon = reports.filter((r) => r.anonymous).length;
  return [
    { id: "anonimo", label: "Anónimos", value: anon },
    { id: "identificado", label: "Identificados", value: reports.length - anon },
  ];
}

/** Reportes con evidencia adjunta vs sin ella. */
export function byEvidence(reports: Report[]): Slice[] {
  const withEv = reports.filter((r) => r.evidence.length > 0).length;
  return [
    { id: "con", label: "Con evidencia", value: withEv },
    { id: "sin", label: "Sin evidencia", value: reports.length - withEv },
  ];
}

/** Casos pendientes (no atendidos) agrupados por estado actual. */
export function pendingByStatus(reports: Report[]): Slice[] {
  return STATUS_FLOW.filter((s) => s !== "atendido").map((s) => ({
    id: s,
    label: STATUS_META[s].label,
    value: reports.filter((r) => r.status === s).length,
  }));
}

/** Tendencia: reportes creados por día (ordenado cronológicamente). */
export function trendByDay(reports: Report[]): { day: string; value: number }[] {
  const counts = new Map<string, { ts: number; value: number }>();
  for (const r of reports) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const bucketTs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const cur = counts.get(key);
    if (cur) cur.value += 1;
    else counts.set(key, { ts: bucketTs, value: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((b) => ({
      day: new Date(b.ts).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      }),
      value: b.value,
    }));
}

/** Tiempo promedio (en horas) que los casos permanecen en cada estado
 *  antes de avanzar. Se deriva de las transiciones registradas en notes. */
export function avgTimeInStatus(reports: Report[]): Slice[] {
  // Acumula duración y conteo por estado de origen.
  const totals: Record<string, { sum: number; n: number }> = {};
  for (const s of STATUS_FLOW) totals[s] = { sum: 0, n: 0 };

  for (const r of reports) {
    // Línea temporal: creación + notas ordenadas por fecha.
    const notes = [...r.notes].sort((a, b) => a.at - b.at);
    let prevAt = r.createdAt;
    let prevStatus: ReportStatus = "recibido";
    for (const note of notes) {
      if (note.status !== prevStatus) {
        totals[prevStatus].sum += note.at - prevAt;
        totals[prevStatus].n += 1;
        prevAt = note.at;
        prevStatus = note.status;
      }
    }
  }

  return STATUS_FLOW.map((s) => ({
    id: s,
    label: STATUS_META[s].label,
    value: totals[s].n > 0 ? Math.round((totals[s].sum / totals[s].n / HOUR) * 10) / 10 : 0,
  }));
}

export interface Headline {
  total: number;
  attended: number;
  closureRate: number; // 0..100
  pending: number;
  avgResolutionDays: number | null;
  avgCommitteeNotes: number;
}

/** Métricas numéricas destacadas. */
export function headline(reports: Report[]): Headline {
  const total = reports.length;
  const attended = reports.filter((r) => r.status === "atendido").length;

  // Tiempo de resolución: de creación a la nota que marca "atendido".
  const resolutionTimes: number[] = [];
  for (const r of reports) {
    const closed = r.notes
      .filter((n) => n.status === "atendido")
      .sort((a, b) => a.at - b.at)[0];
    if (closed) resolutionTimes.push(closed.at - r.createdAt);
  }
  const avgResolutionDays =
    resolutionTimes.length > 0
      ? Math.round(
          (resolutionTimes.reduce((a, b) => a + b, 0) /
            resolutionTimes.length /
            DAY) *
            10
        ) / 10
      : null;

  const committeeNotes = reports.map(
    (r) => r.notes.filter((n) => n.by === "comité").length
  );
  const avgCommitteeNotes =
    total > 0
      ? Math.round(
          (committeeNotes.reduce((a, b) => a + b, 0) / total) * 10
        ) / 10
      : 0;

  return {
    total,
    attended,
    closureRate: total > 0 ? Math.round((attended / total) * 100) : 0,
    pending: total - attended,
    avgResolutionDays,
    avgCommitteeNotes,
  };
}
