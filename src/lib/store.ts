import { useEffect, useRef, useState } from "react";
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

/** Error de autorización del comité (clave ausente o inválida → HTTP 401). */
export class UnauthorizedError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401) throw new UnauthorizedError("Acceso restringido.");
  if (!res.ok && res.status !== 404) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ----------------------- Acceso del comité ----------------------- */
/* La clave del comité se guarda en sessionStorage (se borra al cerrar la
 * pestaña). Se envía como Bearer en las llamadas que exponen datos
 * confidenciales. El reportante no usa esto: su llave es el código. */

const COMMITTEE_KEY = "civictech.committee.key.v1";

export function committeeKey(): string | null {
  return sessionStorage.getItem(COMMITTEE_KEY);
}

function authHeaders(): Record<string, string> {
  const key = committeeKey();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

/** Verifica la clave contra el API; si es válida, la guarda para la sesión. */
export async function committeeLogin(key: string): Promise<boolean> {
  const res = await fetch(`${API}/committee/login`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });
  if (res.ok) {
    sessionStorage.setItem(COMMITTEE_KEY, key);
    emit();
    return true;
  }
  return false;
}

export function committeeLogout(): void {
  sessionStorage.removeItem(COMMITTEE_KEY);
  emit();
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
  return request<Report[]>("/reports", { headers: authHeaders() });
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

export async function createReport(
  input: NewReportInput,
  turnstileToken: string
): Promise<Report> {
  // El token de Turnstile (anti-bots) viaja en una cabecera; el Worker lo
  // valida contra Cloudflare antes de registrar el reporte.
  const report = await request<Report>("/reports", {
    method: "POST",
    headers: { "X-Turnstile-Token": turnstileToken },
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
    headers: authHeaders(),
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

/**
 * Carga los reportes del comité (requiere clave). Si el API responde 401
 * (clave ausente o revocada) invoca `onUnauthorized` para que el panel
 * vuelva a pedir acceso. Solo consulta cuando hay clave en la sesión.
 */
export function useReports(onUnauthorized?: () => void): Report[] {
  const [reports, setReports] = useState<Report[]>([]);
  const onUnauth = useRef(onUnauthorized);
  onUnauth.current = onUnauthorized;
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (!committeeKey()) return;
      getReports()
        .then((r) => alive && setReports(r))
        .catch((e) => {
          if (e instanceof UnauthorizedError) onUnauth.current?.();
        });
    };
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
