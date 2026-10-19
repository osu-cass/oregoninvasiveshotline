import { createCategoryChart } from "./stats/categoryChart";
import type { CategoryStats, ReportChart, YearStats } from "./stats/types";
import { createYearlyChart } from "./stats/yearlyChart";

type ResultView = "map" | "stats";

/** Keep pagination and sorting links aligned with the selected view. */
function updateResultViewLinks(view: ResultView): void {
	document
		.querySelectorAll<HTMLAnchorElement>("[data-result-view-link]")
		.forEach((link) => {
			const url = new URL(link.href);
			if (view === "stats") url.searchParams.set("view", "stats");
			else url.searchParams.delete("view");
			link.href = url.toString();
		});
}

/** Preserve the selected view in the URL, search form, and navigation. */
function updateResultView(view: ResultView): void {
	const url = new URL(window.location.href);
	const form = document.querySelector<HTMLFormElement>("#report-search-form");
	let input = document.querySelector<HTMLInputElement>("#result-view-input");
	if (view === "stats") {
		url.searchParams.set("view", "stats");
		if (form && !input) {
			input = document.createElement("input");
			input.id = "result-view-input";
			input.type = "hidden";
			input.name = "view";
			form.appendChild(input);
		}
		if (input) input.value = "stats";
	} else {
		url.searchParams.delete("view");
		input?.remove();
	}
	updateResultViewLinks(view);
	window.history.replaceState(
		window.history.state,
		"",
		url.pathname + url.search + url.hash,
	);
}

/** Connect result tabs and navigation to lazily mounted, independent charts. */
export function mountResultsPage(
	stats: YearStats[],
	categoryStats: CategoryStats[],
): { destroy(): void } | undefined {
	const mapTab = document.getElementById("list-map-tab");
	const statsTab = document.getElementById("list-stats-tab");
	const barContainer = document.getElementById("stats-chart");
	const pieContainer = document.getElementById("stats-pie");
	const backButton = document.getElementById("stats-pie-back");
	if (!mapTab || !statsTab || !barContainer) return;

	const events = new AbortController();
	const listenerOptions = { signal: events.signal };
	let charts: ReportChart[] | null = null;
	const observer = window.ResizeObserver
		? new ResizeObserver(resizeCharts)
		: null;

	/** Let each chart resize its own rendering and labels. */
	function resizeCharts(): void {
		charts?.forEach((chart) => {
			chart.resize();
		});
	}

	/** Mount charts only when their tab has measurable dimensions. */
	function showCharts(): void {
		if (charts) {
			resizeCharts();
			return;
		}
		charts = [createYearlyChart(barContainer as HTMLElement, stats)];
		if (pieContainer) {
			charts.push(createCategoryChart(pieContainer, categoryStats, backButton));
		}
	}

	/** Release page listeners, observers, and chart instances. */
	function destroy(): void {
		events.abort();
		observer?.disconnect();
		charts?.forEach((chart) => {
			chart.destroy();
		});
		charts = null;
	}

	mapTab.addEventListener(
		"shown.bs.tab",
		() => updateResultView("map"),
		listenerOptions,
	);
	statsTab.addEventListener(
		"shown.bs.tab",
		() => {
			updateResultView("stats");
			showCharts();
		},
		listenerOptions,
	);
	window.addEventListener("resize", resizeCharts, listenerOptions);
	window.addEventListener(
		"pagehide",
		(event) => {
			// Cached pages retain their charts and listeners for history navigation.
			if (!event.persisted) destroy();
		},
		listenerOptions,
	);
	observer?.observe(barContainer);
	if (pieContainer) observer?.observe(pieContainer);
	if (statsTab.classList.contains("active")) showCharts();
	return { destroy };
}
