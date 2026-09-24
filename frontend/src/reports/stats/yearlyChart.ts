import { type EChartsOption, init } from "echarts";
import {
	CONFIRMED_COLOR,
	getLegendStyle,
	isMobileViewport,
	UNCONFIRMED_COLOR,
} from "./chartStyle";
import type { ReportChart, YearStats } from "./types";

/** Return a padded, rounded maximum for the stacked report counts. */
function getBarAxisMax({ max }: { max: number }): number {
	const paddedMax = Math.max(max, 1) * 1.15;
	const magnitude = 10 ** Math.floor(Math.log10(paddedMax));
	const normalizedMax = paddedMax / magnitude;
	const tickSize = Math.max(
		normalizedMax <= 2
			? magnitude / 5
			: normalizedMax <= 5
				? magnitude / 2
				: magnitude,
		1,
	);
	return Math.ceil(paddedMax / tickSize) * tickSize;
}

/** Mount the yearly chart and keep its ECharts instance private. */
export function createYearlyChart(
	container: HTMLElement,
	stats: YearStats[],
): ReportChart {
	const chart = init(container, null, { renderer: "svg" });
	const mobile = isMobileViewport();
	const axisLabel = {
		color: mobile ? "#66645f" : "#898781",
		fontSize: mobile ? 13 : 12,
		fontWeight: mobile ? 500 : ("normal" as const),
	};
	const option: EChartsOption = {
		aria: { enabled: true },
		tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
		legend: getLegendStyle(),
		grid: { left: 8, right: 8, top: 12, bottom: 28, containLabel: true },
		xAxis: {
			type: "category",
			data: stats.map((row) => String(row.year)),
			axisLine: { lineStyle: { color: "#c3c2b7" } },
			axisLabel,
			axisTick: { show: false },
		},
		yAxis: {
			type: "value",
			min: 0,
			max: getBarAxisMax,
			minInterval: 1,
			axisLabel,
			splitLine: { lineStyle: { color: "#e1e0d9", type: "dashed" } },
		},
		series: [
			{
				name: "Confirmed",
				type: "bar",
				stack: "reports",
				barMaxWidth: 40,
				itemStyle: {
					color: CONFIRMED_COLOR,
					borderColor: "#fff",
					borderWidth: 1,
				},
				data: stats.map((row) => row.confirmed),
			},
			{
				name: "Unconfirmed",
				type: "bar",
				stack: "reports",
				barMaxWidth: 40,
				itemStyle: {
					color: UNCONFIRMED_COLOR,
					borderColor: "#fff",
					borderWidth: 1,
					borderRadius: [4, 4, 0, 0],
				},
				data: stats.map((row) => row.total - row.confirmed),
			},
		],
	};
	chart.setOption(option);
	return {
		resize: () => chart.resize(),
		destroy: () => chart.dispose(),
	};
}
