import FormCombobox from "../forms/combobox";
import Field from "../forms/field";
import type { WizardStepProps } from ".";
import type { CategoryWithSpecies } from "./types";

export default function StepTwo({
	form,
	items,
}: WizardStepProps & { items: CategoryWithSpecies[] }) {
	const comboboxItems = items.map(item => ({
		...item,
		label: item.name,
		value: item.category_id
	}))
	
	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				<FormCombobox items={comboboxItems} itemsName="category" itemsNamePlural="categories" placeholder="Select a category" />
			</div>

			<div className="col-6">
				<Field
					form={form}
					name="species"
					label="Species"
					inputProps={{
						type: "text",
					}}
				/>
			</div>

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
