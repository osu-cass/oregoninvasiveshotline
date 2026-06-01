import { geoMercator, geoPath } from "d3-geo";
import { useState } from "react";
import type { CountyDatum } from "../data/dashboardData";
import { oregonCounties } from "../data/oregonCounties";

interface OregonMapProps {
  /** County workload data used to shade counties. */
  countyLoad: CountyDatum[];
}

const width = 320;
const height = 210;

/** Renders a real Oregon county map from US Atlas county geometry. */
export function OregonMap({ countyLoad }: OregonMapProps) {
  const [hoveredCounty, setHoveredCounty] = useState<CountyDatum | null>(null);
  const countyValues = new Map(
    countyLoad.map((county) => [county.county, county.value]),
  );
  const maxValue = Math.max(...countyLoad.map((county) => county.value), 1);
  const projection = geoMercator().fitSize([width, height], oregonCounties);
  const path = geoPath(projection);
  const fallbackCounty = countyLoad[0] ?? { county: "Oregon", value: 0 };
  const activeCounty = hoveredCounty ?? fallbackCounty;

  return (
    <div className="map-shell">
      <svg
        className="oregon-map"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Oregon county workload map"
        onMouseLeave={() => setHoveredCounty(null)}
      >
        {oregonCounties.features.map((county) => {
          const name = county.properties.name ?? "";
          const value = countyValues.get(name) ?? 0;
          const intensity = value / maxValue;
          const fill = `rgba(37, 99, 235, ${0.08 + intensity * 0.62})`;

          return (
            <path
              className="oregon-county"
              d={path(county) ?? undefined}
              fill={fill}
              key={String(county.id)}
              onFocus={() => setHoveredCounty({ county: name, value })}
              onMouseEnter={() => setHoveredCounty({ county: name, value })}
              tabIndex={0}
            />
          );
        })}
      </svg>
      <div className="map-readout">
        <span>{hoveredCounty ? "County" : "Top county"}</span>
        <strong>{activeCounty.county}</strong>
        <em>{activeCounty.value} reports</em>
      </div>
    </div>
  );
}
