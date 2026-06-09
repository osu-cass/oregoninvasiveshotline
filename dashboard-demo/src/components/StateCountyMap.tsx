import { geoIdentity, geoMercator, geoPath } from "d3-geo";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import type { CountyDatum, StateKey } from "../data/dashboardData";
import { oregonCounties } from "../data/oregonCounties";
import { washingtonCounties as washingtonCountyGeometry } from "../data/washingtonCounties";

interface StateCountyMapProps {
  /** County workload data used to shade counties. */
  countyLoad: CountyDatum[];
  /** Handles county map selection changes. */
  onCountySelectionChange: (countyKey: string) => void;
  /** Selected county filter keys used to dim unrelated counties. */
  selectedCountyKeys: string[];
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
  onCountySelectionChange,
  selectedCountyKeys,
  selectedState,
}: StateCountyMapProps) {
  const [hoveredCounty, setHoveredCounty] = useState<CountyDatum | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const geometry = mapGeometry[selectedState];
  const countyValues = new Map(
    countyLoad.map((county) => [county.county, county.value]),
  );
  const selectedCountySet = new Set(selectedCountyKeys);
  const hasCountySelection = selectedCountyKeys.length > 0;
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
  const handleCountyKeyDown = (
    event: KeyboardEvent<SVGPathElement>,
    countyKey: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onCountySelectionChange(countyKey);
  };

  return (
    <div className="relative min-h-[198px] rounded-lg bg-[#f8fafc] bg-[radial-gradient(circle_at_25%_18%,rgba(37,99,235,0.08),transparent_28%)] p-3">
      <svg
        className="block h-[164px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${stateLabel[selectedState]} county workload map`}
        onMouseLeave={() => setHoveredCounty(null)}
        onMouseMove={handleMouseMove}
      >
        {geometry.features.map((county) => {
          const name = county.properties.name ?? "";
          const countyKey = `${selectedState}:${name}`;
          const value = countyValues.get(name) ?? 0;
          const intensity = value / maxValue;
          const isSelected = selectedCountySet.has(countyKey);
          const isDimmed =
            hasCountySelection && !isSelected;
          const fill = isDimmed
            ? "#d9dee7"
            : `rgba(37, 99, 235, ${0.08 + intensity * 0.62})`;

          return (
            <path
              aria-label={`${name} County`}
              aria-pressed={isSelected}
              className={`cursor-pointer outline-none transition-[fill,opacity,stroke] duration-150 [stroke-width:0.55] [stroke:rgba(74,91,111,0.38)] hover:[stroke-width:1.35] hover:[stroke:#143f7d] focus-visible:[stroke-width:1.35] focus-visible:[stroke:#143f7d] ${
                isDimmed
                  ? "opacity-[0.72] [stroke:rgba(83,96,116,0.32)]"
                  : ""
              } ${isSelected ? "[stroke-width:1.15] [stroke:#174b91]" : ""}`}
              d={path(county) ?? undefined}
              fill={fill}
              key={String(county.id)}
              onClick={() => onCountySelectionChange(countyKey)}
              onFocus={() =>
                setHoveredCounty({
                  county: name,
                  countyKey,
                  state: selectedState,
                  value,
                })
              }
              onMouseEnter={() =>
                setHoveredCounty({
                  county: name,
                  countyKey,
                  state: selectedState,
                  value,
                })
              }
              onKeyDown={(event) => handleCountyKeyDown(event, countyKey)}
              tabIndex={0}
              role="button"
            />
          );
        })}
      </svg>
      {hoveredCounty ? (
        <div
          className="pointer-events-none absolute z-10 min-w-32 translate-x-3 -translate-y-1/2 rounded-md bg-white/90 px-[11px] py-[9px] shadow-[0_8px_20px_rgba(28,36,50,0.08)]"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <span className="block text-[0.72rem] not-italic text-[#637386]">
            County
          </span>
          <strong className="my-0.5 block text-[0.92rem]">
            {hoveredCounty.county}
          </strong>
          <em className="block text-[0.72rem] not-italic text-[#637386]">
            {hoveredCounty.value} reports
          </em>
        </div>
      ) : null}
    </div>
  );
}
