import { useForm } from "@inertiajs/react";
import { useState } from "react";
import {
	allFields,
	initialWizardData,
	Steps,
	type WizardFormData,
} from "../components/wizard-steps/fields";
import StepFour from "../components/wizard-steps/four";
import StepOne from "../components/wizard-steps/one";
import StepThree from "../components/wizard-steps/three";
import StepTwo from "../components/wizard-steps/two";
import type {
	CategoryWithSpecies,
	ContactInfo,
} from "../components/wizard-steps/types";

interface FormWizardProps {
	user: ContactInfo;
	categories: CategoryWithSpecies[];
}

export default function FormWizard(props: FormWizardProps) {
	const [step, setStep] = useState(1);

	const form = useForm<WizardFormData>({
		...initialWizardData,
		...(props.user && {
			first_name: props.user.first_name ?? "",
			last_name: props.user.last_name ?? "",
			email: props.user.email,
			phone: props.user.phone,
		}),
	})
		.withPrecognition("post", "/reports/create-new")
		.setValidationTimeout(250);
	
	const currentStep = Steps[step];
	const isLastStep = step === Steps.length - 1;
	const isDone = step >= Steps.length;

	return (
		<div className="row justify-content-center">
			<div className="col-12 col-lg-6 col-md-8">
				<div
					className="progress mb-4"
					role="progressbar"
					aria-label="Form progress"
					aria-valuenow={(step / Steps.length) * 100}
					aria-valuemin={0}
					aria-valuemax={100}
					style={{ height: "0.5rem" }}
				>
					<div
						className="progress-bar"
						style={{ width: `${(step / Steps.length) * 100}%` }}
					/>
				</div>

				{isDone ? (
					<div>Submitted!</div>
				) : (
					<>
						{step === 0 && <StepOne form={form} />}
						{step === 1 && <StepTwo form={form} items={props.categories} />}
						{step === 2 && <StepThree form={form} />}
						{step === 3 && <StepFour form={form} />}

						<div className="d-flex justify-content-end mt-4 gap-2">
							{step > 0 && (
								<button
									type="button"
									className="btn btn-secondary px-4"
									style={{ width: "5rem" }}
									onClick={() => setStep((step) => step - 1)}
									disabled={form.processing}
								>
									Back
								</button>
							)}

							{isLastStep ? (
								<button
									type="button"
									className="btn btn-primary px-4"
									onClick={() => {
										if (!currentStep) return;
										form.validate({
											only: currentStep.fields,
											onSuccess: () => form.post("/reports/create-new"),
										});
									}}
									disabled={form.processing}
								>
									{form.processing ? "Submitting…" : "Submit"}
								</button>
							) : (
								<button
									type="button"
									className="btn btn-primary px-4"
									onClick={() => {
										if (!currentStep) return;
										form.validate({
											only: currentStep.fields,
											onSuccess: () => setStep((s) => s + 1),
										});
									}}
									disabled={form.validating}
								>
									{form.validating ? "Validating…" : "Next"}
								</button>
							)}
						</div>
					</>
				)}
				{Boolean(
					// @ts-expect-error
					Object.entries(form.errors).filter(([k]) => !allFields.includes(k))
						.length,
				) && (
					<>
						Debug Errors:{" "}
						{JSON.stringify(
							Object.fromEntries(
								Object.entries(form.errors).filter(
									// @ts-expect-error
									([k]) => !allFields.includes(k),
								),
							),
						)}
					</>
				)}
			</div>
		</div>
	);
}
