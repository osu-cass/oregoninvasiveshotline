import type { ImageConversionStats, ImageUploadItem } from "./types";

/** Return converted image files in the same order as selected images. */
export function getConvertedImages(items: ImageUploadItem[]) {
	return items.flatMap((item) => (item.uploadFile ? [item.uploadFile] : []));
}

/** Summarize image conversion state for upload UI and submit gating. */
export function getImageConversionStats(
	items: ImageUploadItem[],
): ImageConversionStats {
	const stats = items.reduce(
		(result, item) => {
			result[item.status] += 1;
			return result;
		},
		{ queued: 0, processing: 0, done: 0, error: 0 },
	);

	return {
		total: items.length,
		done: stats.done,
		queued: stats.queued,
		processing: stats.processing,
		failed: stats.error,
		pending: stats.queued > 0 || stats.processing > 0,
		hasErrors: stats.error > 0,
	};
}

/** Build a stable image item for the selected source file. */
export function createImageUploadItem(file: File): ImageUploadItem {
	return {
		id: `${file.name}-${file.lastModified}-${file.size}`,
		originalFile: file,
		status: "queued",
	};
}
