import Field from "../forms/field";
import type { WizardStepProps } from ".";

export default function StepThree({ form }: WizardStepProps) {
	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				<Field
					form={form}
					name="location_description"
					label="Where it was found (site details)"
					as="textarea"
					textareaProps={{
						rows: 4,
						placeholder:
							"Add context for the location, like nearby landmarks or access points, and where in the area it was (ditch, fence line, field edge, along water)",
					}}
				/>
			</div>

			<div className="col-12">
				<Field
					form={form}
					name="location"
					label="Location"
					inputProps={{
						type: "text",
					}}
				/>
			</div>
		</div>
	);
}
