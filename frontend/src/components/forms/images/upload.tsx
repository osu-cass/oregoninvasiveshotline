import clsx from "clsx";
import ExifReader from "exifreader";
import { useRef, useState } from "react";
import { toast } from "sonner";
import ImageThumb from "./imageThumbnail";
import { createImageUploadItem, getImageConversionStats } from "./state";
import type { ImageUploadItem } from "./types";

const ACCEPT = "image/*";

interface ImageUploadProps {
	/** Current list of selected image items. */
	items: ImageUploadItem[];
	/** Current list of captions, parallel to image items. */
	captions: string[];
	/** Called when the image items or captions change. */
	onChange: (items: ImageUploadItem[], captions: string[]) => void;
	/** Called when the EXIF-based location changes. */
	onExifLocationChange: (location?: google.maps.LatLngLiteral) => void;
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
	return `${file.name}-${file.lastModified}-${file.size}`;
}

/**
 * Drag-and-drop image uploader with client-side WebP conversion, thumbnails, and captions.
 * Pass state and the onChange prop rather than just the form.
 */
export default function ImageUpload({
	items,
	captions,
	onChange,
	onExifLocationChange,
	maxFiles = 10,
	label = "Images",
	optional,
}: ImageUploadProps) {
	const [dragging, setDragging] = useState(false);
	const imageLocations = useRef(new Map<string, google.maps.LatLngLiteral>());
	const locationVersion = useRef(0);
	const stats = getImageConversionStats(items);

	/**
	 * Updates the shared EXIF location from the first uploaded image with GPS data.
	 * @param orderedItems - Image item list in current upload order.
	 */
	const syncExifLocation = (orderedItems: ImageUploadItem[]) => {
		const firstLocation = orderedItems
			.map((item) => imageLocations.current.get(getImageKey(item.originalFile)))
			.find((location) => location != null);
		onExifLocationChange(firstLocation);
	};

	const nextLocationVersion = () => {
		locationVersion.current += 1;
		return locationVersion.current;
	};

	const addFiles = async (files: FileList | null) => {
		if (!files) return;

		const seenKeys = new Set(
			items.map((item) => getImageKey(item.originalFile)),
		);
		let duplicated = false;
		let incoming = Array.from(files).filter((file) => {
			const key = getImageKey(file);

			if (seenKeys.has(key)) {
				duplicated = true;
				return false;
			}

			seenKeys.add(key);
			return true;
		});

		if (duplicated) {
			toast.error(
				"One or more of your images was duplicated, and was not uploaded",
			);
		}

		const availableSlots = maxFiles - items.length;

		if (incoming.length > availableSlots) {
			toast.error(`You can only upload up to ${maxFiles} images.`);
			incoming = incoming.slice(0, availableSlots);
		}

		if (incoming.length === 0) return;

		const nextItems = [...items, ...incoming.map(createImageUploadItem)];
		const nextCaptions = [...captions, ...incoming.map(() => "")];
		onChange(nextItems, nextCaptions);

		const operationVersion = nextLocationVersion();

		await Promise.allSettled(
			incoming.map(async (file) => {
				const tags = await ExifReader.load(file, { expanded: true });
				const lng = tags.gps?.Longitude;
				const lat = tags.gps?.Latitude;
				if (lng != null && lat != null) {
					if (operationVersion !== locationVersion.current) return;
					imageLocations.current.set(getImageKey(file), {
						lat: Number(lat),
						lng: Number(lng),
					});
				}
			}),
		);

		if (operationVersion === locationVersion.current) {
			syncExifLocation(nextItems);
		}
	};

	return (
		<div>
			<label
				className="form-label fw-medium small mb-0"
				htmlFor="file-drop-input"
			>
				{label}
				{optional && (
					<span className="fw-normal ms-1 text-muted">(optional)</span>
				)}
			</label>

			{items.length > 0 && (
				<div className="d-flex my-2 flex-column gap-2">
					{items.map((item, index) => (
						<ImageThumb
							key={item.id}
							file={item.originalFile}
							caption={captions[index] ?? ""}
							status={item.status}
							error={item.error}
							onCaptionChange={(caption) => {
								const next = [...captions];
								next[index] = caption;
								onChange(items, next);
							}}
							onRemove={() => {
								const nextItems = items.filter((_, i) => i !== index);
								const nextCaptions = captions.filter((_, i) => i !== index);
								nextLocationVersion();
								imageLocations.current.delete(getImageKey(item.originalFile));
								onChange(nextItems, nextCaptions);
								if (nextItems.length === 0) {
									onExifLocationChange(undefined);
								} else {
									syncExifLocation(nextItems);
								}
							}}
						/>
					))}
				</div>
			)}

			{items.length < maxFiles && (
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
						Drag & drop images here, or click to browse/take photos
					</p>
					<p className="small mb-0 text-muted">
						{items.length} / {maxFiles} images
					</p>
					{stats.pending && (
						<p className="small mb-0 text-muted">
							{stats.done} / {stats.total} ready
						</p>
					)}
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
