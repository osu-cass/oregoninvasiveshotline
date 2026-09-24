import "vite/modulepreload-polyfill";
import { mountResultsPage } from "./resultsPage";
import type { CategoryStats, YearStats } from "./stats/types";

/** Mount the report results using data serialized by the Django template. */
function initializeResults(): void {
	const years = document.getElementById("report-year-stats");
	const categories = document.getElementById("report-category-stats");
	if (!years || !categories) return;
	const stats: YearStats[] = JSON.parse(years.textContent || "[]");
	const categoryStats: CategoryStats[] = JSON.parse(
		categories.textContent || "[]",
	);
	mountResultsPage(stats, categoryStats);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeResults, {
		once: true,
	});
} else {
	initializeResults();
}
