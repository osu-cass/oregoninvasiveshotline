import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectFirstComboboxOption,
	TEST_IMAGE_DSCN0042,
} from "./shared";

test.describe("report wizard", () => {
	test("shows a dialog when current location cannot be retrieved", async ({
		page,
		context,
		browserName,
	}) => {
		const wizard = page.getByRole("main");
		const locationErrorMessage =
			"Unable to retrieve your location. Please allow location access and try again.";

		// Setting geo to null only works in firefox, and clear permissions only works in Safari.
		// (Both works in chrome)
		if (browserName === "firefox") {
			await context.setGeolocation(null);
		} else {
			await context.clearPermissions();
		}

		await openWizard(page);
		await page
			.locator("#file-drop-input")
			.setInputFiles(TEST_IMAGE_DSCN0042.imagePath);
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await fillStepOne(
			page,
			"Single plant near a wetland edge with bright purple blooms.",
		);

		await wizard.getByRole("button", { name: "Next" }).click();
		await selectFirstComboboxOption(page, "category");
		await selectFirstComboboxOption(page, "species");
		await page
			.locator("#identification_process")
			.fill("Matched the flower color, stem shape, and wetland habitat.");
		await wizard.getByRole("button", { name: "Next" }).click();

		await expect(
			wizard.getByRole("button", { name: "From photo" }),
		).toBeVisible();
		await expect(
			page.getByText(`Lat: ${TEST_IMAGE_DSCN0042.latitude}`),
		).toBeVisible();
		await expect(
			page.getByText(`Lng: ${TEST_IMAGE_DSCN0042.longitude}`),
		).toBeVisible();
		await expectProgress(page, "50");

		await wizard.getByRole("button", { name: "Current location" }).click();

		await expect(
			page.getByRole("alertdialog", { name: "Location unavailable" }),
		).toBeVisible();
		await expect(page.getByText(locationErrorMessage)).toBeVisible();
		await page.getByRole("button", { name: "OK" }).click();
		await expect(
			page.getByRole("alertdialog", { name: "Location unavailable" }),
		).toBeHidden();
	});
});
