import Field from "../forms/field";
import type { WizardStepProps } from "./types";

export default function StepOne({ form }: WizardStepProps) {
	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				<Field
					form={form}
					name="find_description"
					label="Details about what you found"
					as="textarea"
					textareaProps={{
						rows: 5,
						placeholder: "Describe what you saw: estimated amount, size, life stage, condition, notable traits (color/markings, flowers/fruit), and anything else you feel is relevent",
					}}
				/>
			</div>
		</div>
	);
}
