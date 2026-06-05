import { Chart } from "@cloudflare/kumo/components/chart";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { CategoryDatum } from "../data/dashboardData";

echarts.use([BarChart, TooltipComponent, GridComponent, CanvasRenderer]);

interface CategoryMixChartProps {
  /** Category mix data. */
  categoryMix: CategoryDatum[];
}

/** Renders report category mix as a compact Kumo chart. */
export function CategoryMixChart({ categoryMix }: CategoryMixChartProps) {
  const sortedMix = categoryMix.slice().sort((a, b) => a.value - b.value);

  return (
    <article className="insight-panel">
      <div className="panel-heading">
        <h2>Category mix</h2>
      </div>
      <Chart
        echarts={echarts}
        height={190}
        options={{
          grid: { left: 72, right: 18, top: 8, bottom: 16 },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          xAxis: {
            type: "value",
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: "#edf1f5" } },
          },
          yAxis: {
            type: "category",
            data: sortedMix.map((item) => item.label),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#4f6075", fontWeight: 600 },
          },
          series: [
            {
              name: "Reports",
              type: "bar",
              data: sortedMix.map((item) => item.value),
              itemStyle: { color: "#2563eb", borderRadius: [0, 5, 5, 0] },
              barMaxWidth: 18,
              label: {
                show: true,
                position: "right",
                color: "#334155",
                fontWeight: 700,
              },
            },
          ],
        }}
      />
    </article>
  );
}
