import {
  Archive,
  CircleAlert,
  Clock,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type { MetricCardData } from "../data/dashboardData";
import { MetricSparkline } from "./MetricSparkline";

interface MetricCardProps {
  /** Metric data to render. */
  metric: MetricCardData;
}

const iconByMetricLabel = {
  "Needs response": CircleAlert,
  Unclaimed: Inbox,
  "Median time to claim": Clock,
  "Median time to respond": Archive,
} satisfies Record<string, LucideIcon>;

/** Renders a single dashboard metric card. */
export function MetricCard({ metric }: MetricCardProps) {
  const Icon = iconByMetricLabel[metric.label] ?? CircleAlert;

  return (
    <article className={metric.trend ? "metric-card has-trend" : "metric-card"}>
      <div className="metric-top">
        <span className="metric-icon">
          <Icon aria-hidden="true" size={22} />
        </span>
        <div className="metric-copy">
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value">{metric.value}</div>
        </div>
      </div>
      <div className="metric-comparison">
        {metric.delta ? (
          <span className={`metric-delta metric-delta-${metric.tone ?? "neutral"}`}>
            {metric.delta}
          </span>
        ) : null}
        <span>{metric.detail}</span>
      </div>
      {metric.trend ? <MetricSparkline values={metric.trend} /> : null}
    </article>
  );
}
