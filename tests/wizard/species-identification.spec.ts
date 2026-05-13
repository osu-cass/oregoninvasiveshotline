import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectComboboxOptionByValue,
} from "./shared";

test.describe("report wizard", () => {
	test("renders all species identification resource variants", async ({
		page,
	}) => {
		await openWizard(page);
		await fillStepOne(page, "Species behavior variant coverage test.");
		await page.getByTestId("wizard-next-button").click();
		await expect(
			page.getByRole("alertdialog", { name: "No photos attached" }),
		).toBeVisible();

		await page.getByTestId("confirm-no-images-continue").click();
		await expectProgress(page, "25");
		await selectComboboxOptionByValue(page, "category", 3);

		await test.step("nothing", async () => {
			await selectComboboxOptionByValue(page, "species", 443);
			await expect(
				page.getByTestId("species-identification-panel"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-link-only"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-resource-link"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-image"),
			).toBeHidden();
		});

		await test.step("link only", async () => {
			await selectComboboxOptionByValue(page, "species", 444);
			await expect(
				page.getByTestId("species-identification-panel"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-link-only"),
			).toBeVisible();
			await expect(
				page.getByTestId("species-identification-image"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-resource-link"),
			).toHaveAttribute("href", "https://example.org/identification/link-only");
		});

		await test.step("image only", async () => {
			await selectComboboxOptionByValue(page, "species", 445);
			await expect(
				page.getByTestId("species-identification-panel"),
			).toBeVisible();
			await expect(
				page.getByTestId("species-identification-link-only"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-resource-link"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-image"),
			).toBeVisible();
			await expect(
				page.getByTestId("species-identification-image"),
			).toHaveAttribute(
				"alt",
				"Close-up of leaves and stem for species verification.",
			);
			await expect(
				page.getByTestId("species-identification-image"),
			).toHaveAttribute(
				"src",
				/identification_images\/species-image-only\.png$/,
			);
		});

		await test.step("image plus link", async () => {
			await selectComboboxOptionByValue(page, "species", 446);
			await expect(
				page.getByTestId("species-identification-panel"),
			).toBeVisible();
			await expect(
				page.getByTestId("species-identification-link-only"),
			).toBeHidden();
			await expect(
				page.getByTestId("species-identification-image"),
			).toBeVisible();
			await expect(
				page.getByTestId("species-identification-image"),
			).toHaveAttribute(
				"src",
				/identification_images\/species-image-and-link\.png$/,
			);
			await expect(
				page.getByTestId("species-identification-resource-link"),
			).toHaveAttribute(
				"href",
				"https://example.org/identification/image-and-link",
			);
		});
	});
});
