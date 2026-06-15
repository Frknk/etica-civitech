import { useState } from "react";
import {
  BADGES,
  ETHICS_MESSAGES,
  LEARN_MODULES,
  LEVELS,
  levelFor,
} from "../lib/constants";
import type { LearnModule } from "../lib/constants";
import { completeModule, resetProgress, useProgress } from "../lib/store";
import { IconBell, IconCheck, IconSprout } from "../components/icons";

export default function Learn() {
  const progress = useProgress();
  const { current, next } = levelFor(progress.points);
  const ceiling = next ? next.min : LEVELS[LEVELS.length - 1].min + 30;
  const pct = Math.min(100, Math.round((progress.points / ceiling) * 100));
  const tip =
    ETHICS_MESSAGES[progress.completed.length % ETHICS_MESSAGES.length];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <span className="eyebrow">Cultiva la integridad</span>
      <h1 className="mt-3 text-4xl">Formación ética</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Aquí los puntos se ganan aprendiendo y actuando con integridad —nunca
        por el número de reportes—. Así reconocemos la formación, no la
        denuncia.
      </p>

      {/* ----------------------- Panel de progreso ----------------------- */}
      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between bg-pine-700 px-6 py-5 text-pine-50">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-pine-600">
                <IconSprout width={26} height={26} className="text-amber" />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-pine-200">
                  Nivel actual
                </p>
                <p className="font-display text-2xl font-semibold text-white">
                  {current.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-semibold text-white">
                {progress.points}
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-pine-200">
                puntos
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grow-track">
              <div className="grow-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {next
                ? `Te faltan ${next.min - progress.points} puntos para alcanzar “${next.name}”.`
                : "Alcanzaste el nivel más alto: Árbol. ¡Gracias por cultivar la integridad!"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <span
                  key={l.name}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    progress.points >= l.min
                      ? "bg-pine-50 text-pine-700"
                      : "border border-line text-ink-soft"
                  }`}
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mensaje de conciencia ética (notificación) */}
        <div className="card flex flex-col justify-between bg-amber-soft p-6">
          <div>
            <IconBell width={22} height={22} className="text-clay" />
            <p className="mt-3 font-display text-lg leading-snug text-ink">
              {tip}
            </p>
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-clay">
            Conciencia ética
          </p>
        </div>
      </div>

      {/* --------------------------- Insignias --------------------------- */}
      <h2 className="mt-12 text-2xl">Insignias</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Se obtienen por formación e integridad sostenida.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BADGES.map((b) => {
          const earned = progress.badges.includes(b.id);
          return (
            <div
              key={b.id}
              className={`card p-4 ${earned ? "border-pine-200 bg-pine-50/50" : "opacity-70"}`}
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-full ${
                  earned ? "bg-pine-600 text-white" : "bg-line text-ink-soft"
                }`}
              >
                {earned ? <IconCheck width={20} height={20} /> : "•"}
              </div>
              <p className="mt-3 font-semibold">{b.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {b.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ------------------------ Módulos formativos ---------------------- */}
      <h2 className="mt-12 text-2xl">Ruta formativa</h2>
      <div className="mt-4 space-y-4">
        {LEARN_MODULES.map((m) => (
          <ModuleItem
            key={m.id}
            module={m}
            done={progress.completed.includes(m.id)}
          />
        ))}
      </div>

      {progress.points > 0 && (
        <button
          onClick={resetProgress}
          className="mt-8 text-sm text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-clay"
        >
          Reiniciar mi progreso (demostración)
        </button>
      )}
    </div>
  );
}

function ModuleItem({ module: m, done }: { module: LearnModule; done: boolean }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "retry" | null>(null);

  function check() {
    if (choice === null) return;
    if (choice === m.answer) {
      setFeedback("ok");
      completeModule(m.id);
    } else {
      setFeedback("retry");
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              done ? "bg-pine-600 text-white" : "bg-pine-50 text-pine-700"
            }`}
          >
            {done ? <IconCheck width={20} height={20} /> : <IconSprout width={20} height={20} />}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{m.title}</p>
            <p className="text-sm text-ink-soft">
              {m.minutes} min · {m.points} puntos
            </p>
          </div>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
          {done ? "Completado" : open ? "Cerrar" : "Abrir"}
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-5">
          <p className="leading-relaxed text-ink">{m.summary}</p>

          <div className="mt-5 rounded-xl bg-paper p-4">
            <p className="font-semibold">{m.question}</p>
            <div className="mt-3 space-y-2">
              {m.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    choice === i
                      ? "border-pine-600 bg-pine-50"
                      : "border-line bg-surface hover:border-pine-200"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${m.id}`}
                    checked={choice === i}
                    onChange={() => {
                      setChoice(i);
                      setFeedback(null);
                    }}
                    className="accent-pine-600"
                    disabled={done}
                  />
                  {opt}
                </label>
              ))}
            </div>

            {feedback === "ok" || done ? (
              <p className="mt-4 flex items-center gap-2 font-medium text-pine-700">
                <IconCheck width={18} height={18} />
                {done && feedback !== "ok"
                  ? "Módulo completado."
                  : `¡Correcto! Sumaste ${m.points} puntos.`}
              </p>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <button onClick={check} className="btn btn-primary py-2.5">
                  Comprobar
                </button>
                {feedback === "retry" && (
                  <span className="text-sm text-clay">
                    Revisa de nuevo: piensa en el reporte responsable.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
