import { useState, type MouseEvent } from "react";

interface MetricTrendChartProps {
  /** Unit suffix for y-axis labels. */
  unit?: string;
  /** Ordered trend values to draw. */
  values: number[];
}

/** Renders the full chart area inside a metric card. */
export function MetricTrendChart({ unit = "", values }: MetricTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 360;
  const height = 154;
  const plot = {
    bottom: 122,
    left: 42,
    right: 348,
    top: 16,
  };
  const maxValue = getRoundedMax(values);
  const middleValue = maxValue / 2;
  const points = values.map((value, index) => {
    const x =
      plot.left +
      (index / Math.max(values.length - 1, 1)) * (plot.right - plot.left);
    const y =
      plot.bottom - (value / maxValue) * (plot.bottom - plot.top);

    return `${x},${y}`;
  });
  const pointData = values.map((value, index) => {
    const x =
      plot.left +
      (index / Math.max(values.length - 1, 1)) * (plot.right - plot.left);
    const y =
      plot.bottom - (value / maxValue) * (plot.bottom - plot.top);

    return {
      label: formatPointDate(index),
      value,
      x,
      y,
    };
  });
  const hoveredPoint = hoveredIndex === null ? null : pointData[hoveredIndex];
  const areaPoints = [
    `${plot.left},${plot.bottom}`,
    ...points,
    `${plot.right},${plot.bottom}`,
  ];

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;
    const rawIndex =
      ((relativeX - plot.left) / (plot.right - plot.left)) *
      Math.max(values.length - 1, 1);
    const nextIndex = Math.min(
      values.length - 1,
      Math.max(0, Math.round(rawIndex)),
    );
    setHoveredIndex(nextIndex);
  };

  return (
    <svg
      aria-hidden="true"
      className="mt-auto block h-28 w-full overflow-hidden"
      onMouseLeave={() => setHoveredIndex(null)}
      onMouseMove={handleMouseMove}
      viewBox={`0 0 ${width} ${height}`}
    >
      {[maxValue, middleValue, 0].map((value) => {
        const y = plot.bottom - (value / maxValue) * (plot.bottom - plot.top);

        return (
          <g key={value}>
            <text fill="#64748b" fontSize="0.72rem" x="0" y={y + 4}>
              {formatAxisLabel(value, unit)}
            </text>
            <line
              stroke="#dbe3ee"
              strokeDasharray="4 4"
              strokeWidth="1"
              x1={plot.left}
              x2={plot.right}
              y1={y}
              y2={y}
            />
          </g>
        );
      })}
      <polygon fill="rgba(37, 99, 235, 0.08)" points={areaPoints.join(" ")} />
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke="#2563eb"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      {hoveredPoint ? (
        <>
          <line
            stroke="#94a3b8"
            strokeDasharray="3 3"
            x1={hoveredPoint.x}
            x2={hoveredPoint.x}
            y1={plot.top}
            y2={plot.bottom}
          />
          <circle
            cx={hoveredPoint.x}
            cy={hoveredPoint.y}
            fill="#ffffff"
            r="4"
            stroke="#2563eb"
            strokeWidth="2"
          />
          <g
            transform={`translate(${Math.min(242, Math.max(52, hoveredPoint.x - 44))} ${
              hoveredPoint.y < 52 ? hoveredPoint.y + 14 : hoveredPoint.y - 48
            })`}
          >
            <rect
              fill="rgba(255, 255, 255, 0.96)"
              filter="drop-shadow(0 5px 14px rgba(28, 36, 50, 0.14))"
              height="36"
              rx="6"
              stroke="rgba(118, 130, 150, 0.18)"
              width="88"
            />
            <text fill="#64748b" fontSize="0.68rem" fontWeight="600" x="8" y="14">
              {hoveredPoint.label}
            </text>
            <text
              fill="#172033"
              fontSize="0.78rem"
              fontWeight="760"
              x="8"
              y="29"
            >
              {formatAxisLabel(hoveredPoint.value, unit)}
            </text>
          </g>
        </>
      ) : null}
    </svg>
  );
}

function formatPointDate(index: number): string {
  const start = new Date(2026, 4, 20);
  start.setDate(start.getDate() + index);

  return start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatAxisLabel(value: number, unit: string): string {
  if (value === 0 || unit === "") {
    return String(Math.round(value));
  }

  return `${Math.round(value)}${unit}`;
}

function getRoundedMax(values: number[]): number {
  const maxValue = Math.max(...values, 1);

  if (maxValue <= 6) {
    return 6;
  }

  return Math.ceil(maxValue / 5) * 5;
}
