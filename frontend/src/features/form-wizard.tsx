import { useForm } from "@inertiajs/react";
import { useAtom } from "jotai";
import {
	initialWizardData,
	Steps,
	type WizardFormData,
} from "../components/wizard-steps";
import { stepAtom } from "../components/wizard-steps/atoms";

export default function FormWizard() {
	const [step, setStep] = useAtom(stepAtom);

	const form = useForm<WizardFormData>(initialWizardData).withPrecognition(
		"post",
		"/reports/create-new",
	);

	const currentStep = Steps[step];
	const isLastStep = step === Steps.length - 1;
	const isDone = step >= Steps.length;

	function handleNext() {
		if (!currentStep) return;
		form.validate({
			only: currentStep.fields,
			onSuccess: () => setStep((s) => s + 1),
		});
	}

	function handleSubmit() {
		form.post("/reports/create-new");
	}

	const Component = currentStep?.component;

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
						{Component && <Component form={form} />}

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
									onClick={handleSubmit}
									disabled={form.processing}
								>
									{form.processing ? "Submitting…" : "Submit"}
								</button>
							) : (
								<button
									type="button"
									className="btn btn-primary px-4"
									onClick={handleNext}
									disabled={form.validating}
								>
									{form.validating ? "Validating…" : "Next"}
								</button>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
