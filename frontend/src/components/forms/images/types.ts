export type ImageConversionStatus = "queued" | "processing" | "done" | "error";

export interface ImageUploadItem {
	/** Stable identifier for this selected image. */
	id: string;
	/** Original selected file used for preview and EXIF reading. */
	originalFile: File;
	/** Converted WebP file used for form submission. */
	uploadFile?: File;
	/** Current WebP conversion status. */
	status: ImageConversionStatus;
	/** User-facing conversion error, if conversion failed. */
	error?: string;
}

export interface ImageConversionStats {
	/** Total number of selected images. */
	total: number;
	/** Number of images converted and ready to submit. */
	done: number;
	/** Number of images waiting to convert. */
	queued: number;
	/** Number of images currently converting. */
	processing: number;
	/** Number of images that failed conversion. */
	failed: number;
	/** Whether any image is waiting or actively converting. */
	pending: boolean;
	/** Whether any image has failed conversion. */
	hasErrors: boolean;
}
