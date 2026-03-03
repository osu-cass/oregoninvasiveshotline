import FormCombobox from "../forms/combobox";
import Field from "../forms/field";
import type { CategoryWithSpecies, WizardStepProps } from "./types";

/** Step 2: Category and species identification. */
export default function StepTwo({
	form,
	items,
}: WizardStepProps & {
	/** Available categories with their species. */ items: CategoryWithSpecies[];
}) {
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

	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				<FormCombobox
					items={comboboxCategoryItems}
					itemsName="category"
					itemsNamePlural="categories"
					placeholder="Select a category"
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
							label="Mark as unknown"
							inputProps={{
								type: "checkbox",
								onChange: () => {
									form.setData("species", "");
								},
								placeholder:
									"If you're not sure which species it is, mark it as unknown. We recommend entering your best guess even if you're unsure. Choose unknown only if you don’t have any guess as to what it might be.",
							}}
						/>
					</div>
				</>
			)}

			<div className="col-12">
				<Field
					form={form}
					name="identification_process"
					label="How verified this identification"
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
