import type { LegendComponentOption } from "echarts";

export const CONFIRMED_COLOR = "#2e5f0e";
export const UNCONFIRMED_COLOR = "#eb6834";

/** Return whether the viewport uses mobile chart interactions. */
export function isMobileViewport(): boolean {
	return window.matchMedia("(max-width: 767px)").matches;
}

/** Shared legend metrics so charts can size themselves around the legend. */
export interface LegendMetrics {
	/** Legend text font size in px. */
	fontSize: number;
	/** Legend icon size in px. */
	itemWidth: number;
	/** Horizontal gap between legend items. */
	itemGap: number;
	/** Gap between an item's icon and its text. */
	iconTextGap: number;
	/** Height of one wrapped legend row. */
	lineHeight: number;
	/** Padding on each edge of the legend block. */
	padding: number;
}

/** Build the legend metrics for the current viewport. */
export function getLegendMetrics(): LegendMetrics {
	const mobile = isMobileViewport();
	const fontSize = mobile ? 13 : 11;
	return {
		fontSize,
		itemWidth: mobile ? 10 : 8,
		itemGap: 10,
		iconTextGap: 5,
		lineHeight: fontSize + 10,
		padding: 5,
	};
}

/** Build the shared legend styling for the current viewport. */
export function getLegendStyle(): LegendComponentOption {
	const { fontSize, itemWidth, itemGap } = getLegendMetrics();
	return {
		bottom: 0,
		icon: "circle",
		itemWidth,
		itemHeight: itemWidth,
		itemGap,
		textStyle: {
			color: "#52514e",
			fontSize,
			fontWeight: 600,
		},
	};
}
