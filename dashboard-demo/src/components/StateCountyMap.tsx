import { geoIdentity, geoMercator, geoPath } from "d3-geo";
import { useState, type MouseEvent } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import type { CountyDatum, StateKey } from "../data/dashboardData";
import { oregonCounties } from "../data/oregonCounties";
import { washingtonCounties as washingtonCountyGeometry } from "../data/washingtonCounties";

interface StateCountyMapProps {
  /** County workload data used to shade counties. */
  countyLoad: CountyDatum[];
  /** State geometry to render. */
  selectedState: StateKey;
}

const mapGeometry = {
  oregon: oregonCounties,
  washington: washingtonCountyGeometry,
} satisfies Record<StateKey, FeatureCollection<Geometry, { name?: string }>>;

const stateLabel = {
  oregon: "Oregon",
  washington: "Washington",
} satisfies Record<StateKey, string>;

const width = 320;
const height = 210;

/** Renders county workload for the selected state. */
export function StateCountyMap({
  countyLoad,
  selectedState,
}: StateCountyMapProps) {
  const [hoveredCounty, setHoveredCounty] = useState<CountyDatum | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const geometry = mapGeometry[selectedState];
  const countyValues = new Map(
    countyLoad.map((county) => [county.county, county.value]),
  );
  const maxValue = Math.max(...countyLoad.map((county) => county.value), 1);
  const projection =
    selectedState === "washington"
      ? geoIdentity().reflectY(true).fitSize([width, height], geometry)
      : geoMercator().fitSize([width, height], geometry);
  const path = geoPath(projection);

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div className="map-shell">
      <svg
        className="state-map"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${stateLabel[selectedState]} county workload map`}
        onMouseLeave={() => setHoveredCounty(null)}
        onMouseMove={handleMouseMove}
      >
        {geometry.features.map((county) => {
          const name = county.properties.name ?? "";
          const value = countyValues.get(name) ?? 0;
          const intensity = value / maxValue;
          const fill = `rgba(37, 99, 235, ${0.08 + intensity * 0.62})`;

          return (
            <path
              className="state-county"
              d={path(county) ?? undefined}
              fill={fill}
              key={String(county.id)}
              onFocus={() =>
                setHoveredCounty({
                  county: name,
                  countyKey: `${selectedState}:${name}`,
                  state: selectedState,
                  value,
                })
              }
              onMouseEnter={() =>
                setHoveredCounty({
                  county: name,
                  countyKey: `${selectedState}:${name}`,
                  state: selectedState,
                  value,
                })
              }
              tabIndex={0}
            />
          );
        })}
      </svg>
      {hoveredCounty ? (
        <div
          className="map-readout"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <span>County</span>
          <strong>{hoveredCounty.county}</strong>
          <em>{hoveredCounty.value} reports</em>
        </div>
      ) : null}
    </div>
  );
}
