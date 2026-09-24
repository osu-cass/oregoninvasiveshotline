import { type EChartsOption, init, type PieSeriesOption } from "echarts";
import {
	CONFIRMED_COLOR,
	getLegendMetrics,
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
/** Inner ring edge as a fraction of the outer radius. */
const INNER_RATIO = 0.67;
/** Breathing room between the ring and the box edges or the legend. */
const SIDE_PAD = 12;
const VERTICAL_PAD = 6;

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

/** Pixel geometry the ring fills: the chart box minus the legend block. */
interface PieGeometry {
	centerX: number;
	centerY: number;
	innerRadius: number;
	outerRadius: number;
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
	let geometry = getPieGeometry(overviewData);
	let labelFontSize = chooseLabelFontSize();
	let overviewPieHeight: number | null = null;
	let geometryWidth = chart.getWidth();
	let geometryHeight = chart.getHeight();

	/** Estimate the legend block height so the ring can claim the rest. */
	function estimateLegendHeight(data: PieSlice[]): number {
		if (!labelContext) return 0;
		const metrics = getLegendMetrics();
		labelContext.font = `600 ${metrics.fontSize}px sans-serif`;
		// Wrap rows the way ECharts does; the slack avoids underestimating.
		const rowWidth = chart.getWidth() - 2 * metrics.padding - 4;
		let rows = 1;
		let lineWidth = 0;
		for (const slice of data) {
			const itemWidth =
				metrics.itemWidth +
				metrics.iconTextGap +
				labelContext.measureText(slice.name).width;
			if (lineWidth > 0 && lineWidth + metrics.itemGap + itemWidth > rowWidth) {
				rows += 1;
				lineWidth = itemWidth;
			} else {
				lineWidth += lineWidth > 0 ? metrics.itemGap + itemWidth : itemWidth;
			}
		}
		return rows * metrics.lineHeight + 2 * metrics.padding;
	}

	/** Read the rendered legend's top edge (relative to the chart box). */
	function measureLegendTop(): number | null {
		if (chart.isDisposed()) return null;
		const boxRect = chart.getDom().getBoundingClientRect();
		if (!boxRect.width || !boxRect.height) return null;
		const names = new Set(activeData.map((slice) => slice.name));
		let minTop: number | null = null;
		chart
			.getDom()
			.querySelectorAll("svg text")
			.forEach((text) => {
				if (!names.has(text.textContent ?? "")) return;
				const top = text.getBoundingClientRect().top;
				if (minTop === null || top < minTop) minTop = top;
			});
		if (minTop === null) return null;
		// Leave room for the legend's padding above the first row of text.
		return minTop - boxRect.top - getLegendMetrics().padding;
	}

	/** Fill the chart box above the legend with the largest ring that fits. */
	function getPieGeometry(
		data: PieSlice[],
		pieHeightOverride?: number,
	): PieGeometry {
		const width = chart.getWidth();
		const pieHeight =
			pieHeightOverride ?? chart.getHeight() - estimateLegendHeight(data);
		const outerRadius = Math.max(
			0,
			Math.min((width - SIDE_PAD) / 2, pieHeight / 2 - VERTICAL_PAD),
		);
		return {
			centerX: width / 2,
			centerY: pieHeight / 2,
			innerRadius: outerRadius * INNER_RATIO,
			outerRadius,
		};
	}

	/** Keep the ring size fixed when the visible legend changes. */
	function updateGeometry(): void {
		chart.getZr().flush();
		const width = chart.getWidth();
		const height = chart.getHeight();
		if (activeData === overviewData) {
			overviewPieHeight =
				measureLegendTop() ?? height - estimateLegendHeight(overviewData);
		} else if (
			overviewPieHeight === null ||
			width !== geometryWidth ||
			height !== geometryHeight
		) {
			overviewPieHeight = height - estimateLegendHeight(overviewData);
		}
		geometryWidth = width;
		geometryHeight = height;
		geometry = getPieGeometry(overviewData, overviewPieHeight);
		labelFontSize = chooseLabelFontSize();
	}

	/** Choose one readable font size that fits every count inside the ring. */
	function chooseLabelFontSize(): number {
		if (!labelContext) return 0;
		const ringSpace = (geometry.outerRadius - geometry.innerRadius) / 2;
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
		const { centerX, centerY, innerRadius, outerRadius } = geometry;
		const middleRadius = (innerRadius + outerRadius) / 2;
		return {
			name: "Reports",
			type: "pie",
			animation: false,
			radius: [innerRadius, outerRadius],
			center: [centerX, centerY],
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
				const offsetX = labelRect.x + labelRect.width / 2 - centerX;
				const offsetY = labelRect.y + labelRect.height / 2 - centerY;
				const currentRadius = Math.hypot(offsetX, offsetY);
				return {
					x: centerX + (offsetX / currentRadius) * middleRadius,
					y: centerY + (offsetY / currentRadius) * middleRadius,
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
		chart.dispatchAction({ type: "hideTip" });
		chart.setOption({
			legend: { ...legendStyle, data: data.map((slice) => slice.name) },
		});
		updateGeometry();
		chart.setOption(
			{ series: [getSeries(data)] },
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
	};
	chart.setOption(option);
	updateGeometry();
	chart.setOption({ series: [getSeries(overviewData)] });
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
		/** Resize the pie and recalculate its geometry and labels. */
		resize() {
			const { clientWidth, clientHeight } = container;
			if (!clientWidth || !clientHeight) return;
			if (
				clientWidth === chart.getWidth() &&
				clientHeight === chart.getHeight()
			) {
				return;
			}
			chart.resize({ animation: { duration: 0 } });
			updateGeometry();
			chart.setOption({ series: [getSeries(activeData)] });
		},
		/** Remove the back-button listener and dispose of the chart. */
		destroy() {
			backButton?.removeEventListener("click", showOverview);
			chart.dispose();
		},
	};
}
