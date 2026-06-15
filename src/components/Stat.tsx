/** Tarjeta de métrica reutilizada por el panel del comité. */
export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
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
