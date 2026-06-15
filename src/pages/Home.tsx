import { Link } from "react-router-dom";
import {
  IconArrow,
  IconBell,
  IconBook,
  IconEyeOff,
  IconFlag,
  IconLock,
  IconSearch,
  IconShield,
  IconSprout,
} from "../components/icons";
import { CATEGORIES, ETHICS_MESSAGES, STATUS_FLOW, STATUS_META } from "../lib/constants";

export default function Home() {
  return (
    <div>
      {/* ---------------------------- HERO ---------------------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            background:
              "radial-gradient(60% 50% at 85% 0%, #d6e6dc 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, #f6e6c6 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-8 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pt-20">
          <div className="rise">
            <span className="eyebrow">UNAS · Tingo María — Perú</span>
            <h1 className="mt-4 text-[2.6rem] leading-[1.02] md:text-[3.6rem]">
              La ética no se impone.
              <br />
              <span className="text-pine-600">Se cultiva.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              CivicTech es un canal seguro para reportar incidentes éticos —
              plagio, conflictos de interés, mala praxis o uso indebido de
              información— de forma confidencial, seguir su atención y reconocer
              las buenas prácticas. Sin denuncia anónima dañina, sin enfoque
              punitivo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/reportar" className="btn btn-primary">
                <IconFlag width={18} height={18} />
                Reportar un incidente
              </Link>
              <Link to="/seguimiento" className="btn btn-ghost">
                <IconSearch width={18} height={18} />
                Seguir mi reporte
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-ink-soft">
              <IconLock width={16} height={16} className="text-pine-600" />
              Puedes reportar de forma anónima. Nunca pedimos datos que no
              quieras dar.
            </div>
          </div>

          {/* Signature: confidential receipt preview */}
          <div className="rise" style={{ animationDelay: "0.08s" }}>
            <ReceiptPreview />
          </div>
        </div>
      </section>

      {/* ----------------------- TRUST PRINCIPLES --------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <Principle
            icon={<IconEyeOff className="text-pine-600" />}
            title="Confidencial por diseño"
            body="Decides si reportar con anonimato total. Tu identidad no es necesaria para que el caso avance."
          />
          <Principle
            icon={<IconShield className="text-pine-600" />}
            title="Trazable y visible"
            body="Cada reporte recibe un código. Con él sigues su clasificación y atención en cualquier momento."
          />
          <Principle
            icon={<IconSprout className="text-pine-600" />}
            title="Formativo, no punitivo"
            body="Reconocemos la formación y la integridad —no el número de denuncias— para fortalecer la cultura ética."
          />
        </div>
      </section>

      {/* --------------------------- MÓDULOS -------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">El sistema</span>
            <h2 className="mt-2 text-3xl md:text-4xl">Cinco módulos, una cultura</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            CivicTech ordena el reporte ético en piezas claras, pensadas para
            generar confianza desde la primera interacción.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ModuleCard
            n="01"
            icon={<IconFlag className="text-pine-600" />}
            title="Reporte de incidentes"
            body="Categoría, descripción y evidencia documental opcional, con un flujo guiado y claro."
          />
          <ModuleCard
            n="02"
            icon={<IconEyeOff className="text-pine-600" />}
            title="Confidencialidad y anonimato"
            body="El reportante elige no identificarse. El sistema protege su identidad y los datos del caso."
          />
          <ModuleCard
            n="03"
            icon={<IconSearch className="text-pine-600" />}
            title="Clasificación y seguimiento"
            body="El comité de ética clasifica, deriva y deja constancia visible de la atención de cada reporte."
          />
          <ModuleCard
            n="04"
            icon={<IconSprout className="text-pine-600" />}
            title="Reconocimiento de buenas prácticas"
            body="Puntos y niveles que se ganan completando formación y actuando con integridad."
          />
          <ModuleCard
            n="05"
            icon={<IconBell className="text-pine-600" />}
            title="Notificaciones con conciencia ética"
            body="Mensajes formativos que acompañan el uso del sistema y refuerzan la cultura de integridad."
          />
          <Link
            to="/reportar"
            className="card group flex flex-col justify-between bg-pine-700 p-5 text-pine-50 no-underline transition-transform hover:-translate-y-0.5"
          >
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-pine-200">
              Empieza aquí
            </span>
            <span className="mt-10 inline-flex items-center gap-2 font-display text-xl font-semibold">
              Crear un reporte
              <IconArrow
                width={20}
                height={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        </div>
      </section>

      {/* ------------------------ CÓMO FUNCIONA ----------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <span className="eyebrow">El recorrido de un reporte</span>
        <h2 className="mt-2 text-3xl md:text-4xl">De recibido a atendido</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {STATUS_FLOW.map((s, i) => (
            <li key={s} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-pine-50 font-mono text-sm font-semibold text-pine-700">
                  {i + 1}
                </span>
                <h3 className="text-lg">{STATUS_META[s].label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {STATUS_META[s].help}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------- CATEGORÍAS ------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-pine-50/60 px-6 py-5">
            <span className="eyebrow">Qué se puede reportar</span>
            <h2 className="mt-1.5 text-2xl">Categorías de incidentes éticos</h2>
          </div>
          <ul className="divide-y divide-line">
            {CATEGORIES.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-1 px-6 py-4 md:flex-row md:items-center md:gap-6"
              >
                <span className="font-display text-lg font-semibold md:w-64">
                  {c.label}
                </span>
                <span className="text-sm leading-relaxed text-ink-soft">
                  {c.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------- MENSAJE ÉTICO / CTA ---------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="card overflow-hidden bg-ink text-paper">
          <div className="grid gap-8 p-8 md:grid-cols-[1.3fr_0.7fr] md:p-12">
            <div>
              <IconBook className="text-amber" width={28} height={28} />
              <p className="mt-4 font-display text-2xl leading-snug md:text-3xl">
                “{ETHICS_MESSAGES[0]}”
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-pine-200">
                Aprende sobre integridad, reporte responsable y manejo ético de
                la información. Cada módulo suma puntos y te hace crecer de
                semilla a árbol.
              </p>
              <Link to="/formacion" className="btn btn-primary mt-6 bg-amber text-ink hover:bg-amber">
                Empezar la ruta formativa
                <IconArrow width={18} height={18} />
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <GrowthBadge />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReceiptPreview() {
  return (
    <div className="card relative overflow-hidden p-0 shadow-[0_30px_60px_-40px_rgba(16,46,34,0.55)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="eyebrow">Comprobante confidencial</span>
        <IconLock width={16} height={16} className="text-pine-600" />
      </div>
      <div className="px-5 py-6">
        <p className="text-sm text-ink-soft">Tu código de seguimiento</p>
        <div className="mt-2">
          <span className="code-chip text-lg">CVT-7K2M-9XQP</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Guárdalo. Es la única llave para seguir tu reporte sin revelar quién
          eres.
        </p>

        <div className="mt-6 space-y-3">
          {[
            ["Recibido", true],
            ["Clasificado", true],
            ["Derivado", false],
            ["Atendido", false],
          ].map(([label, done]) => (
            <div key={label as string} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                  done
                    ? "bg-pine-600 text-white"
                    : "border border-line-strong text-ink-soft"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span
                className={`text-sm ${
                  done ? "font-medium text-ink" : "text-ink-soft"
                }`}
              >
                {label as string}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-dashed border-line-strong bg-paper px-5 py-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-soft">
        CivicTech · UNAS · 2026
      </div>
    </div>
  );
}

function GrowthBadge() {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-pine-700">
        <IconSprout width={52} height={52} className="text-amber" />
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-pine-200">
        Semilla → Brote → Planta → Árbol
      </p>
    </div>
  );
}

function Principle({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-pine-50">
        {icon}
      </div>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

function ModuleCard({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-50">
          {icon}
        </span>
        <span className="font-mono text-xs text-line-strong">{n}</span>
      </div>
      <h3 className="mt-4 text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
