import Field from "../../forms/field";
import ImageUpload from "../../forms/images/upload";
import type { WizardStepProps } from "../types";

interface StepOneProps extends WizardStepProps {
	/** Called when the EXIF-based location changes. */
	onExifLocationChange: (location?: google.maps.LatLngLiteral) => void;
	/** Called when the image uploader starts or finishes resizing. */
	onResizingChange?: (resizing: boolean) => void;
}

/** Step 1: Photo upload and description of the find. */
export default function StepOne({
	form,
	onExifLocationChange,
	onResizingChange,
}: StepOneProps) {
	return (
		<div className="row g-3 mt-1">
			<ImageUpload
				images={form.data.images}
				captions={form.data.image_captions}
				onResizingChange={onResizingChange}
				onChange={(images, captions) => {
					form.setData((prev) => ({
						...prev,
						images,
						image_captions: captions,
					}));
					if (images.length === 0) {
						onExifLocationChange(undefined);
					}
				}}
				onExifLocationChange={onExifLocationChange}
				optional
			/>
			<div className="col-12">
				<Field
					form={form}
					name="find_description"
					label="Details about what you found"
					as="textarea"
					textareaProps={{
						rows: 5,
						placeholder:
							"Describe what you saw: estimated amount, size, life stage, condition, notable traits (color/markings, flowers/fruit), and anything else you feel is relevant",
					}}
				/>
			</div>
		</div>
	);
}
