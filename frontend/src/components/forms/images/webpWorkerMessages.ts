export interface WebpEncodeRequest {
	type: "encode";
	id: string;
	width: number;
	height: number;
	pixels: ArrayBuffer;
	qualities: number[];
	maxSizeBytes: number;
}

export interface WebpEncodeSuccess {
	type: "success";
	id: string;
	buffer: ArrayBuffer;
	quality: number;
}

export interface WebpEncodeError {
	type: "error";
	id: string;
	error: string;
}

export type WebpEncodeResponse = WebpEncodeSuccess | WebpEncodeError;
