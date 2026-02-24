import Field from "../forms/field";
import type { WizardStepProps } from ".";

export default function StepOne({ form }: WizardStepProps) {
	function inputClass(field: keyof typeof form.data) {
		if (form.invalid(field)) return "form-control is-invalid";
		if (form.valid(field)) return "form-control is-valid";
		return "form-control";
	}

	return (
		<div className="row g-3 mt-1">
			<div className="col-6">
				<Field id="first_name" label="First Name">
					<input
						type="text"
						id="first_name"
						className={inputClass("first_name")}
						value={form.data.first_name}
						onChange={(e) => form.setData("first_name", e.target.value)}
					/>
					{form.invalid("first_name") && (
						<div className="invalid-feedback">{form.errors.first_name}</div>
					)}
				</Field>
			</div>

			<div className="col-6">
				<Field id="last_name" label="Last Name">
					<input
						type="text"
						id="last_name"
						className={inputClass("last_name")}
						value={form.data.last_name}
						onChange={(e) => form.setData("last_name", e.target.value)}
					/>
					{form.invalid("last_name") && (
						<div className="invalid-feedback">{form.errors.last_name}</div>
					)}
				</Field>
			</div>

			<div className="col-12">
				<Field id="email" label="Email">
					<input
						type="email"
						id="email"
						className={inputClass("email")}
						value={form.data.email}
						onChange={(e) => form.setData("email", e.target.value)}
					/>
					{form.invalid("email") && (
						<div className="invalid-feedback">{form.errors.email}</div>
					)}
				</Field>
			</div>

			<div className="col-12">
				<Field id="phone" label="Phone" optional>
					<input
						type="tel"
						id="phone"
						className={inputClass("phone")}
						value={form.data.phone}
						onChange={(e) => form.setData("phone", e.target.value)}
					/>
					{form.invalid("phone") && (
						<div className="invalid-feedback">{form.errors.phone}</div>
					)}
				</Field>
			</div>
		</div>
	);
}
