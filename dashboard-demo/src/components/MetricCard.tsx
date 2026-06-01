import { Badge } from "@cloudflare/kumo/components/badge";
import type { MetricCardData } from "../data/dashboardData";

interface MetricCardProps {
  /** Metric data to render. */
  metric: MetricCardData;
}

/** Renders a single dashboard metric card. */
export function MetricCard({ metric }: MetricCardProps) {
  const variant =
    metric.tone === "good"
      ? "success"
      : metric.tone === "warning"
        ? "warning"
        : "secondary";

  return (
    <article className="metric-card">
      <div className="metric-label">{metric.label}</div>
      <div className="metric-value">{metric.value}</div>
      <div className="metric-detail">{metric.detail}</div>
      {metric.delta ? <Badge variant={variant}>{metric.delta}</Badge> : null}
    </article>
  );
}
