import { useEffect, useMemo } from "react";

/** Thumbnail preview for an uploaded image with caption input and remove button. */
export default function ImageThumb({
	file,
	caption,
	onCaptionChange,
	onRemove,
}: {
	/** The image file. */
	file: File;
	/** The caption for this image. */
	caption: string;
	/** Called when the user edits the caption text. */
	onCaptionChange: (caption: string) => void;
	/** Called when the user clicks the remove button. */
	onRemove: () => void;
}) {
	const src = useMemo(() => URL.createObjectURL(file), [file]);

	useEffect(() => {
		return () => URL.revokeObjectURL(src);
	}, [src]);

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
		</div>
	);
}
