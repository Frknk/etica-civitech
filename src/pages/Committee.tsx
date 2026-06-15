import { useMemo, useState } from "react";
import { advanceReport, useReports } from "../lib/store";
import {
  CATEGORY_MAP,
  STATUS_FLOW,
  STATUS_META,
} from "../lib/constants";
import type { Report, ReportStatus } from "../lib/types";
import { IconEyeOff, IconGrid } from "../components/icons";

const FILTERS: { id: ReportStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "recibido", label: "Recibidos" },
  { id: "clasificado", label: "Clasificados" },
  { id: "derivado", label: "Derivados" },
  { id: "atendido", label: "Atendidos" },
];

export default function Committee() {
  const reports = useReports();
  const [filter, setFilter] = useState<ReportStatus | "todos">("todos");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filter === "todos"
        ? reports
        : reports.filter((r) => r.status === filter),
    [reports, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: reports.length };
    for (const s of STATUS_FLOW) c[s] = reports.filter((r) => r.status === s).length;
    return c;
  }, [reports]);

  const active = reports.find((r) => r.code === selected) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-50">
          <IconGrid className="text-pine-600" />
        </span>
        <div>
          <span className="eyebrow">Panel del comité de ética</span>
          <h1 className="mt-1 text-4xl">Clasificación y seguimiento</h1>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Espacio reservado al comité para clasificar, derivar y dejar constancia
        de la atención. El objetivo es responsabilidad y trazabilidad, no
        sanción. La identidad de quien reporta de forma anónima nunca se revela.
      </p>

      {/* Métricas */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Reportes" value={counts.todos} tone="ink" />
        <Stat label="Por clasificar" value={counts.recibido} tone="amber" />
        <Stat label="En proceso" value={counts.clasificado + counts.derivado} tone="pine" />
        <Stat label="Atendidos" value={counts.atendido} tone="pine" />
      </div>

      {/* Filtros */}
      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-pine-700 text-white"
                : "border border-line text-ink-soft hover:border-pine-200"
            }`}
          >
            {f.label}{" "}
            <span className="opacity-70">({counts[f.id] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <div className="card px-6 py-12 text-center text-ink-soft">
            No hay reportes en esta vista.
          </div>
        )}
        {filtered.map((r) => (
          <ReportRow
            key={r.code}
            report={r}
            onOpen={() => setSelected(r.code)}
          />
        ))}
      </div>

      {active && (
        <CaseDrawer report={active} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "pine" | "amber";
}) {
  const ring =
    tone === "amber"
      ? "text-clay"
      : tone === "pine"
        ? "text-pine-600"
        : "text-ink";
  return (
    <div className="card p-4">
      <p className={`font-display text-3xl font-semibold ${ring}`}>{value}</p>
      <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </p>
    </div>
  );
}

function ReportRow({
  report,
  onOpen,
}: {
  report: Report;
  onOpen: () => void;
}) {
  const cat = CATEGORY_MAP[report.category];
  return (
    <button
      onClick={onOpen}
      className="card flex w-full flex-col gap-3 p-5 text-left transition-transform hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-[0.1em] text-pine-700">
            {report.code}
          </span>
          <span className="rounded-full bg-pine-50 px-2.5 py-0.5 text-xs font-medium text-pine-700">
            {cat.label}
          </span>
          {report.anonymous && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
              <IconEyeOff width={12} height={12} /> Anónimo
            </span>
          )}
        </div>
        <p className="mt-1.5 font-display text-lg font-semibold">
          {report.title}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-soft">
          {new Date(report.createdAt).toLocaleDateString("es-PE")}
        </span>
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
          {STATUS_META[report.status].label}
        </span>
      </div>
    </button>
  );
}

function CaseDrawer({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const cat = CATEGORY_MAP[report.category];
  const currentIndex = STATUS_FLOW.indexOf(report.status);
  const nextStatus = STATUS_FLOW[currentIndex + 1];
  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);

  async function advance() {
    if (!nextStatus) return;
    setSaving(true);
    try {
      await advanceReport(report.code, nextStatus, message);
      setMessage("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-4 backdrop-blur">
          <span className="font-mono text-sm font-semibold tracking-[0.1em] text-pine-700">
            {report.code}
          </span>
          <button
            onClick={onClose}
            className="btn btn-ghost px-3 py-1.5"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-5 py-6">
          <div>
            <span className="rounded-full bg-pine-50 px-2.5 py-0.5 text-xs font-medium text-pine-700">
              {cat.label}
            </span>
            <h2 className="mt-3 text-2xl">{report.title}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              {report.description}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Estado" value={STATUS_META[report.status].label} />
            <Field
              label="Recibido"
              value={new Date(report.createdAt).toLocaleDateString("es-PE")}
            />
            <Field label="Contexto" value={report.context || "—"} />
            <Field
              label="Identificación"
              value={report.anonymous ? "Anónimo" : report.contactAlias || "—"}
            />
          </dl>

          {report.evidence.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
                Evidencia adjunta
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {report.evidence.map((e) => (
                  <li key={e.name} className="text-ink">
                    📎 {e.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bitácora */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
              Bitácora de atención
            </p>
            <ol className="mt-3 space-y-3">
              {report.notes.map((n, i) => (
                <li key={i} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-pine-700">
                      {STATUS_META[n.status].label}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-soft">
                      {new Date(n.at).toLocaleDateString("es-PE")} · {n.by}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{n.message}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Acción */}
          {nextStatus ? (
            <div className="card bg-surface p-4">
              <p className="font-semibold">
                Avanzar a: {STATUS_META[nextStatus].label}
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">
                {STATUS_META[nextStatus].help}
              </p>
              <textarea
                className="field mt-3 min-h-[80px] resize-y"
                placeholder="Nota visible para quien reporta (opcional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={advance}
                disabled={saving}
                className="btn btn-primary mt-3 w-full"
              >
                {saving ? "Registrando…" : "Registrar y avanzar"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-4 text-center text-sm font-medium text-pine-700">
              Caso atendido y cerrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
