import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectFirstComboboxOption,
	TEST_EXIF_IMAGE_PATH,
	TEST_EXIF_IMAGE_PATH_2,
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

	test("switches and clears the EXIF location when images are removed", async ({
		page,
	}) => {
		const wizard = page.getByRole("main");

		await openWizard(page);
		await page.locator("#file-drop-input").setInputFiles([
			TEST_EXIF_IMAGE_PATH,
			TEST_EXIF_IMAGE_PATH_2,
		]);
		await expect(page.getByText("2 / 10 images")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Remove .*DSCN0042\.jpg/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Remove .*DSCN0010\.jpg/i }),
		).toBeVisible();

		await page
			.getByRole("button", { name: /Remove .*DSCN0042\.jpg/i })
			.click();
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Remove .*DSCN0042\.jpg/i }),
		).toHaveCount(0);
		await expect(
			page.getByRole("button", { name: /Remove .*DSCN0010\.jpg/i }),
		).toBeVisible();

		await page
			.getByRole("button", { name: /Remove .*DSCN0010\.jpg/i })
			.click();
		await expect(page.getByText("0 / 10 images")).toBeVisible();
		await expect(page.getByRole("button", { name: /Remove /i })).toHaveCount(0);

		await fillStepOne(
			page,
			"Single plant near a wetland edge with bright purple blooms.",
		);
		await wizard.getByRole("button", { name: "Next" }).click();
		await expect(page.getByText("No photos attached")).toBeVisible();
		await page.getByRole("button", { name: "Continue without photos" }).click();

		await selectFirstComboboxOption(page, "category");
		await selectFirstComboboxOption(page, "species");
		await page
			.locator("#identification_process")
			.fill("Matched the flower color, stem shape, and wetland habitat.");
		await wizard.getByRole("button", { name: "Next" }).click();

		await expect(page.getByRole("button", { name: "Current location" })).toBeVisible();
		await expect(page.getByRole("button", { name: "From photo" })).toHaveCount(0);
		await expect(page.getByText("Lat: 45.523064")).toBeVisible();
		await expect(page.getByText("Lng: -122.676483")).toBeVisible();

		await wizard.getByRole("button", { name: "Back" }).click();
		await wizard.getByRole("button", { name: "Back" }).click();
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await page
			.getByRole("button", { name: /Remove .*DSCN0010\.jpg/i })
			.click();
		await expect(page.getByText("0 / 10 images")).toBeVisible();
		await expect(page.getByRole("button", { name: /Remove /i })).toHaveCount(0);

		await wizard.getByRole("button", { name: "Next" }).click();
		await expect(page.getByText("No photos attached")).toBeVisible();
		await page.getByRole("button", { name: "Continue without photos" }).click();

		await wizard.getByRole("button", { name: "Next" }).click();

		await expect(page.getByRole("button", { name: "Current location" })).toBeVisible();
		await expect(page.getByRole("button", { name: "From photo" })).toHaveCount(0);
		await expect(page.getByText("Lat: 45.523064")).toBeVisible();
		await expect(page.getByText("Lng: -122.676483")).toBeVisible();
	});
});
