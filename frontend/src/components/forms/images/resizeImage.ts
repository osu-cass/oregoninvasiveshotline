import imageCompression from "browser-image-compression";

const MAX_WIDTH = 1920;
const MAX_SIZE_MB = 0.5;

/** Resize and compress an image file to a reasonable upload size. */
export async function resizeImage(file: File) {
	return imageCompression(file, {
		maxWidthOrHeight: MAX_WIDTH,
		maxSizeMB: MAX_SIZE_MB,
		useWebWorker: true,
		fileType: "image/webp",
	});
}
