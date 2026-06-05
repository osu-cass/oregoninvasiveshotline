import { Select } from "@cloudflare/kumo/components/select";
import { useState } from "react";
import type { CountyDatum, StateKey } from "../data/dashboardData";
import { StateCountyMap } from "./StateCountyMap";

interface CountyPanelProps {
  /** County workload data. */
  countyLoad: CountyDatum[];
}

/** Renders county workload with a real Oregon county map. */
export function CountyPanel({ countyLoad }: CountyPanelProps) {
  const [selectedState, setSelectedState] = useState<StateKey>("oregon");
  const stateCountyLoad = countyLoad.filter(
    (county) => county.state === selectedState,
  );

  return (
    <article className="insight-panel county-panel">
      <div className="panel-heading">
        <h2>By county</h2>
        <Select
          aria-label="Map state"
          className="state-select"
          value={selectedState}
          onValueChange={(value) => setSelectedState(value as StateKey)}
          renderValue={(value) => (value === "washington" ? "Washington" : "Oregon")}
          size="sm"
        >
          <Select.Option value="oregon">Oregon</Select.Option>
          <Select.Option value="washington">Washington</Select.Option>
        </Select>
      </div>
      <div className="county-content">
        <StateCountyMap
          countyLoad={stateCountyLoad}
          selectedState={selectedState}
        />
      </div>
    </article>
  );
}
