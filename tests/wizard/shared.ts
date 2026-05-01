import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

export const WIZARD_URL = "/reports/create-new";
export const TEST_IMAGE_PATH = path.resolve(
	process.cwd(),
	"oregoninvasiveshotline",
	"test_assets",
	"fsm.png",
);
export const TEST_EXIF_IMAGE_PATH = path.resolve(
	process.cwd(),
	"oregoninvasiveshotline",
	"test_assets",
	"DSCN0042.jpg",
);
export const TEST_EXIF_IMAGE_PATH_2 = path.resolve(
	process.cwd(),
	"oregoninvasiveshotline",
	"test_assets",
	"DSCN0010.jpg",
);
export const TEST_COORDS = {
	latitude: 45.523064,
	longitude: -122.676483,
};

test.use({
	geolocation: TEST_COORDS,
	permissions: ["geolocation"],
});

/**
 * Returns the wizard progressbar locator.
 * @param page - Playwright page instance.
 */
export function progressbar(page: Page) {
	return page.locator('[role="progressbar"]').first();
}

/**
 * Asserts the progressbar percentage for the current step.
 * @param page - Playwright page instance.
 * @param value - Expected progress percentage value.
 */
export async function expectProgress(
	page: Page,
	value: "0" | "25" | "50" | "75",
) {
	await expect(progressbar(page)).toHaveAttribute("aria-valuenow", value);
}

/**
 * Opens the report wizard page and waits for initial DOM content.
 * @param page - Playwright page instance.
 */
export async function openWizard(page: Page) {
	await page.goto(WIZARD_URL, { waitUntil: "domcontentloaded" });
}

/**
 * Fills the step-one description textarea and verifies the value.
 * @param page - Playwright page instance.
 * @param description - Description text to enter.
 */
export async function fillStepOne(page: Page, description: string) {
	await page.locator("#find_description").fill(description);
	await expect(page.locator("#find_description")).toHaveValue(description);
}

/**
 * Opens a combobox and selects its first available option.
 * @param page - Playwright page instance.
 * @param id - Combobox field id to interact with.
 */
export async function selectFirstComboboxOption(
	page: Page,
	id: "category" | "species",
) {
	const input = page.locator(`#${id}`);

	await input.click();
	await input.press("ArrowDown");

	const option = page.getByRole("option").first();
	await expect(option).toBeVisible();
	await option.click();

	await expect(input).not.toHaveValue("");
}
