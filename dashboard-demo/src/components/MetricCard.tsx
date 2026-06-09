import {
  Archive,
  CircleAlert,
  Clock,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type { MetricCardData } from "../data/dashboardData";
import { panelSurface } from "../styles/tailwindClasses";
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
    <article className={`${panelSurface} flex min-h-[210px] flex-col px-3.5 pb-3 pt-3.5`}>
      <div className="flex min-h-[72px] justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[#1f66dc]">
            <Icon aria-hidden="true" size={20} strokeWidth={2.15} />
          </span>
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-[5px] text-[0.9rem] font-[650] leading-tight text-[#172033]">
              {metric.label}
            </div>
            <div className="mb-0 text-[1.85rem] font-bold leading-none tracking-normal text-slate-950">
              {metric.value}
            </div>
            {metric.detail ? (
              <div className="mt-[9px] text-[0.78rem] leading-snug text-[#607086]">
                {metric.detail}
              </div>
            ) : null}
          </div>
        </div>
        {metric.delta ? (
          <span className={`inline-flex max-w-32 items-center gap-[5px] self-start whitespace-nowrap rounded-full bg-emerald-50 px-2 py-[3px] text-left text-xs font-[650] leading-tight ${getDeltaClass(metric.tone)}`}>
            <span className="size-0 border-x-[3.5px] border-b-[5px] border-x-transparent border-b-current" />
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

/** Returns the Tailwind color class for a metric delta tone. */
function getDeltaClass(tone: MetricCardData["tone"]): string {
  if (tone === "neutral") {
    return "text-slate-600";
  }

  return "text-emerald-700";
}
