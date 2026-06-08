import { Chart } from "@cloudflare/kumo/components/chart";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { CategoryDatum } from "../data/dashboardData";

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface CategoryMixChartProps {
  /** Category mix data. */
  categoryMix: CategoryDatum[];
}

/** Renders report category mix as a compact Kumo chart. */
export function CategoryMixChart({ categoryMix }: CategoryMixChartProps) {
  const sortedMix = categoryMix.slice().sort((a, b) => b.value - a.value);

  return (
    <article className="insight-panel">
      <div className="panel-heading">
        <h2>Category mix</h2>
      </div>
      <Chart
        echarts={echarts}
        height={190}
        options={{
          color: ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0f766e"],
          legend: {
            bottom: 0,
            icon: "circle",
            itemGap: 10,
            itemHeight: 8,
            itemWidth: 8,
            textStyle: {
              color: "#4f6075",
              fontSize: 11,
              fontWeight: 600,
            },
          },
          tooltip: {
            trigger: "item",
            valueFormatter: (value) => `${value} reports`,
          },
          series: [
            {
              name: "Reports",
              type: "pie",
              radius: ["48%", "70%"],
              center: ["50%", "42%"],
              avoidLabelOverlap: true,
              data: sortedMix.map((item) => ({
                name: item.label,
                value: item.value,
              })),
              itemStyle: {
                borderColor: "#ffffff",
                borderRadius: 4,
                borderWidth: 2,
              },
              label: {
                show: true,
                formatter: "{c}",
                color: "#334155",
                fontSize: 11,
                fontWeight: 650,
              },
              labelLine: {
                length: 8,
                length2: 6,
              },
            },
          ],
        }}
      />
    </article>
  );
}
