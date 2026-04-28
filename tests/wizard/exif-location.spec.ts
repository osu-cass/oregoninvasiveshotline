import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectFirstComboboxOption,
	TEST_EXIF_IMAGE_PATH,
} from "./shared";

test.describe("report wizard", () => {
	test("uses photo EXIF data for the initial location", async ({ page }) => {
		const wizard = page.getByRole("main");

		await openWizard(page);
		await page.locator("#file-drop-input").setInputFiles(TEST_EXIF_IMAGE_PATH);
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Remove .*DSCN0042\.jpg/i }),
		).toBeVisible();
		await fillStepOne(
			page,
			"Single plant near a wetland edge with bright purple blooms.",
		);

		await wizard.getByRole("button", { name: "Next" }).click();
		await expect(page.locator("#category")).toBeVisible();

		await selectFirstComboboxOption(page, "category");
		await selectFirstComboboxOption(page, "species");
		await page
			.locator("#identification_process")
			.fill("Matched the flower color, stem shape, and wetland habitat.");

		await wizard.getByRole("button", { name: "Next" }).click();

		await expect(page.getByRole("button", { name: "From photo" })).toBeVisible();
		await expect(page.getByText("Lat: 43.464455")).toBeVisible();
		await expect(page.getByText("Lng: 11.881478")).toBeVisible();
		await expectProgress(page, "50");
		await expect(page.getByRole("button", { name: "From photo" })).toBeVisible();

		await wizard.getByRole("button", { name: "Current location" }).click();
		await expect(page.getByText("Lat: 45.523064")).toBeVisible();
		await expect(page.getByText("Lng: -122.676483")).toBeVisible();

		await wizard.getByRole("button", { name: "From photo" }).click();
		await expect(page.getByText("Lat: 43.464455")).toBeVisible();
		await expect(page.getByText("Lng: 11.881478")).toBeVisible();
	});
});
