import { Select } from "@cloudflare/kumo/components/select";
import { useState } from "react";
import type { CountyDatum, StateKey } from "../data/dashboardData";
import { insightPanel, panelHeading, panelTitle } from "../styles/tailwindClasses";
import { StateCountyMap } from "./StateCountyMap";

interface CountyPanelProps {
  /** County workload data. */
  countyLoad: CountyDatum[];
  /** Handles county map selection changes. */
  onCountySelectionChange: (countyKey: string) => void;
  /** Selected county filter keys used for map emphasis. */
  selectedCountyKeys: string[];
}

/** Renders county workload with a selectable state map. */
export function CountyPanel({
  countyLoad,
  onCountySelectionChange,
  selectedCountyKeys,
}: CountyPanelProps) {
  const [selectedState, setSelectedState] = useState<StateKey>("oregon");
  const stateCountyLoad = countyLoad.filter(
    (county) => county.state === selectedState,
  );

  return (
    <article className={insightPanel}>
      <div className={panelHeading}>
        <h2 className={panelTitle}>By county</h2>
        <Select
          aria-label="Map state"
          className="min-w-[118px]"
          value={selectedState}
          onValueChange={(value) => setSelectedState(value as StateKey)}
          renderValue={(value) => (value === "washington" ? "Washington" : "Oregon")}
          size="sm"
        >
          <Select.Option value="oregon">Oregon</Select.Option>
          <Select.Option value="washington">Washington</Select.Option>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        <StateCountyMap
          countyLoad={stateCountyLoad}
          onCountySelectionChange={onCountySelectionChange}
          selectedCountyKeys={selectedCountyKeys}
          selectedState={selectedState}
        />
      </div>
    </article>
  );
}
