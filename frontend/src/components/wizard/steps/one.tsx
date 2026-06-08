import Field from "../../forms/field";
import type { ImageUploadItem } from "../../forms/images/types";
import ImageUpload from "../../forms/images/upload";
import type { WizardStepProps } from "../types";

interface StepOneProps extends WizardStepProps {
	/** Current list of selected image items. */
	imageItems: ImageUploadItem[];
	/** Called when selected image items or captions change. */
	onImageChange: (items: ImageUploadItem[], captions: string[]) => void;
	/** Called when the EXIF-based location changes. */
	onExifLocationChange: (location?: google.maps.LatLngLiteral) => void;
}

/** Step 1: Photo upload and description of the find. */
export default function StepOne({
	form,
	imageItems,
	onImageChange,
	onExifLocationChange,
}: StepOneProps) {
	return (
		<div className="row g-3 mt-1">
			<ImageUpload
				items={imageItems}
				captions={form.data.image_captions}
				onChange={(items, captions) => {
					onImageChange(items, captions);
					if (items.length === 0) {
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
