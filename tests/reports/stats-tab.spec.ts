import { expect, type Page, test } from "@playwright/test";
import { INFRA_ENV } from "../shared/infra";
import { run } from "../shared/run";

const LIST_URL = "/reports/list";

// Fixed primary keys make repeated loads across workers idempotent.
test.beforeAll(() => {
	run(
		"docker compose exec -T app /opt/venv/bin/python manage.py loaddata tests/reports/fixtures/stats-reports.json",
		INFRA_ENV,
	);
});

/** Assert the Stats tab is selected and both charts reflect the search. */
async function expectStatsView(
	page: Page,
	{
		total,
		years,
		categoryChart,
	}: {
		total: string;
		years: string[];
		categoryChart: boolean;
	},
): Promise<void> {
	await expect(page).toHaveURL(/[?&]view=stats(&|$)/);
	await expect(page.locator("#list-stats-tab")).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(
		page.locator(".stats-summary-item", { hasText: "Matching reports" }),
	).toContainText(total);
	const yearly = page.locator("#stats-chart");
	await expect(yearly.locator("svg")).toBeVisible();
	for (const year of years) {
		await expect(yearly.getByText(year, { exact: true })).toBeVisible();
	}
	const pie = page.locator("#stats-pie svg");
	if (categoryChart) await expect(pie).toBeVisible();
	else await expect(pie).toHaveCount(0);
}

test("stats tab renders charts and survives sorting and searching", async ({
	page,
}) => {
	await page.goto(LIST_URL);
	await expect(page.locator("#list-map-tab")).toHaveAttribute(
		"aria-selected",
		"true",
	);

	await page.locator("#list-stats-tab").click();
	// The fixture's private report is excluded from anonymous stats.
	await expectStatsView(page, {
		total: "4",
		years: ["2023", "2024", "2025"],
		categoryChart: true,
	});

	await page
		.locator(".reports-table-sort")
		.getByRole("link", { name: "Category" })
		.click();
	await expect(page).toHaveURL(/order_by=category/);
	await expectStatsView(page, {
		total: "4",
		years: ["2023", "2024", "2025"],
		categoryChart: true,
	});

	await page.locator("#id_q").fill("Douglas");
	await page.locator("#id_q").press("Enter");
	await expect(page).toHaveURL(/q=Douglas/);
	await expectStatsView(page, {
		total: "2",
		years: ["2025"],
		categoryChart: false,
	});

	await page.locator("#list-map-tab").click();
	await expect(page).not.toHaveURL(/view=stats/);
});
