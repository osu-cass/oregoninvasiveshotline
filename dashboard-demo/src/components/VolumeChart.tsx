import { Chart } from "@cloudflare/kumo/components/chart";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { insightPanel, panelHeading, panelTitle } from "../styles/tailwindClasses";

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface VolumeChartProps {
  /** Weekly submission data. */
  data: [number, number][];
}

/** Renders the submissions trend with a polished Kumo chart wrapper. */
export function VolumeChart({ data }: VolumeChartProps) {
  const labels = data.map(([timestamp]) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  );
  const interval = Math.max(0, Math.ceil(labels.length / 4) - 1);

  return (
    <article className={insightPanel}>
      <div className={panelHeading}>
        <h2 className={panelTitle}>Submissions over time</h2>
      </div>
      <Chart
        echarts={echarts}
        height={190}
        options={{
          grid: { left: 34, right: 14, top: 12, bottom: 30 },
          tooltip: {
            trigger: "axis",
            axisPointer: { lineStyle: { color: "#94a3b8" } },
          },
          xAxis: {
            type: "category",
            data: labels,
            axisLine: { lineStyle: { color: "#d8dee8" } },
            axisTick: { show: false },
            axisLabel: {
              color: "#64748b",
              interval,
            },
            splitLine: { show: false },
          },
          yAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: { color: "#64748b" },
            splitLine: { lineStyle: { color: "#e4e9f0", type: "dashed" } },
          },
          series: [
            {
              name: "Submissions",
              type: "line",
              data: data.map(([, value]) => value),
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { color: "#2563eb", width: 2.5 },
              itemStyle: { color: "#2563eb" },
              areaStyle: { color: "rgba(37, 99, 235, 0.08)" },
            },
          ],
        }}
      />
    </article>
  );
}
