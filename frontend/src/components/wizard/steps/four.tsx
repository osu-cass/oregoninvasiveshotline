import Field from "../../forms/field";
import type { WizardStepProps } from "../types";

/** Step 4: Reporter contact info and optional questions. */
export default function StepFour({ form }: WizardStepProps) {
	return (
		<div className="row g-3 mt-1">
			<div className="col-6">
				<Field
					form={form}
					name="first_name"
					label="First Name"
					inputProps={{
						type: "text",
					}}
				/>
			</div>

			<div className="col-6">
				<Field
					form={form}
					name="last_name"
					label="Last Name"
					inputProps={{
						type: "text",
					}}
				/>
			</div>

			<div className="col-12">
				<Field
					form={form}
					name="email"
					label="Email"
					inputProps={{
						type: "email",
					}}
				/>
			</div>

			<div className="col-12">
				<Field
					form={form}
					name="phone"
					label="Phone"
					optional
					inputProps={{
						type: "tel",
					}}
				/>
			</div>

			<div className="col-12">
				<Field
					form={form}
					name="questions"
					label="Questions for the experts"
					optional
					as="textarea"
					textareaProps={{
						rows: 4,
						placeholder:
							"Is there anything else you'd like advice on? For example: next steps, safe removal/containment, preventing spread, or what to keep an eye out for nearby",
					}}
				/>
			</div>
		</div>
	);
}
