import type { CategoryDatum, CountyDatum } from "../data/dashboardData";
import { CategoryMixChart } from "./CategoryMixChart";
import { CountyPanel } from "./CountyPanel";
import { TimeToClaimChart } from "./TimeToClaimChart";
import { VolumeChart } from "./VolumeChart";

interface InsightsSectionProps {
  /** Category mix data. */
  categoryMix: CategoryDatum[];
  /** Monthly median claim time. */
  claimTimeByMonth: { label: string; value: number }[];
  /** County workload data. */
  countyLoad: CountyDatum[];
  /** Whether to show map panel. */
  showMap: boolean;
  /** Whether to show trend panels. */
  showTrends: boolean;
  /** Weekly submission data. */
  submissionsByWeek: [number, number][];
}

/** Renders trend context supporting the operational queue. */
export function InsightsSection({
  categoryMix,
  claimTimeByMonth,
  countyLoad,
  showMap,
  showTrends,
  submissionsByWeek,
}: InsightsSectionProps) {
  return (
    <section className="insights-grid" aria-label="Trends and geography">
      {showTrends ? <VolumeChart data={submissionsByWeek} /> : null}
      {showTrends ? <TimeToClaimChart data={claimTimeByMonth} /> : null}
      {showMap ? <CountyPanel countyLoad={countyLoad} /> : null}
      {showTrends ? <CategoryMixChart categoryMix={categoryMix} /> : null}
    </section>
  );
}
