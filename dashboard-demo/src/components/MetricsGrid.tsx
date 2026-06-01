import type { MetricCardData } from "../data/dashboardData";
import { MetricCard } from "./MetricCard";

interface MetricsGridProps {
  /** Computed metric cards. */
  metrics: MetricCardData[];
}

/** Renders the non-redundant top metric cards. */
export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <section className="metric-grid" aria-label="Dashboard metrics">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}
