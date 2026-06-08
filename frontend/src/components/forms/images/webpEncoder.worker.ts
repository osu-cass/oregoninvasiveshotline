/// <reference lib="webworker" />

import encode from "@jsquash/webp/encode";
import type {
	WebpEncodeRequest,
	WebpEncodeResponse,
} from "./webpWorkerMessages";

/** Encode image data as WebP, trying lower qualities until it fits. */
async function encodeWithSizeLimit(message: WebpEncodeRequest) {
	const imageData = new ImageData(
		new Uint8ClampedArray(message.pixels),
		message.width,
		message.height,
	);

	let bestBuffer: ArrayBuffer | undefined;
	let bestQuality = message.qualities.at(-1) ?? 70;

	for (const quality of message.qualities) {
		const buffer = await encode(imageData, { quality });
		bestBuffer = buffer;
		bestQuality = quality;

		if (buffer.byteLength <= message.maxSizeBytes) {
			break;
		}
	}

	if (!bestBuffer) {
		throw new Error("The image could not be encoded as WebP.");
	}

	return { buffer: bestBuffer, quality: bestQuality };
}

self.addEventListener(
	"message",
	async (event: MessageEvent<WebpEncodeRequest>) => {
		const message = event.data;

		if (message.type !== "encode") return;

		try {
			const result = await encodeWithSizeLimit(message);
			const response: WebpEncodeResponse = {
				type: "success",
				id: message.id,
				buffer: result.buffer,
				quality: result.quality,
			};
			self.postMessage(response, [result.buffer]);
		} catch (error) {
			const response: WebpEncodeResponse = {
				type: "error",
				id: message.id,
				error:
					error instanceof Error
						? error.message
						: "The image could not be encoded as WebP.",
			};
			self.postMessage(response);
		}
	},
);
