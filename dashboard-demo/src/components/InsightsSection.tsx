import type {
  CategoryDatum,
  CategoryDetail,
  CountyDatum,
} from "../data/dashboardData";
import { CategoryMixChart } from "./CategoryMixChart";
import { CountyPanel } from "./CountyPanel";
import { TimeToClaimChart } from "./TimeToClaimChart";
import { VolumeChart } from "./VolumeChart";

interface InsightsSectionProps {
  /** Category drilldown data. */
  categoryDetails: CategoryDetail[];
  /** Category mix data. */
  categoryMix: CategoryDatum[];
  /** Monthly median claim time. */
  claimTimeByMonth: { label: string; value: number }[];
  /** County workload data. */
  countyLoad: CountyDatum[];
  /** Handles county map selection changes. */
  onCountySelectionChange: (countyKey: string) => void;
  /** Selected county filter keys used for map emphasis. */
  selectedCountyKeys: string[];
  /** Whether to show map panel. */
  showMap: boolean;
  /** Whether to show trend panels. */
  showTrends: boolean;
  /** Weekly submission data. */
  submissionsByWeek: [number, number][];
}

/** Renders trend context supporting the operational queue. */
export function InsightsSection({
  categoryDetails,
  categoryMix,
  claimTimeByMonth,
  countyLoad,
  onCountySelectionChange,
  selectedCountyKeys,
  showMap,
  showTrends,
  submissionsByWeek,
}: InsightsSectionProps) {
  return (
    <section
      className="mb-3.5 grid grid-cols-[1.4fr_1fr_1fr_0.9fr] gap-3 max-[1180px]:grid-cols-2 max-[720px]:grid-cols-1"
      aria-label="Trends and geography"
    >
      {showTrends ? <VolumeChart data={submissionsByWeek} /> : null}
      {showTrends ? <TimeToClaimChart data={claimTimeByMonth} /> : null}
      {showMap ? (
        <CountyPanel
          countyLoad={countyLoad}
          onCountySelectionChange={onCountySelectionChange}
          selectedCountyKeys={selectedCountyKeys}
        />
      ) : null}
      {showTrends ? (
        <CategoryMixChart
          categoryDetails={categoryDetails}
          categoryMix={categoryMix}
        />
      ) : null}
    </section>
  );
}
