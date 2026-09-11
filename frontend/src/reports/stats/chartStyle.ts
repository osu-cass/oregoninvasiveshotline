import type { LegendComponentOption } from "echarts";

export const CONFIRMED_COLOR = "#2e5f0e";
export const UNCONFIRMED_COLOR = "#eb6834";

/** Return whether the viewport uses mobile chart interactions. */
export function isMobileViewport(): boolean {
	return window.matchMedia("(max-width: 767px)").matches;
}

/** Build the shared legend styling for the current viewport. */
export function getLegendStyle(): LegendComponentOption {
	const mobile = isMobileViewport();
	return {
		bottom: 0,
		icon: "circle",
		itemWidth: mobile ? 10 : 8,
		itemHeight: mobile ? 10 : 8,
		itemGap: 10,
		textStyle: {
			color: "#52514e",
			fontSize: mobile ? 13 : 11,
			fontWeight: 600,
		},
	};
}
