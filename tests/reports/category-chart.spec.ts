import { expect, type Page, test } from "@playwright/test";
import type { CategoryStats } from "../../frontend/src/reports/stats/types";

const CATEGORIES: CategoryStats[] = [
	{ category_name: "Terrestrial flowering plants and grasses", count: 310 },
	{ category_name: "Freshwater aquatic plants and algae", count: 280 },
	{ category_name: "Insects and other land invertebrates", count: 250 },
	{ category_name: "Freshwater fish and aquatic vertebrates", count: 220 },
	{ category_name: "Birds and other flying vertebrates", count: 190 },
	{ category_name: "Reptiles and amphibians", count: 160 },
	{ category_name: "Microorganisms and fungal pathogens", count: 130 },
	{ category_name: "Mammals and other terrestrial vertebrates", count: 100 },
	{ category_name: "Marine and estuarine invertebrates", count: 70 },
];

/** Mount the actual SVG chart in an isolated browser page. */
async function openChart(page: Page): Promise<void> {
	await page.route("**/category-chart-test", (route) =>
		route.fulfill({
			contentType: "text/html",
			body: `<!doctype html>
				<style>
					body { margin: 16px; }
					#stats-pie { width: min(520px, calc(100vw - 32px)); height: 320px; }
				</style>
				<button id="stats-pie-back" hidden>All categories</button>
				<div id="stats-pie"></div>`,
		}),
	);
	await page.goto(
		`http://localhost:${process.env.VITE_PORT || "5174"}/category-chart-test`,
	);
	await page.evaluate(async (stats) => {
		const url = new URL(
			"/static/src/reports/stats/categoryChart.ts",
			window.location.href,
		).href;
		const { createCategoryChart } = (await import(
			url
		)) as typeof import("../../frontend/src/reports/stats/categoryChart");
		const container = document.getElementById("stats-pie");
		if (!container) throw new Error("Chart container is missing");
		const chart = createCategoryChart(
			container,
			stats,
			document.getElementById("stats-pie-back"),
		);
		window.addEventListener("resize", () => chart.resize());
	}, CATEGORIES);
	await expect(page.locator("#stats-pie svg")).toBeVisible();
}

/** Measure the rendered slices against the chart box and legend. */
async function readChartLayout(
	page: Page,
	expectedSlices: number,
): Promise<{
	fits: boolean;
	legendRows: number;
	ringWidth: number;
}> {
	return page.locator("#stats-pie").evaluate(
		(container, { stats, expectedSlices }) => {
			const svg = container.querySelector("svg");
			if (!svg) throw new Error("Chart SVG is missing");
			const names = new Set([
				...stats.map((row) => row.category_name),
				"Other",
			]);
			const legend = [...svg.querySelectorAll("text")].filter((text) =>
				names.has(text.textContent),
			);
			const slices = [...svg.querySelectorAll("path")].filter((path) => {
				const bounds = path.getBBox();
				return (
					/^#[0-9a-f]{6}$/i.test(path.getAttribute("fill") ?? "") &&
					(bounds.width > 12 || bounds.height > 12)
				);
			});
			const sliceRects = slices.map((path) => path.getBoundingClientRect());
			const box = container.getBoundingClientRect();
			const left = Math.min(...sliceRects.map((rect) => rect.left));
			const right = Math.max(...sliceRects.map((rect) => rect.right));
			const top = Math.min(...sliceRects.map((rect) => rect.top));
			const bottom = Math.max(...sliceRects.map((rect) => rect.bottom));
			const legendTop = Math.min(
				...legend.map((text) => text.getBoundingClientRect().top),
			);
			return {
				fits:
					slices.length === expectedSlices &&
					left >= box.left - 1 &&
					right <= box.right + 1 &&
					top >= box.top - 1 &&
					bottom < legendTop,
				legendRows: new Set(
					legend.map((text) => Math.round(text.getBoundingClientRect().top)),
				).size,
				ringWidth: right - left,
			};
		},
		{ stats: CATEGORIES, expectedSlices },
	);
}

test("category donut fits wrapped legends through resizing and Other drilldown", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await openChart(page);

	const chart = page.locator("#stats-pie");
	const back = page.locator("#stats-pie-back");
	const other = chart.locator('svg path[fill="#8f8d86"]').first();

	await expect(chart.getByText("Other", { exact: true })).toBeVisible();
	await expect(other).toHaveCount(1);
	await expect(back).toBeHidden();
	const narrow = await readChartLayout(page, 8);
	expect(narrow.fits).toBe(true);
	expect(narrow.legendRows).toBeGreaterThan(1);

	await other.click();
	await other.click();
	await expect(back).toBeVisible();
	await expect(
		chart.getByText(CATEGORIES[7].category_name ?? "", { exact: true }),
	).toBeVisible();
	expect((await readChartLayout(page, 2)).fits).toBe(true);
	await back.click();
	await expect(back).toBeHidden();
	await expect(other).toHaveCount(1);

	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(chart).toHaveCSS("width", "520px");
	await expect(other).toHaveCount(1);
	const wide = await readChartLayout(page, 8);
	expect(wide.fits).toBe(true);
	expect(wide.legendRows).toBeLessThan(narrow.legendRows);
	expect(wide.ringWidth).toBeGreaterThan(narrow.ringWidth);

	await other.click();
	await expect(back).toBeVisible();
	expect((await readChartLayout(page, 2)).fits).toBe(true);
	await back.click();
	await expect(other).toHaveCount(1);
});
