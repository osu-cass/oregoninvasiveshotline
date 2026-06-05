import {
  Archive,
  CircleAlert,
  Clock,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type { MetricCardData } from "../data/dashboardData";
import { MetricTrendChart } from "./MetricTrendChart";

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
      <div className="metric-card-header">
        <div className="metric-top">
          <span className="metric-icon">
            <Icon aria-hidden="true" size={20} strokeWidth={2.15} />
          </span>
          <div className="metric-copy">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            {metric.detail ? <div className="metric-detail">{metric.detail}</div> : null}
          </div>
        </div>
        {metric.delta ? (
          <span className={`metric-delta metric-delta-${metric.tone ?? "neutral"}`}>
            {metric.delta}
          </span>
        ) : null}
      </div>
      {metric.trend ? (
        <MetricTrendChart unit={metric.trendUnit} values={metric.trend} />
      ) : null}
    </article>
  );
}
