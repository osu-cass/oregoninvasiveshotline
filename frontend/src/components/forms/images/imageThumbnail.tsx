import { useEffect, useState } from "react";
import type { ImageConversionStatus } from "./types";

interface ImageThumbProps {
	/** The image file. */
	file: File;
	/** The caption for this image. */
	caption: string;
	/** Current WebP conversion status. */
	status: ImageConversionStatus;
	/** Optional conversion error text. */
	error?: string;
	/** Called when the user edits the caption text. */
	onCaptionChange: (caption: string) => void;
	/** Called when the user clicks the remove button. */
	onRemove: () => void;
}

/** Return the visual treatment for a conversion status badge. */
function getStatusClassName(status: ImageConversionStatus) {
	switch (status) {
		case "done":
			return "bg-success-subtle text-success-emphasis";
		case "error":
			return "bg-danger-subtle text-danger-emphasis";
		default:
			return "bg-secondary-subtle text-secondary-emphasis";
	}
}

/** Return the short label for a conversion status badge. */
function getStatusLabel(status: ImageConversionStatus) {
	switch (status) {
		case "queued":
			return "Queued";
		case "processing":
			return "Converting";
		case "done":
			return "Ready";
		case "error":
			return "Failed";
	}
}

/** Thumbnail preview for an uploaded image with caption input and remove button. */
export default function ImageThumb({
	file,
	caption,
	status,
	error,
	onCaptionChange,
	onRemove,
}: ImageThumbProps) {
	const [src, setSrc] = useState<string>();

	useEffect(() => {
		const src = URL.createObjectURL(file);
		setSrc(src);

		return () => URL.revokeObjectURL(src);
	}, [file]);

	return (
		<div className="d-flex gap-2 align-items-center">
			<div
				className="position-relative flex-shrink-0"
				style={{ width: "8rem", height: "8rem" }}
			>
				<img
					src={src}
					alt={file.name}
					className="h-100 w-100 rounded-3 border object-fit-cover"
				/>
				<button
					type="button"
					className="btn btn-sm position-absolute d-flex justify-content-center rounded-2 bg-danger bg-opacity-75 p-0 align-items-center text-white"
					style={{
						width: 22,
						height: 22,
						right: 3,
						top: 3,
					}}
					onClick={onRemove}
					aria-label={`Remove ${file.name}`}
				>
					<i className="bi bi-x" />
				</button>
			</div>
			<input
				type="text"
				className="form-control form-control-sm rounded-2"
				placeholder="Caption (optional)"
				value={caption}
				onChange={(e) => onCaptionChange(e.target.value)}
			/>
			<div className="d-flex flex-column flex-shrink-0 gap-1 align-items-end">
				<span
					className={`badge fw-medium rounded-pill ${getStatusClassName(status)}`}
				>
					{status === "processing" && (
						<span
							className="spinner-border spinner-border-sm me-1"
							aria-hidden="true"
							style={{ width: "0.7rem", height: "0.7rem" }}
						/>
					)}
					{getStatusLabel(status)}
				</span>
				{status === "error" && (
					<span className="small text-end text-danger">
						{error ?? "Conversion failed."}
					</span>
				)}
			</div>
		</div>
	);
}
