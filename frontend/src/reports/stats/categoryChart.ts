import { type EChartsOption, init, type PieSeriesOption } from "echarts";
import {
	CONFIRMED_COLOR,
	getLegendStyle,
	isMobileViewport,
	UNCONFIRMED_COLOR,
} from "./chartStyle";
import type { CategoryStats, ReportChart } from "./types";

const PIE_COLORS = [
	CONFIRMED_COLOR,
	UNCONFIRMED_COLOR,
	"#2a78d6",
	"#eda100",
	"#e87ba4",
	"#1baf7a",
	"#4a3aa7",
];
const OTHER_COLOR = "#8f8d86";
const INNER_RADIUS = 0.43;
const OUTER_RADIUS = 0.64;

/** A category slice, optionally containing the categories folded into Other. */
interface PieSlice {
	name: string;
	value: number;
	groupedCategories?: PieSlice[];
	itemStyle?: { color: string };
}

/** Color category slices, reserving neutral gray for the Other group. */
function colorSlices(slices: PieSlice[]): PieSlice[] {
	return slices.map((slice, index) => ({
		...slice,
		itemStyle: {
			color: slice.groupedCategories
				? OTHER_COLOR
				: PIE_COLORS[index % PIE_COLORS.length],
		},
	}));
}

/** Fold categories beyond the palette into an expandable Other slice. */
function getOverviewData(stats: CategoryStats[]): PieSlice[] {
	let slices: PieSlice[] = stats.map((row) => ({
		name: row.category_name ?? "",
		value: row.count,
	}));
	if (slices.length > PIE_COLORS.length) {
		const rest = slices.slice(PIE_COLORS.length);
		slices = slices.slice(0, PIE_COLORS.length);
		slices.push({
			name: "Other",
			value: rest.reduce((sum, slice) => sum + slice.value, 0),
			groupedCategories: rest,
		});
	}
	return colorSlices(slices);
}

/** Escape category names before inserting them into tooltip HTML. */
function escapeHtml(value: string): string {
	const replacements: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};
	return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

