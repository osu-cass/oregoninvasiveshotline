import { expect, test } from "@playwright/test";
import {
	expectProgress,
	fillStepOne,
	openWizard,
	selectFirstComboboxOption,
	TEST_COORDS,
	TEST_IMAGE_PATH,
} from "./shared";

test.use({
	geolocation: TEST_COORDS,
	permissions: ["geolocation"],
});

test.describe("report wizard", () => {
	test("completes the full wizard with strong field and button assertions", async ({
		page,
	}) => {
		const wizard = page.getByRole("main");

		await test.step("shows the full initial step 1 state", async () => {
			await openWizard(page);

			await expect(page.locator("#file-drop-input")).toBeAttached();
			await expect(page.getByText("0 / 10 images")).toBeVisible();
			await expect(page.locator("#find_description")).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeHidden();
			await expect(wizard.getByRole("button", { name: "Submit" })).toBeHidden();
			await expect(page.locator("#category")).toBeHidden();
			await expect(page.locator("#species")).toBeHidden();
			await expect(page.locator("#location_description")).toBeHidden();
			await expect(page.locator("#first_name")).toBeHidden();
			await expect(
				page.getByRole("alertdialog", { name: "No photos attached" }),
			).toBeHidden();
			await expectProgress(page, "0");
		});

		await test.step("blocks advancing when the required description is empty", async () => {
			await wizard.getByRole("button", { name: "Next" }).click();

			await expect(page.getByText("This field is required.")).toBeVisible();
			await expect(page.locator("#find_description")).toBeEmpty();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeHidden();
			await expectProgress(page, "0");
		});

		await test.step("uploads an image and enters step 2 with the right controls", async () => {
			await page.locator("#file-drop-input").setInputFiles(TEST_IMAGE_PATH);
			await expect(page.getByText("1 / 10 images")).toBeVisible();
			await expect(
				page.getByRole("button", { name: /Remove .*fsm\.png/i }),
			).toBeVisible();
			await expect(page.getByPlaceholder("Caption (optional)")).toBeVisible();

			await fillStepOne(
				page,
				"Several flowering stems clustered along the water with visible seed heads.",
			);

			await wizard.getByRole("button", { name: "Next" }).click();

			await expect(page.locator("#category")).toBeVisible();
			await expect(page.locator("#identification_process")).toBeVisible();
			await expect(page.locator("#species")).toBeHidden();
			await expect(page.locator("#is_species_unknown")).toBeHidden();
			await expect(page.locator("#find_description")).toBeHidden();
			await expect(page.locator("#location_description")).toBeHidden();
			await expect(page.locator("#first_name")).toBeHidden();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Submit" })).toBeHidden();
			await expect(page.locator("#category")).toHaveValue("");
			await expect(page.locator("#identification_process")).toHaveValue("");
			await expectProgress(page, "25");
		});

		await test.step("keeps photo and description data when returning to step 1", async () => {
			await wizard.getByRole("button", { name: "Back" }).click();

			await expect(page.getByText("1 / 10 images")).toBeVisible();
			await expect(
				page.getByRole("button", { name: /Remove .*fsm\.png/i }),
			).toBeVisible();
			await expect(page.locator("#find_description")).toHaveValue(
				"Several flowering stems clustered along the water with visible seed heads.",
			);
			await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeHidden();
			await expect(wizard.getByRole("button", { name: "Submit" })).toBeHidden();
			await expectProgress(page, "0");

			await wizard.getByRole("button", { name: "Next" }).click();
			await expectProgress(page, "25");
		});

		await test.step("validates identification fields and keeps next available", async () => {
			await wizard.getByRole("button", { name: "Next" }).click();

			await expect(page.getByText("This field is required.")).toBeVisible();
			await expect(page.locator("#category")).toHaveAttribute(
				"aria-invalid",
				"true",
			);
			await expectProgress(page, "25");

			await selectFirstComboboxOption(page, "category");
			await expect(page.locator("#species")).toBeVisible();
			await expect(page.locator("#is_species_unknown")).toBeVisible();
			await expect(page.locator("#species")).toHaveValue("");
			await expectProgress(page, "25");

			await wizard.getByRole("button", { name: "Next" }).click();
			await expect(
				page.getByText(
					"Either choose a species or check the 'Mark as unknown' option.",
				),
			).toBeVisible();
			await expect(
				page.getByText(
					"Either check the 'Mark as unknown' option or choose a species.",
				),
			).toBeVisible();
			await expectProgress(page, "25");

			await selectFirstComboboxOption(page, "species");
			await page
				.locator("#identification_process")
				.fill("Matched the flower color, stem shape, and wetland habitat.");
			await expect(page.locator("#identification_process")).toHaveValue(
				"Matched the flower color, stem shape, and wetland habitat.",
			);
			await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
			await expectProgress(page, "25");
		});

		await test.step("shows the full location step state and advances to contact info", async () => {
			await wizard.getByRole("button", { name: "Next" }).click();

			await expect(page.locator("#location_description")).toBeVisible();
			await expect(page.locator("#location_description")).toBeEmpty();
			await expect(
				wizard.getByRole("button", { name: "Current location" }),
			).toBeVisible();
			await expect(
				wizard.getByRole("button", { name: "Current location" }),
			).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Submit" })).toBeHidden();
			await expect(page.locator("#find_description")).toBeHidden();
			await expect(page.locator("#category")).toBeHidden();
			await expect(page.locator("#species")).toBeHidden();
			await expect(page.locator("#first_name")).toBeHidden();
			await expect(page.getByText(/^Lat:/)).toBeVisible();
			await expect(page.getByText(/^Lng:/)).toBeVisible();
			await expectProgress(page, "50");

			await page
				.locator("#location_description")
				.fill(
					"At the south edge of the pond near the walking path and boardwalk.",
				);
			await expect(page.locator("#location_description")).toHaveValue(
				"At the south edge of the pond near the walking path and boardwalk.",
			);

			await wizard.getByRole("button", { name: "Current location" }).click();
			await expect(
				page.getByText(`Lat: ${TEST_COORDS.latitude}`),
			).toBeVisible();
			await expect(
				page.getByText(`Lng: ${TEST_COORDS.longitude}`),
			).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeEnabled();
			await expectProgress(page, "50");

			await wizard.getByRole("button", { name: "Next" }).click();

			await expect(page.locator("#first_name")).toBeVisible();
			await expect(page.locator("#last_name")).toBeVisible();
			await expect(page.locator("#email")).toBeVisible();
			await expect(page.locator("#phone")).toBeVisible();
			await expect(page.locator("#questions")).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeVisible();
			await expect(wizard.getByRole("button", { name: "Back" })).toBeEnabled();
			await expect(
				wizard.getByRole("button", { name: "Submit" }),
			).toBeVisible();
			await expect(
				wizard.getByRole("button", { name: "Submit" }),
			).toBeEnabled();
			await expect(wizard.getByRole("button", { name: "Next" })).toBeHidden();
			await expect(page.locator("#find_description")).toBeHidden();
			await expect(page.locator("#category")).toBeHidden();
			await expect(page.locator("#location_description")).toBeHidden();
			await expectProgress(page, "75");
		});

		await test.step("validates required contact fields and submits successfully", async () => {
			await expect(page.locator("#first_name")).toHaveValue("");
			await expect(page.locator("#last_name")).toHaveValue("");
			await expect(page.locator("#email")).toHaveValue("");
			await expect(page.locator("#phone")).toHaveValue("");
			await expect(page.locator("#questions")).toHaveValue("");

			await wizard.getByRole("button", { name: "Submit" }).click();
			await expect(page.locator("#first_name-error")).toHaveText(
				"This field is required.",
			);
			await expect(page.locator("#last_name-error")).toHaveText(
				"This field is required.",
			);
			await expect(page.locator("#email-error")).toHaveText(
				"This field is required.",
			);
			await expect(page.locator("#first_name")).toHaveAttribute(
				"aria-invalid",
				"true",
			);
			await expect(page.locator("#last_name")).toHaveAttribute(
				"aria-invalid",
				"true",
			);
			await expect(page.locator("#email")).toHaveAttribute(
				"aria-invalid",
				"true",
			);
			await expect(
				wizard.getByRole("button", { name: "Submit" }),
			).toBeEnabled();
			await expectProgress(page, "75");

			await page.locator("#first_name").fill("Playwright");
			await page.locator("#last_name").fill("Tester");
			await page.locator("#email").fill("playwright@example.com");
			await page.locator("#phone").fill("503-555-0100");
			await page
				.locator("#questions")
				.fill("Should this patch be removed before it goes to seed?");

			await expect(page.locator("#first_name")).toHaveValue("Playwright");
			await expect(page.locator("#last_name")).toHaveValue("Tester");
			await expect(page.locator("#email")).toHaveValue(
				"playwright@example.com",
			);
			await expect(page.locator("#phone")).toHaveValue("503-555-0100");
			await expect(page.locator("#questions")).toHaveValue(
				"Should this patch be removed before it goes to seed?",
			);

			await wizard.getByRole("button", { name: "Submit" }).click();

			await page.waitForURL(/\/reports\/detail\/\d+\/?$/, {
				waitUntil: "commit",
			});
			await expect(
				page.getByText("Report submitted successfully"),
			).toBeVisible();
			await expect(page.getByText("Public Login")).toHaveCount(0);
		});
	});
});
