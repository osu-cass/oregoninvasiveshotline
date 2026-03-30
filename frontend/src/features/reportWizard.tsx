import { useForm } from "@inertiajs/react";
import { useState } from "react";
import ConfirmNoImagesDialog from "../components/wizard/confirmNoImagesDialog";
import {
	allFields,
	initialWizardData,
	Steps,
	type WizardFormData,
} from "../components/wizard/fields";
import StepFour from "../components/wizard/steps/four";
import StepOne from "../components/wizard/steps/one";
import StepThree from "../components/wizard/steps/three";
import StepTwo from "../components/wizard/steps/two";
import type {
	CategoryWithSpecies,
	ContactInfo,
} from "../components/wizard/types";

interface FormWizardProps {
	/** Logged-in user's contact info, pre-fills step 4. */
	user: ContactInfo;
	/** Category + species tree from the backend. */
	categories: CategoryWithSpecies[];
	/** Google Maps API key for location step. */
	google_api_key?: string;
	/** Google Map ID for advanced marker support. */
	google_map_id?: string;
}

/** Multi-step report form with progress bar and per-step validation. */
export default function FormWizard(props: FormWizardProps) {
	const [step, setStep] = useState(0);
	const [showNoImagesDialog, setShowNoImagesDialog] = useState(false);

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

	/** Handles the Next button click, prompting if step one has no images. */

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
						{step === 2 && (
							<StepThree
								form={form}
								googleApiKey={props.google_api_key}
								googleMapId={props.google_map_id}
							/>
						)}
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
											onSuccess: () =>
												form.post("/reports/create-new", {
													// Forces form data to be always submitted as a formdata object for consistancy.
													// see https://inertiajs.com/docs/v2/the-basics/file-uploads
													forceFormData: true,
												}),
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

										if (step === 0 && form.data.images.length === 0) {
											// Validate first, then show the dialog only if validation passes.
											form.validate({
												only: currentStep.fields,
												onSuccess: () => setShowNoImagesDialog(true),
											});
											return;
										}

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
				{/* Shows errors not used by a specific field. In theory should never show up if everything is working properly */}
				{import.meta.env.DEV &&
					Boolean(
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

			<ConfirmNoImagesDialog
				open={showNoImagesDialog}
				onOpenChange={setShowNoImagesDialog}
				onConfirm={() => setStep((s) => s + 1)}
			/>
		</div>
	);
}
