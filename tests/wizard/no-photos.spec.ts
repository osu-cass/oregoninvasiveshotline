import { expect, test } from "@playwright/test";
import { expectProgress, fillStepOne, openWizard } from "./shared";

test.describe("report wizard", () => {
	test("requires explicit confirmation before continuing without photos", async ({
		page,
	}) => {
		const wizard = page.getByRole("main");

		await openWizard(page);
		await fillStepOne(
			page,
			"Dense patch along the ditch line with purple flowers and seed heads.",
		);

		await wizard.getByRole("button", { name: "Next" }).click();

		await expect(
			page.getByRole("alertdialog", { name: "No photos attached" }),
		).toBeVisible();
		await expect(wizard.getByRole("button", { name: "Back" })).toBeHidden();
		await expect(page.locator("#category")).toBeHidden();
		await expectProgress(page, "0");

		await page.getByRole("button", { name: "Go back" }).click();

		await expect(page.locator("#find_description")).toHaveValue(
			"Dense patch along the ditch line with purple flowers and seed heads.",
		);
		await expectProgress(page, "0");

		await wizard.getByRole("button", { name: "Next" }).click();
		await page.getByRole("button", { name: "Continue without photos" }).click();

		await expect(page.locator("#category")).toBeVisible();
		await expectProgress(page, "25");
	});
});
