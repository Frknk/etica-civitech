import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportByCode } from "../lib/store";
import { CATEGORY_MAP, STATUS_FLOW, STATUS_META } from "../lib/constants";
import type { Report } from "../lib/types";
import { IconSearch, IconEyeOff } from "../components/icons";

export default function Track() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [result, setResult] = useState<Report | null | undefined>(undefined);

  async function lookup(value: string) {
    if (!value.trim()) return;
    try {
      const found = await getReportByCode(value);
      setResult(found ?? null);
    } catch {
      setResult(null);
    }
  }

  useEffect(() => {
    const initial = params.get("code");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <span className="eyebrow">Seguimiento confidencial</span>
      <h1 className="mt-3 text-4xl">Sigue tu reporte</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Ingresa el código que recibiste al reportar. No pedimos tu nombre ni
        ningún dato personal: el código es la única llave.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
        className="mt-7 flex flex-col gap-3 sm:flex-row"
      >
        <input
          className="field font-mono uppercase tracking-[0.12em]"
          placeholder="CVT-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          aria-label="Código de seguimiento"
        />
        <button type="submit" className="btn btn-primary shrink-0">
          <IconSearch width={18} height={18} />
          Buscar
        </button>
      </form>

      {result === null && (
        <div className="mt-8 rounded-xl border border-line bg-surface px-5 py-6 text-center">
          <p className="font-semibold">No encontramos ese código</p>
          <p className="mt-1 text-sm text-ink-soft">
            Verifica que esté escrito tal cual lo recibiste, incluidos los
            guiones.
          </p>
        </div>
      )}

      {result && <Timeline report={result} />}
    </div>
  );
}

function Timeline({ report }: { report: Report }) {
  const currentIndex = STATUS_FLOW.indexOf(report.status);
  const cat = CATEGORY_MAP[report.category];

  return (
    <div className="rise mt-8">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-pine-50/60 px-6 py-5">
          <div>
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-pine-700">
              {report.code}
            </span>
            <h2 className="mt-1 text-xl">{report.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-pine-700 px-3 py-1 text-xs font-medium text-white">
              {STATUS_META[report.status].label}
            </span>
            {report.anonymous && (
              <span className="inline-flex items-center gap-1 rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                <IconEyeOff width={13} height={13} /> Anónimo
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_1.2fr]">
          {/* Meta */}
          <div className="space-y-4 text-sm">
            <Meta label="Categoría" value={cat.label} />
            <Meta
              label="Reportado"
              value={new Date(report.createdAt).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
            {report.context && <Meta label="Contexto" value={report.context} />}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
                Descripción
              </p>
              <p className="mt-1.5 leading-relaxed text-ink">
                {report.description}
              </p>
            </div>
          </div>

          {/* Progreso */}
          <div>
            <ol className="relative ml-3 border-l-2 border-line">
              {STATUS_FLOW.map((s, i) => {
                const done = i <= currentIndex;
                const note = [...report.notes]
                  .reverse()
                  .find((n) => n.status === s);
                return (
                  <li key={s} className="mb-5 pl-6">
                    <span
                      className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full ${
                        done ? "bg-pine-600" : "bg-line-strong"
                      }`}
                    >
                      {done && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <p
                      className={`font-semibold ${
                        done ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {STATUS_META[s].label}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {note ? note.message : STATUS_META[s].help}
                    </p>
                    {note && (
                      <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-line-strong">
                        {new Date(note.at).toLocaleDateString("es-PE")} ·{" "}
                        {note.by}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
