import { Collapsible } from "@base-ui/react";
import { useState } from "react";
import FormCombobox from "../../forms/combobox";
import Field from "../../forms/field";
import type { CategoryWithSpecies, WizardStepProps } from "../types";

interface StepTwoProps extends WizardStepProps {
	/** Available categories with their species. */
	items: CategoryWithSpecies[];
}

/** Step 2: Category and species identification. */
export default function StepTwo({ form, items }: StepTwoProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const comboboxCategoryItems = items.map((item) => ({
		...item,
		label: item.name,
		value: item.category_id,
	}));

	const comboboxSpeciesItems = items
		.find((item) => item.category_id === Number(form.data.category))
		?.species?.map((item) => ({
			...item,
			label: item.name,
			value: item.species_id,
		}));

	const selectedSpecies = comboboxSpeciesItems?.find(
		(item) => item.value === Number(form.data.species),
	);

	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				<FormCombobox
					items={comboboxCategoryItems}
					itemsName="category"
					itemsNamePlural="categories"
					placeholder="What category best describes this invasive?"
					form={form}
					onChange={() => {
						form.setData("species", "");
					}}
					name="category"
				/>
			</div>

			{comboboxSpeciesItems && (
				<>
					<div className="col-12">
						<FormCombobox
							form={form}
							items={comboboxSpeciesItems}
							name="species"
							itemsName="species"
							itemsNamePlural="species"
							disabled={form.data.is_species_unknown === "true"}
							placeholder={
								form.data.is_species_unknown === "true"
									? "You marked this species as unknown"
									: "Select a species"
							}
						/>
					</div>
					<div className="col-12">
						<Field
							form={form}
							name="is_species_unknown"
							label="Mark species as unknown"
							inputProps={{
								type: "checkbox",
								onChange: () => {
									form.setData("species", "");
								},
								placeholder:
									"Make your best guess above, even if you're uncertain. Only check this box if you truly have no idea.",
							}}
						/>
					</div>
				</>
			)}

			{selectedSpecies?.identification_image && (
				<Collapsible.Root defaultOpen>
					<Collapsible.Trigger
						className="d-flex justify-content-between w-100 rounded border p-1 px-3 py-2"
						render={(props, state) => (
							<button
								{...props}
								className="d-flex justify-content-between w-100 rounded border p-1 px-3 py-2"
							>
								<p className="fw-medium small mb-0 text-start">
									Confirm Species Using Common Identifiers
								</p>
								<i
									className={`bi ${state.open ? "bi-chevron-up" : "bi-chevron-down"} fs-6`}
								/>
							</button>
						)}
					/>
					<Collapsible.Panel
						className="border border-top-0 p-3"
						style={{
							borderBottomLeftRadius: "var(--bs-border-radius)",
							borderBottomRightRadius: "var(--bs-border-radius)",
							marginTop: "-0.5rem",
						}}
					>
						<p className="small mt-1">
							Optionally refer to the identifiers below to verify your selected
							species matches what you're seeing.{" "}
							{selectedSpecies.identification_external_resource_link && (
								<span>
									For more details,{" "}
									<a
										href={selectedSpecies.identification_external_resource_link}
										target="_blank"
										rel="noopener"
									>
										click here
									</a>{" "}
									to see a full identification guide.
								</span>
							)}
						</p>
						{selectedSpecies.identification_image && (
							<img
								src={selectedSpecies.identification_image}
								alt={
									selectedSpecies.identification_image_alt ||
									"An image representing common species identifiers"
								}
								className="w-100"
							/>
						)}
					</Collapsible.Panel>
				</Collapsible.Root>
			)}

			{selectedSpecies?.identification_external_resource_link &&
				!selectedSpecies.identification_image && (
					<p className="small mt-1">
						To identify this species,{" "}
						<a
							href={selectedSpecies.identification_external_resource_link}
							target="_blank"
							rel="noopener"
						>
							click here
						</a>{" "}
						to learn more about verifying your selected species.
					</p>
				)}

			<div className="col-12">
				<Field
					form={form}
					name="identification_process"
					label="How did you verify this identification?"
					optional
					as="textarea"
					textareaProps={{
						rows: 5,
						placeholder:
							"Describe how you identified this species (markings/size/behavior, tracks/sign, leaf/flower/fruit)",
					}}
				/>
			</div>
		</div>
	);
}
