interface MetricSparklineProps {
  /** Ordered trend values to draw. */
  values: number[];
}

/** Renders a compact SVG trend for metric cards. */
export function MetricSparkline({ values }: MetricSparklineProps) {
  const width = 180;
  const height = 36;
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - (value / maxValue) * (height - 10) - 5;
    return `${x},${y}`;
  });
  const areaPoints = [`0,${height}`, ...points, `${width},${height}`];

  return (
    <svg
      aria-hidden="true"
      className="metric-sparkline"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polygon points={areaPoints.join(" ")} />
      <polyline points={points.join(" ")} />
    </svg>
  );
}
