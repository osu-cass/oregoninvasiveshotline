import { useState } from "react";
import Field from "../forms/field";
import ImageUpload, { type ImageEntry } from "../forms/image-upload";
import type { WizardStepProps } from "./types";

/** Step 1: Photo upload and description of the find. */
export default function StepOne({ form }: WizardStepProps) {
	const [images, setImages] = useState<ImageEntry[]>([]);
	return (
		<div className="row g-3 mt-1">
			<ImageUpload images={images} setImages={setImages} optional />
			<div className="col-12">
				<Field
					form={form}
					name="find_description"
					label="Details about what you found"
					as="textarea"
					textareaProps={{
						rows: 5,
						placeholder:
							"Describe what you saw: estimated amount, size, life stage, condition, notable traits (color/markings, flowers/fruit), and anything else you feel is relevent",
					}}
				/>
			</div>
		</div>
	);
}
