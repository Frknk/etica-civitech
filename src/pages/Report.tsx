import { useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../lib/constants";
import { createReport } from "../lib/store";
import type { CategoryId, Report, ReportEvidence } from "../lib/types";
import {
  IconArrow,
  IconCheck,
  IconCopy,
  IconEyeOff,
  IconLock,
} from "../components/icons";

export default function ReportPage() {
  const [category, setCategory] = useState<CategoryId | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [contactAlias, setContactAlias] = useState("");
  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Report | null>(null);

  function onFiles(list: FileList | null) {
    if (!list) return;
    setEvidence(
      Array.from(list).map((f) => ({ name: f.name, size: f.size }))
    );
  }

  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return setError("Elige una categoría para el incidente.");
    if (title.trim().length < 6)
      return setError("Escribe un título de al menos 6 caracteres.");
    if (description.trim().length < 20)
      return setError("Describe el incidente con al menos 20 caracteres.");
    setError("");
    setSending(true);
    try {
      const report = await createReport({
        category,
        title,
        description,
        context,
        anonymous,
        contactAlias: anonymous ? undefined : contactAlias,
        evidence,
      });
      setCreated(report);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No se pudo enviar el reporte. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (created) return <Success report={created} />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <span className="eyebrow">Reporte responsable</span>
      <h1 className="mt-3 text-4xl">Reportar un incidente ético</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Describe el hecho con claridad. No es necesario acusar a una persona:
        reportar busca corregir y prevenir, no castigar. Toda la información se
        trata con confidencialidad.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-sm text-pine-700">
        <IconLock width={18} height={18} className="mt-0.5 shrink-0" />
        <p>
          Este es un prototipo de validación. Los reportes se registran de forma
          confidencial; nunca se asocian a tu identidad si eliges el anonimato.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-7" noValidate>
        {/* Categoría */}
        <fieldset>
          <legend className="field-label">Categoría del incidente</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  aria-pressed={active}
                  className={`card flex flex-col items-start gap-0.5 p-3.5 text-left transition-all ${
                    active
                      ? "border-pine-600 bg-pine-50 ring-1 ring-pine-600"
                      : "hover:border-pine-200"
                  }`}
                >
                  <span className="font-semibold text-ink">{c.label}</span>
                  <span className="text-xs text-ink-soft">{c.short}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="title" className="field-label">
            Título breve
          </label>
          <input
            id="title"
            className="field"
            placeholder="Resume el incidente en una frase"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>

        <div>
          <label htmlFor="desc" className="field-label">
            ¿Qué ocurrió?
          </label>
          <textarea
            id="desc"
            className="field min-h-[140px] resize-y"
            placeholder="Describe el hecho: qué pasó, cuándo y por qué consideras que afecta la ética profesional. Evita datos personales innecesarios."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="context" className="field-label">
            Contexto <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <input
            id="context"
            className="field"
            placeholder="Ámbito donde ocurrió: curso, área, proceso…"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {/* Evidencia */}
        <div>
          <label htmlFor="evidence" className="field-label">
            Evidencia documental{" "}
            <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <input
            id="evidence"
            type="file"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="field cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-pine-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
          {evidence.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {evidence.map((f) => (
                <li key={f.name} className="flex items-center gap-2">
                  <IconCheck width={15} height={15} className="text-pine-600" />
                  {f.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Anonimato */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <IconEyeOff
                width={20}
                height={20}
                className="mt-0.5 text-pine-600"
              />
              <div>
                <p className="font-semibold">Reportar de forma anónima</p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  No guardamos ningún dato de identidad. Seguirás el caso solo
                  con tu código.
                </p>
              </div>
            </div>
            <Toggle checked={anonymous} onChange={setAnonymous} label="Anónimo" />
          </div>

          {!anonymous && (
            <div className="mt-4 border-t border-line pt-4">
              <label htmlFor="alias" className="field-label">
                ¿Cómo te identificas? (alias o rol, no datos sensibles)
              </label>
              <input
                id="alias"
                className="field"
                placeholder="Ej.: Estudiante de 6.º ciclo"
                value={contactAlias}
                onChange={(e) => setContactAlias(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm font-medium text-clay"
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Enviando…" : "Enviar reporte"}
            <IconArrow width={18} height={18} />
          </button>
          <Link to="/" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-pine-600" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function Success({ report }: { report: Report }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(report.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="rise card overflow-hidden text-center">
        <div className="bg-pine-700 px-6 py-8 text-pine-50">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pine-600">
            <IconCheck width={30} height={30} className="text-white" />
          </div>
          <h1 className="mt-4 text-3xl text-white">Reporte recibido</h1>
          <p className="mt-2 text-sm text-pine-200">
            Gracias por contribuir a una comunidad más íntegra.
          </p>
        </div>
        <div className="px-6 py-8">
          <p className="text-sm text-ink-soft">
            Guarda tu código de seguimiento confidencial:
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="code-chip text-xl">{report.code}</span>
            <button
              onClick={copy}
              className="btn btn-ghost px-3 py-2.5"
              aria-label="Copiar código"
            >
              {copied ? (
                <IconCheck width={18} height={18} className="text-pine-600" />
              ) : (
                <IconCopy width={18} height={18} />
              )}
            </button>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
            Es la única llave para seguir tu reporte. Si lo pierdes y reportaste
            de forma anónima, no podremos recuperarlo —así protegemos tu
            identidad.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={`/seguimiento?code=${report.code}`} className="btn btn-primary">
              Ver estado del reporte
            </Link>
            <Link to="/formacion" className="btn btn-ghost">
              Explorar la formación ética
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
