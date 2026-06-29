import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectFirstComboboxOption,
} from "./shared";

test.describe("report wizard", () => {
	test("supports the unknown-species path and preserves it when navigating back", async ({
		page,
	}) => {
		const wizard = page.getByRole("main");

		await openWizard(page);
		await fillStepOne(
			page,
			"Single plant near a wetland edge with bright purple blooms.",
		);

		await wizard.getByRole("button", { name: "Next" }).click();
		await expect(
			page.getByRole("alertdialog", { name: "No photos attached" }),
		).toBeVisible();
		await page.getByRole("button", { name: "Continue without photos" }).click();

		await expectProgress(page, "25");
		await selectFirstComboboxOption(page, "category");
		await expect(page.locator("#species")).toBeVisible();

		await page.locator("#is_species_unknown").check();

		await expect(page.locator("#is_species_unknown")).toBeChecked();
		await expect(page.locator("#species")).toBeDisabled();
		await expect(page.locator("#species")).toHaveAttribute(
			"placeholder",
			"You marked this species as unknown",
		);
		await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
		await expectProgress(page, "25");

		await wizard.getByRole("button", { name: "Next" }).click();
		await expect(page.locator("#location_description")).toBeVisible();
		await expectProgress(page, "50");

		await wizard.getByRole("button", { name: "Back" }).click();

		await expect(page.locator("#is_species_unknown")).toBeChecked();
		await expect(page.locator("#species")).toBeDisabled();
		await expectProgress(page, "25");
	});
});
