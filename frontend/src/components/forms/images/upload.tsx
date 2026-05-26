import clsx from "clsx";
import ExifReader from "exifreader";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
	/** Called when the EXIF-based location changes. */
	onExifLocationChange: (location?: google.maps.LatLngLiteral) => void;
	/** Called when image resizing starts or finishes. */
	onResizingChange?: (resizing: boolean) => void;
	/** Max number of images allowed. Defaults to 10. */
	maxFiles?: number;
	/** Label text above the drop zone. */
	label?: string;
	/** Shows "(optional)" next to the label. */
	optional?: boolean;
}

/**
 * Builds a stable key for an image file in the current form state.
 * @param file - Image file to key.
 */
function getImageKey(file: File) {
	return `${file.name}-${file.lastModified}` as const;
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
	onExifLocationChange,
	onResizingChange,
	maxFiles = 10,
	label = "Images",
	optional,
}: ImageUploadProps) {
	const [dragging, setDragging] = useState(false);
	const [resizing, setResizing] = useState(false);
	// Key should be `${file.name}-${file.lastModified}` to avoid collisions as much as possible without using the actual file/hash.
	const imageLocations = useMemo(
		() => new Map<`${string}-${string}`, google.maps.LatLngLiteral>(),
		[],
	);
	const locationVersion = useRef(0);

	/**
	 * Updates the shared EXIF location from the first uploaded image with GPS data.
	 * @param orderedImages - Image list in current upload order.
	 */
	const syncExifLocation = (orderedImages: File[]) => {
		const firstLocation = orderedImages
			.map((file) => imageLocations.get(getImageKey(file)))
			.find((location) => location != null);
		onExifLocationChange(firstLocation);
	};

	const nextLocationVersion = () => {
		locationVersion.current += 1;
		return locationVersion.current;
	};

	const addFiles = async (files: FileList | null) => {
		if (!files) return;

		let incoming = Array.from(files);

		if (
			images.some((file) =>
				incoming.some(
					(incomingFile) =>
						incomingFile.name === file.name &&
						incomingFile.lastModified === file.lastModified,
				),
			)
		) {
			toast.error(
				"One or more of your images was duplicated, and was not uploaded",
			);
		}

		incoming = incoming.filter(
			(file) =>
				!images.some(
					(imagesFile) =>
						imagesFile.name === file.name &&
						imagesFile.lastModified === file.lastModified,
				),
		);

		// Note that resizing strips exif data, so if/when we do location based on exif data, that is something to be aware of.
		setResizing(true);
		onResizingChange?.(true);
		try {
			const operationVersion = nextLocationVersion();
			const resized = await Promise.all(incoming.map(resizeImage));
			const newImages = [...images, ...resized].slice(0, maxFiles);
			const newCaptions = [...captions, ...resized.map(() => "")].slice(
				0,
				maxFiles,
			);
			onChange(newImages, newCaptions);
			await Promise.allSettled(
				incoming.map(async (file) => {
					const tags = await ExifReader.load(file, { expanded: true });
					const lng = tags.gps?.Longitude;
					const lat = tags.gps?.Latitude;
					if (lng != null && lat != null) {
						if (operationVersion !== locationVersion.current) return;
						imageLocations.set(`${file.name}-${file.lastModified}`, {
							lat: Number(lat),
							lng: Number(lng),
						});
					}
				}),
			);

			if (operationVersion === locationVersion.current) {
				syncExifLocation(newImages);
			}
		} catch {
			toast.error(
				"An unknown error occured while trying to process one of your images. Please upload any missing images again.",
			);
		} finally {
			setResizing(false);
			onResizingChange?.(false);
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
							key={`${file.name}-${file.lastModified}`}
							file={file}
							caption={captions[index] ?? ""}
							onCaptionChange={(caption) => {
								const next = [...captions];
								next[index] = caption;
								onChange(images, next);
							}}
							onRemove={() => {
								const nextImages = images.filter((_, i) => i !== index);
								const nextCaptions = captions.filter((_, i) => i !== index);
								nextLocationVersion();
								imageLocations.delete(getImageKey(file));
								onChange(nextImages, nextCaptions);
								if (nextImages.length === 0) {
									onExifLocationChange(undefined);
								} else {
									syncExifLocation(nextImages);
								}
							}}
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
