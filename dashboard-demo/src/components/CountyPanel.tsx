import type { CountyDatum } from "../data/dashboardData";
import { OregonMap } from "./OregonMap";

interface CountyPanelProps {
  /** County workload data. */
  countyLoad: CountyDatum[];
}

/** Renders county workload with a real Oregon county map. */
export function CountyPanel({ countyLoad }: CountyPanelProps) {
  return (
    <article className="insight-panel county-panel">
      <div className="panel-heading">
        <h2>By county</h2>
        <span>Open workload</span>
      </div>
      <div className="county-content">
        <OregonMap countyLoad={countyLoad} />
      </div>
    </article>
  );
}
