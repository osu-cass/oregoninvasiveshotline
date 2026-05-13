import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectFirstComboboxOption,
	TEST_COORDS,
	TEST_IMAGE_DSCN0010,
	TEST_IMAGE_DSCN0042,
} from "./shared";

test.describe("report wizard", () => {
	test("uses photo EXIF data for the initial location", async ({ page }) => {
		const wizard = page.getByRole("main");

		await openWizard(page);
		await page
			.locator("#file-drop-input")
			.setInputFiles(TEST_IMAGE_DSCN0042.imagePath);
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await expect(
			page.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0042.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			}),
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

		await expect(
			page.getByRole("button", { name: "From photo" }),
		).toBeVisible();
		await expect(
			page.getByText(`Lat: ${TEST_IMAGE_DSCN0042.latitude}`),
		).toBeVisible();
		await expect(
			page.getByText(`Lng: ${TEST_IMAGE_DSCN0042.longitude}`),
		).toBeVisible();
		await expectProgress(page, "50");
		await expect(
			page.getByRole("button", { name: "From photo" }),
		).toBeVisible();

		await wizard.getByRole("button", { name: "Current location" }).click();
		await expect(page.getByText(`Lat: ${TEST_COORDS.latitude}`)).toBeVisible();
		await expect(page.getByText(`Lng: ${TEST_COORDS.longitude}`)).toBeVisible();

		await wizard.getByRole("button", { name: "From photo" }).click();
		await expect(
			page.getByText(`Lat: ${TEST_IMAGE_DSCN0042.latitude}`),
		).toBeVisible();
		await expect(
			page.getByText(`Lng: ${TEST_IMAGE_DSCN0042.longitude}`),
		).toBeVisible();
	});

	test("switches and clears the EXIF location when images are removed", async ({
		page,
	}) => {
		const wizard = page.getByRole("main");

		await openWizard(page);
		await page
			.locator("#file-drop-input")
			.setInputFiles([
				TEST_IMAGE_DSCN0042.imagePath,
				TEST_IMAGE_DSCN0010.imagePath,
			]);
		await expect(page.getByText("2 / 10 images")).toBeVisible();
		await expect(
			page.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0042.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			}),
		).toBeVisible();
		await expect(
			page.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0010.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			}),
		).toBeVisible();

		await page
			.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0042.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			})
			.click();
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await expect(
			page.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0042.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			}),
		).toHaveCount(0);
		await expect(
			page.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0010.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			}),
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

		await expect(
			page.getByRole("button", { name: "Current location" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "From photo" }),
		).toBeVisible();
		await expect(
			page.getByText(`Lat: ${TEST_IMAGE_DSCN0010.latitude}`),
		).toBeVisible();
		await expect(
			page.getByText(`Lng: ${TEST_IMAGE_DSCN0010.longitude}`),
		).toBeVisible();
		await expectProgress(page, "50");

		await wizard.getByRole("button", { name: "Back" }).click();
		await wizard.getByRole("button", { name: "Back" }).click();
		await expect(page.getByText("1 / 10 images")).toBeVisible();
		await page
			.getByRole("button", {
				name: new RegExp(
					`Remove .*${TEST_IMAGE_DSCN0010.imageName.replaceAll(".", "\\.")}`,
					"i",
				),
			})
			.click();
		await expect(page.getByText("0 / 10 images")).toBeVisible();
		await expect(page.getByRole("button", { name: /Remove /i })).toHaveCount(0);

		await wizard.getByRole("button", { name: "Next" }).click();
		await expect(page.getByText("No photos attached")).toBeVisible();
		await page.getByRole("button", { name: "Continue without photos" }).click();

		await wizard.getByRole("button", { name: "Next" }).click();

		await expect(
			page.getByRole("button", { name: "Current location" }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: "From photo" })).toHaveCount(
			0,
		);
		await expect(page.getByText(`Lat: ${TEST_COORDS.latitude}`)).toBeVisible();
		await expect(page.getByText(`Lng: ${TEST_COORDS.longitude}`)).toBeVisible();
		await expectProgress(page, "50");
	});
});
