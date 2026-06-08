import { encodeWebpInWorker } from "./webpEncoderClient";

const MAX_WIDTH_OR_HEIGHT = 1920;
const MAX_SIZE_BYTES = 512 * 1024;
const WEBP_QUALITY_STEPS = [80, 70, 60, 50, 40];
const WEBP_MIME_TYPE = "image/webp";

interface ImageSize {
	width: number;
	height: number;
}

/** Load the selected image file into an image element. */
async function loadImage(file: File) {
	const url = URL.createObjectURL(file);

	try {
		const image = new Image();
		image.decoding = "async";
		image.src = url;

		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error("The image could not be loaded."));
		});

		return image;
	} finally {
		URL.revokeObjectURL(url);
	}
}

/** Calculate dimensions constrained to the configured maximum edge length. */
function getResizedImageSize(width: number, height: number): ImageSize {
	const largestSide = Math.max(width, height);

	if (largestSide <= MAX_WIDTH_OR_HEIGHT) {
		return { width, height };
	}

	const scale = MAX_WIDTH_OR_HEIGHT / largestSide;

	return {
		width: Math.round(width * scale),
		height: Math.round(height * scale),
	};
}

/** Return a WebP filename based on the source filename. */
function getWebpFileName(fileName: string) {
	const baseName = fileName.replace(/\.[^/.]+$/, "");
	return `${baseName || "image"}.webp`;
}

/** Draw a source image onto a resized canvas and return raw image data. */
function getResizedImageData(image: HTMLImageElement) {
	const { width, height } = getResizedImageSize(
		image.naturalWidth || image.width,
		image.naturalHeight || image.height,
	);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("The image could not be prepared for conversion.");
	}

	context.drawImage(image, 0, 0, width, height);

	return context.getImageData(0, 0, width, height);
}

/** Resize a selected image and encode it as an actual WebP file. */
export async function convertImageToWebp(file: File) {
	const image = await loadImage(file);
	const imageData = getResizedImageData(image);
	const buffer = await encodeWebpInWorker(
		imageData,
		WEBP_QUALITY_STEPS,
		MAX_SIZE_BYTES,
	);

	return new File([buffer], getWebpFileName(file.name), {
		type: WEBP_MIME_TYPE,
		lastModified: file.lastModified,
	});
}
