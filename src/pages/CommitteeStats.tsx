import { useMemo } from "react";
import type { Report } from "../lib/types";
import { Stat } from "../components/Stat";
import {
  avgTimeInStatus,
  byAnonymity,
  byCategory,
  byEvidence,
  headline,
  pendingByStatus,
  trendByDay,
} from "../lib/stats";
import {
  BarChartCard,
  DonutChartCard,
  TrendChartCard,
} from "../components/charts";

/* Vista de estadísticas del comité. Se carga de forma diferida (lazy) para
 * que recharts solo se descargue al abrir esta pestaña. */
export default function StatsView({ reports }: { reports: Report[] }) {
  const stats = useMemo(
    () => ({
      head: headline(reports),
      category: byCategory(reports),
      trend: trendByDay(reports),
      anonymity: byAnonymity(reports),
      evidence: byEvidence(reports),
      pending: pendingByStatus(reports),
      timeInStatus: avgTimeInStatus(reports),
    }),
    [reports]
  );

  if (reports.length === 0) {
    return (
      <div className="card mt-8 px-6 py-16 text-center text-ink-soft">
        Aún no hay reportes para analizar. Las estadísticas aparecerán a medida
        que se reciban casos.
      </div>
    );
  }

  const { head } = stats;

  return (
    <div className="mt-8 space-y-4">
      {/* Métricas destacadas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total reportes" value={head.total} tone="ink" />
        <Stat label="Tasa de cierre" value={`${head.closureRate}%`} tone="pine" />
        <Stat label="Pendientes" value={head.pending} tone="amber" />
        <Stat
          label="Días prom. de resolución"
          value={head.avgResolutionDays ?? "—"}
          tone="pine"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Reportes por categoría"
          hint="Tipos de incidente más frecuentes."
          data={stats.category}
        />
        <TrendChartCard
          title="Reportes en el tiempo"
          hint="Casos recibidos por día."
          data={stats.trend}
        />
        <DonutChartCard
          title="Anonimato"
          hint="Cuántas personas reportan sin identificarse."
          data={stats.anonymity}
        />
        <DonutChartCard
          title="Evidencia adjunta"
          hint="Reportes que incluyen archivos de respaldo."
          data={stats.evidence}
        />
        <BarChartCard
          title="Casos pendientes por estado"
          hint="Dónde está la carga de trabajo abierta."
          data={stats.pending}
          color="#e0a33e"
        />
        <BarChartCard
          title="Tiempo promedio por estado"
          hint="Horas que un caso permanece en cada etapa antes de avanzar."
          data={stats.timeInStatus}
          color="#b5532f"
          unit="h"
        />
      </div>

      <p className="text-center text-xs text-ink-soft">
        En promedio el comité deja {head.avgCommitteeNotes} nota(s) por caso.
      </p>
    </div>
  );
}
