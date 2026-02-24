import type { WizardStepProps } from ".";

export default function StepTwo({ form }: WizardStepProps) {
	function inputClass(field: keyof typeof form.data) {
		if (form.invalid(field)) return "is-invalid";
		if (form.valid(field)) return "is-valid";
		return "";
	}

	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				<label htmlFor="location" className="form-label">
					Location
				</label>
				<input
					type="text"
					id="location"
					className={`form-control ${inputClass("location")}`}
					value={form.data.location}
					onChange={(e) => form.setData("location", e.target.value)}
					placeholder="Describe where you spotted the invasive species"
				/>
				{form.invalid("location") && (
					<div className="invalid-feedback">{form.errors.location}</div>
				)}
			</div>

			<div className="col-12">
				<label htmlFor="description" className="form-label">
					Description
				</label>
				<textarea
					id="description"
					className={`form-control ${inputClass("description")}`}
					value={form.data.description}
					onChange={(e) => form.setData("description", e.target.value)}
					rows={5}
					placeholder="Describe the invasive species you observed"
				/>
				{form.invalid("description") && (
					<div className="invalid-feedback">{form.errors.description}</div>
				)}
			</div>
		</div>
	);
}
