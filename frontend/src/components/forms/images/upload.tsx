import clsx from "clsx";
import { useState } from "react";
import ImageThumb from "./imageThumbnail";
import { resizeImage } from "./resizeImage";

const ACCEPT = "image/*";

interface ImageUploadProps {
	/** Current list of image files. */
	images: File[];
	/** Current list of captions, parallel to images. */
	captions: string[];
	/** Called when the images or captions change. */
	onChange: (images: File[], captions: string[]) => void;
	/** Max number of images allowed. Defaults to 10. */
	maxFiles?: number;
	/** Label text above the drop zone. */
	label?: string;
	/** Shows "(optional)" next to the label. */
	optional?: boolean;
}

/**
 * Drag-and-drop image uploader with client-side resize, thumbnails, and captions.
 * This component is slightly less coupled compared to the other form components,
 * so you'll need to pass in a state and the onchange prop rather than just the form.
 */
export default function ImageUpload({
	images,
	captions,
	onChange,
	maxFiles = 10,
	label = "Images",
	optional,
}: ImageUploadProps) {
	const [dragging, setDragging] = useState(false);
	const [resizing, setResizing] = useState(false);

	const addFiles = async (files: FileList | null) => {
		if (!files) return;

		const incoming = Array.from(files);

		// Note that resizing strips exif data, so if/when we do location based on exif data, that is something to be aware of
		setResizing(true);
		try {
			const resized = await Promise.all(incoming.map(resizeImage));
			const newImages = [...images, ...resized].slice(0, maxFiles);
			const newCaptions = [...captions, ...resized.map(() => "")].slice(
				0,
				maxFiles,
			);
			onChange(newImages, newCaptions);
		} finally {
			setResizing(false);
		}
	};

	return (
		<div>
			{/* Form label. */}
			<label
				className="form-label fw-medium small mb-0"
				htmlFor="file-drop-input"
			>
				{label}
				{optional && (
					<span className="fw-normal ms-1 text-muted">(optional)</span>
				)}
			</label>

			{/* Thumbnails and caption fields. */}
			{images.length > 0 && (
				<div className="d-flex my-2 flex-column gap-2">
					{images.map((file, index) => (
						<ImageThumb
							key={`${file.name}-${file.lastModified}-${index}`}
							file={file}
							caption={captions[index] ?? ""}
							onCaptionChange={(caption) => {
								const next = [...captions];
								next[index] = caption;
								onChange(images, next);
							}}
							onRemove={() =>
								onChange(
									images.filter((_, i) => i !== index),
									captions.filter((_, i) => i !== index),
								)
							}
						/>
					))}
				</div>
			)}

			{/* Drop zone and file input. */}
			{images.length < maxFiles && (
				<label
					htmlFor="file-drop-input"
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={(e) => {
						e.preventDefault();
						setDragging(false);
					}}
					onDrop={(e) => {
						e.preventDefault();
						setDragging(false);
						addFiles(e.dataTransfer.files);
					}}
					className={clsx(
						"d-block rounded-2 border p-4 text-center",
						dragging
							? "border-primary bg-primary bg-opacity-10"
							: "border-dashed",
					)}
					style={{
						cursor: "pointer",
						borderStyle: dragging ? "solid" : "dashed",
					}}
				>
					<i className="bi bi-cloud-arrow-up fs-1 text-muted" />
					<p className="small mb-0 text-muted">
						{resizing
							? "Resizing images…"
							: "Drag & drop images here, or click to browse/take photos"}
					</p>
					<p className="small mb-0 text-muted">
						{images.length} / {maxFiles} images
					</p>
					<input
						type="file"
						id="file-drop-input"
						accept={ACCEPT}
						multiple
						className="d-none"
						onChange={(e) => {
							addFiles(e.target.files);
							e.target.value = "";
						}}
					/>
				</label>
			)}
		</div>
	);
}
