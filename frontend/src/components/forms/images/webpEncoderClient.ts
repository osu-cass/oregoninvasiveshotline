import type {
	WebpEncodeRequest,
	WebpEncodeResponse,
} from "./webpWorkerMessages";

interface PendingRequest {
	resolve: (buffer: ArrayBuffer) => void;
	reject: (error: Error) => void;
}

const pendingRequests = new Map<string, PendingRequest>();
let worker: Worker | undefined;

/** Generate a request id for matching worker responses. */
function getRequestId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Reject all outstanding work when the encoder worker fails. */
function rejectPendingRequests(error: Error) {
	for (const request of pendingRequests.values()) {
		request.reject(error);
	}
	pendingRequests.clear();
}

/** Return the shared WebP encoder worker. */
function getWorker() {
	if (worker) {
		return worker;
	}

	worker = new Worker(new URL("./webpEncoder.worker.ts", import.meta.url), {
		type: "module",
	});

	worker.addEventListener(
		"message",
		(event: MessageEvent<WebpEncodeResponse>) => {
			const response = event.data;
			const pending = pendingRequests.get(response.id);

			if (!pending) return;

			pendingRequests.delete(response.id);

			if (response.type === "success") {
				pending.resolve(response.buffer);
			} else {
				pending.reject(new Error(response.error));
			}
		},
	);

	worker.addEventListener("error", (event) => {
		const error = new Error(event.message || "The WebP encoder failed.");
		rejectPendingRequests(error);
		worker?.terminate();
		worker = undefined;
	});

	return worker;
}

/** Encode image data as WebP in a worker. */
export function encodeWebpInWorker(
	imageData: ImageData,
	qualities: number[],
	maxSizeBytes: number,
) {
	const id = getRequestId();
	const pixels = new Uint8ClampedArray(imageData.data);
	const pixelBuffer = pixels.buffer;

	if (!(pixelBuffer instanceof ArrayBuffer)) {
		return Promise.reject(new Error("The image data cannot be transferred."));
	}

	return new Promise<ArrayBuffer>((resolve, reject) => {
		const message: WebpEncodeRequest = {
			type: "encode",
			id,
			width: imageData.width,
			height: imageData.height,
			pixels: pixelBuffer,
			qualities,
			maxSizeBytes,
		};

		pendingRequests.set(id, { resolve, reject });
		getWorker().postMessage(message, [pixelBuffer]);
	});
}
