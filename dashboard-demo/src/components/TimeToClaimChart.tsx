import { Chart } from "@cloudflare/kumo/components/chart";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface TimeToClaimChartProps {
  /** Monthly median days to claim. */
  data: { label: string; value: number }[];
}

/** Renders median time-to-claim trend using Kumo's ECharts wrapper. */
export function TimeToClaimChart({ data }: TimeToClaimChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="insight-panel">
      <div className="panel-heading">
        <h2>Median time to claim</h2>
      </div>
      <Chart
        echarts={echarts}
        height={190}
        options={{
          grid: { left: 34, right: 14, top: 12, bottom: 30 },
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: data.map((item) => item.label),
            axisLine: { lineStyle: { color: "#d8dee8" } },
            axisTick: { show: false },
            axisLabel: { color: "#64748b" },
          },
          yAxis: {
            type: "value",
            min: 0,
            max: Math.ceil(max + 1),
            axisLabel: { color: "#64748b" },
            splitLine: { lineStyle: { color: "#e4e9f0", type: "dashed" } },
          },
          series: [
            {
              name: "Days",
              type: "bar",
              data: data.map((item) => Number(item.value.toFixed(1))),
              itemStyle: { color: "#16a34a", borderRadius: [5, 5, 0, 0] },
              barMaxWidth: 30,
            },
          ],
        }}
      />
    </article>
  );
}
