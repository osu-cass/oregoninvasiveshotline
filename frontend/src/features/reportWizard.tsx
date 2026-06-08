import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	getConvertedImages,
	getImageConversionStats,
} from "../components/forms/images/state";
import type { ImageUploadItem } from "../components/forms/images/types";
import { useImageConversionQueue } from "../components/forms/images/useImageConversionQueue";
import ConfirmNoImagesDialog from "../components/wizard/confirmNoImagesDialog";
import {
	allFields,
	initialWizardData,
	Steps,
	type WizardFormData,
} from "../components/wizard/fields";
import ImageConversionDialog from "../components/wizard/imageConversionDialog";
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
	const [showImageConversionDialog, setShowImageConversionDialog] =
		useState(false);
	const [submitAfterImageConversion, setSubmitAfterImageConversion] =
		useState(false);
	const [imageItems, setImageItems] = useState<ImageUploadItem[]>([]);
	const [exifLocation, setExifLocation] = useState<google.maps.LatLngLiteral>();

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
	const imageConversionStats = getImageConversionStats(imageItems);
	const hasImages = imageItems.length > 0;

	/**
	 * Updates selected images and keeps the submitted file list in sync.
	 * @param items - Next selected image item list.
	 */
	const updateImageItems = (items: ImageUploadItem[]) => {
		setImageItems(items);
		form.setData((prev) => ({
			...prev,
			images: getConvertedImages(items),
		}));
	};

	/**
	 * Updates selected images and captions from the upload control.
	 * @param items - Next selected image item list.
	 * @param captions - Next captions aligned to selected images.
	 */
	const updateImageUpload = (items: ImageUploadItem[], captions: string[]) => {
		setImageItems(items);
		form.setData((prev) => ({
			...prev,
			images: getConvertedImages(items),
			image_captions: captions,
		}));
	};

	useImageConversionQueue(imageItems, updateImageItems);

	/** Validates the final step and submits the report. */
	const submitReport = () => {
		if (!currentStep) return;

		form.validate({
			only: currentStep.fields,
			onSuccess: () =>
				form.post("/reports/create-new", {
					// Forces form data to always submit as FormData.
					// See https://inertiajs.com/docs/v2/the-basics/file-uploads.
					forceFormData: true,
				}),
		});
	};

	/** Handles the Submit button click, waiting for image conversion if needed. */
	const requestSubmit = () => {
		if (imageConversionStats.hasErrors) {
			setShowImageConversionDialog(true);
			toast.error(
				"Remove or re-upload any photos that failed to process before submitting.",
			);
			return;
		}

		if (imageConversionStats.pending) {
			setSubmitAfterImageConversion(true);
			setShowImageConversionDialog(true);
			return;
		}

		submitReport();
	};

	useEffect(() => {
		if (!submitAfterImageConversion) return;

		if (imageConversionStats.hasErrors) {
			setSubmitAfterImageConversion(false);
			toast.error(
				"Remove or re-upload any photos that failed to process before submitting.",
			);
			return;
		}

		if (imageConversionStats.pending) return;

		setSubmitAfterImageConversion(false);
		setShowImageConversionDialog(false);
		if (!currentStep) return;

		form.validate({
			only: currentStep.fields,
			onSuccess: () =>
				form.post("/reports/create-new", {
					// Forces form data to always submit as FormData.
					// See https://inertiajs.com/docs/v2/the-basics/file-uploads.
					forceFormData: true,
				}),
		});
	}, [
		submitAfterImageConversion,
		imageConversionStats.pending,
		imageConversionStats.hasErrors,
		currentStep,
		form,
	]);

	return (
		<div className="report-wizard-backdrop flex-grow-1 bg-hotline-green py-4">
			<div className="container flex-grow-1 bg-transparent">
				<div className="row justify-content-center">
					<div className="col-12 col-lg-10 col-md-12 col-xxl-7">
						<h1 className="h3 mb-2 text-center text-white">
							Report an Invader
						</h1>
						<div className="card rounded-4 shadow-md">
							<div className="card-body p-3 p-md-4">
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

								{step >= Steps.length ? (
									<div>
										You reached a page that shouldn't be possible.... please
										refresh.
									</div>
								) : (
									<>
										<h2 className="h6 mb-1">{currentStep.title}</h2>
										<p className="small mb-2 text-muted">
											{currentStep.description}
										</p>

										{step === 0 && (
											<StepOne
												form={form}
												hasImages={hasImages}
												imageItems={imageItems}
												onImageChange={updateImageUpload}
												onExifLocationChange={setExifLocation}
											/>
										)}
										{step === 1 && (
											<StepTwo form={form} items={props.categories} />
										)}
										{step === 2 && (
											<StepThree
												form={form}
												exifLocation={exifLocation}
												hasImages={hasImages}
												googleApiKey={props.google_api_key}
												googleMapId={props.google_map_id}
											/>
										)}
										{step === 3 && <StepFour form={form} />}

										<div className="d-flex justify-content-end mt-4 gap-2">
											{step > 0 && (
												<button
													type="button"
													className="btn btn-secondary"
													data-testid="wizard-back-button"
													style={{ width: "5rem" }}
													onClick={() => setStep((step) => step - 1)}
													disabled={form.processing}
												>
													Back
												</button>
											)}

											{step === Steps.length - 1 ? (
												<button
													type="button"
													className="btn btn-primary px-4"
													data-testid="wizard-submit-button"
													onClick={requestSubmit}
													disabled={form.processing}
												>
													{form.processing ? "Submitting…" : "Submit"}
												</button>
											) : (
												<button
													type="button"
													className="btn btn-primary px-4"
													data-testid="wizard-next-button"
													onClick={() => {
														if (!currentStep) return;

														if (step === 0 && !hasImages) {
															// Validate first, then show the dialog only if validation passes.
															form.validate({
																only: currentStep.fields,
																onSuccess: () => {
																	setExifLocation(undefined);
																	setShowNoImagesDialog(true);
																},
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
										Object.entries(form.errors).filter(
											// @ts-expect-error
											([k]) => !allFields.includes(k),
										).length,
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
					</div>
				</div>
			</div>

			<ConfirmNoImagesDialog
				open={showNoImagesDialog}
				onOpenChange={setShowNoImagesDialog}
				onConfirm={() => {
					setExifLocation(undefined);
					setStep((s) => s + 1);
				}}
			/>
			<ImageConversionDialog
				open={showImageConversionDialog}
				onOpenChange={(open) => {
					if (submitAfterImageConversion && imageConversionStats.pending)
						return;
					setShowImageConversionDialog(open);
				}}
				stats={imageConversionStats}
			/>
		</div>
	);
}
