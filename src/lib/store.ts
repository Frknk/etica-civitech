import { useEffect, useState } from "react";
import type {
  CategoryId,
  LearnProgress,
  Report,
  ReportEvidence,
  ReportStatus,
} from "./types";

/* ============================================================
   Capa de datos del cliente CivicTech.
   Consume la API REST (Elysia + bun:sqlite). Sustituye la
   persistencia local del prototipo por una base de datos real
   y compartida. Esquema en docs/ESQUEMA_BD.md.
   ============================================================ */

const API = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok && res.status !== 404) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ----- Notificación de cambios para refrescar los hooks ----- */

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/* --------------------------- Reportes --------------------------- */

export function getReports(): Promise<Report[]> {
  return request<Report[]>("/reports");
}

export async function getReportByCode(
  code: string
): Promise<Report | undefined> {
  const norm = encodeURIComponent(code.trim().toUpperCase());
  const res = await fetch(`${API}/reports/${norm}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return (await res.json()) as Report;
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

export async function createReport(input: NewReportInput): Promise<Report> {
  const report = await request<Report>("/reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
  emit();
  return report;
}

export async function advanceReport(
  code: string,
  status: ReportStatus,
  message: string
): Promise<void> {
  await request<Report>(`/reports/${encodeURIComponent(code)}/advance`, {
    method: "POST",
    body: JSON.stringify({ status, message }),
  });
  emit();
}

/* ------------------------- Formación ---------------------------- */

const LEARNER_KEY = "civictech.learner.v1";

/** Identificador local del aprendiz. No es una identidad real: solo separa el
 *  progreso formativo de cada persona/dispositivo (no hay inicio de sesión). */
function learnerId(): string {
  let id = localStorage.getItem(LEARNER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LEARNER_KEY, id);
  }
  return id;
}

const EMPTY_PROGRESS: LearnProgress = { completed: [], points: 0, badges: [] };

export function getProgress(): Promise<LearnProgress> {
  return request<LearnProgress>(`/progress/${learnerId()}`);
}

export async function completeModule(moduleId: string): Promise<void> {
  await request<LearnProgress>(`/progress/${learnerId()}/complete`, {
    method: "POST",
    body: JSON.stringify({ moduleId }),
  });
  emit();
}

export async function resetProgress(): Promise<void> {
  await request<LearnProgress>(`/progress/${learnerId()}/reset`, {
    method: "POST",
  });
  emit();
}

/* ------------------------- React hooks -------------------------- */
/* Cargan de la API y se vuelven a cargar cuando una mutación emite cambios. */

export function useReports(): Report[] {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getReports()
        .then((r) => alive && setReports(r))
        .catch(() => {});
    load();
    return subscribe(load);
  }, []);
  return reports;
}

export function useProgress(): LearnProgress {
  const [progress, setProgress] = useState<LearnProgress>(EMPTY_PROGRESS);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getProgress()
        .then((p) => alive && setProgress(p))
        .catch(() => {});
    load();
    return subscribe(load);
  }, []);
  return progress;
}