/** Mount the category chart with private drilldown and label state. */
export function createCategoryChart(
	container: HTMLElement,
	stats: CategoryStats[],
	backButton: HTMLElement | null,
): ReportChart {
	const chart = init(container, null, { renderer: "svg" });
	const overviewData = getOverviewData(stats);
	const legendStyle = getLegendStyle();
	const labelContext = document.createElement("canvas").getContext("2d");
	let activeData = overviewData;
	let otherTapArmed = false;
	let labelFontSize = chooseLabelFontSize();

	/** Choose one readable font size that fits every count inside the ring. */
	function chooseLabelFontSize(): number {
		if (!labelContext) return 0;
		const chartRadius = Math.min(chart.getWidth(), chart.getHeight()) / 2;
		const ringSpace = (chartRadius * (OUTER_RADIUS - INNER_RADIUS)) / 2;
		for (let size = 13; size >= 11; size -= 1) {
			labelContext.font = `600 ${size}px sans-serif`;
			const fits = activeData.every((slice) => {
				const width = labelContext.measureText(String(slice.value)).width;
				return Math.hypot(width, size) / 2 + 3 <= ringSpace;
			});
			if (fits) return size;
		}
		return 0;
	}

	/** Build the pie series without changing the current chart state. */
	function getSeries(data: PieSlice[]): PieSeriesOption {
		return {
			name: "Reports",
			type: "pie",
			radius: [`${INNER_RADIUS * 100}%`, `${OUTER_RADIUS * 100}%`],
			center: ["50%", "44%"],
			percentPrecision: 6,
			avoidLabelOverlap: true,
			itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 4 },
			label: {
				position: "inside",
				color: "#fff",
				textBorderWidth: 0,
				fontFamily: "sans-serif",
				fontSize: labelFontSize || 11,
				fontWeight: 600,
				/** Hide counts whose padded text cannot fit inside the slice. */
				formatter(params) {
					if (!labelContext || !labelFontSize || Number(params.value) <= 0) {
						return "";
					}
					const text = String(params.value);
					labelContext.font = `600 ${labelFontSize}px sans-serif`;
					const labelRadius =
						Math.hypot(labelContext.measureText(text).width, labelFontSize) /
							2 +
						3;
					const chartRadius = Math.min(chart.getWidth(), chart.getHeight()) / 2;
					const middleRadius =
						(chartRadius * (INNER_RADIUS + OUTER_RADIUS)) / 2;
					const sliceSpace =
						middleRadius *
						Math.sin(
							Math.min(((params.percent ?? 0) * Math.PI) / 100, Math.PI / 2),
						);
					return labelRadius <= sliceSpace ? text : "";
				},
			},
			labelLine: { show: false },
			/** Center labels between the inner and outer edges of the ring. */
			labelLayout({ labelRect }) {
				const centerX = chart.getWidth() * 0.5;
				const centerY = chart.getHeight() * 0.44;
				const offsetX = labelRect.x + labelRect.width / 2 - centerX;
				const offsetY = labelRect.y + labelRect.height / 2 - centerY;
				const currentRadius = Math.hypot(offsetX, offsetY);
				const chartRadius = Math.min(chart.getWidth(), chart.getHeight()) / 2;
				const labelRadius = (chartRadius * (INNER_RADIUS + OUTER_RADIUS)) / 2;
				return {
					x: centerX + (offsetX / currentRadius) * labelRadius,
					y: centerY + (offsetY / currentRadius) * labelRadius,
					align: "center",
					verticalAlign: "middle",
					hideOverlap: true,
				};
			},
			data,
		};
	}

	/** Switch category data and refresh labels without resizing the panel. */
	function showData(data: PieSlice[], drilldown: boolean): void {
		activeData = data;
		otherTapArmed = false;
		labelFontSize = chooseLabelFontSize();
		chart.dispatchAction({ type: "hideTip" });
		chart.setOption(
			{
				legend: { ...legendStyle, data: data.map((slice) => slice.name) },
				series: [getSeries(data)],
			},
			{ replaceMerge: ["series"] },
		);
		if (backButton) backButton.hidden = !drilldown;
	}

	/** Restore the category overview after drilling into Other. */
	function showOverview(): void {
		showData(overviewData, false);
	}

	const option: EChartsOption = {
		aria: { enabled: true },
		tooltip: {
			trigger: "item",
			confine: true,
			/** Escape category names and explain how to expand Other. */
			formatter(params) {
				const item = Array.isArray(params) ? params[0] : params;
				const slice = item.data as PieSlice;
				const content =
					`<strong>${escapeHtml(item.name)}</strong><br>` +
					`<strong>${slice.value}</strong> report${slice.value === 1 ? "" : "s"}`;
				if (!slice.groupedCategories) return content;
				return (
					`${content}<br><span style="color:#0d6efd;font-weight:600">` +
					`${isMobileViewport() ? "Tap again to expand" : "Click to expand"}</span>`
				);
			},
		},
		legend: { ...legendStyle, data: overviewData.map((slice) => slice.name) },
		series: [getSeries(overviewData)],
	};
	chart.setOption(option);
	chart.on("click", (params) => {
		if (params.componentType !== "series") return;
		const slice = params.data as PieSlice;
		if (!slice.groupedCategories) {
			otherTapArmed = false;
			return;
		}
		if (isMobileViewport() && !otherTapArmed) {
			otherTapArmed = true;
			chart.dispatchAction({
				type: "showTip",
				seriesIndex: params.seriesIndex,
				dataIndex: params.dataIndex,
			});
			return;
		}
		showData(colorSlices(slice.groupedCategories), true);
	});
	backButton?.addEventListener("click", showOverview);

	return {
		/** Resize the pie and recalculate labels for its new dimensions. */
		resize() {
			chart.resize();
			labelFontSize = chooseLabelFontSize();
			chart.setOption({
				series: [{ label: { fontSize: labelFontSize || 11 } }],
			});
		},
		/** Remove the back-button listener and dispose of the chart. */
		destroy() {
			backButton?.removeEventListener("click", showOverview);
			chart.dispose();
		},
	};
}
