import type { MetricCardData } from "../data/dashboardData";
import { MetricCard } from "./MetricCard";

interface MetricsGridProps {
  /** Computed metric cards. */
  metrics: MetricCardData[];
}

/** Renders the non-redundant top metric cards. */
export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <section
      className="mb-4 grid grid-cols-4 gap-3 max-[1180px]:grid-cols-2 max-[720px]:grid-cols-1"
      aria-label="Dashboard metrics"
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}
