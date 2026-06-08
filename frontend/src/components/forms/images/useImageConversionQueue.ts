import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { convertImageToWebp } from "./convertImageToWebp";
import type { ImageUploadItem } from "./types";

/** Runs selected image WebP conversion serially in the background. */
export function useImageConversionQueue(
	items: ImageUploadItem[],
	onItemsChange: (items: ImageUploadItem[]) => void,
) {
	const converting = useRef(false);
	const latestItems = useRef(items);
	const latestOnItemsChange = useRef(onItemsChange);

	useEffect(() => {
		latestItems.current = items;
	}, [items]);

	useEffect(() => {
		latestOnItemsChange.current = onItemsChange;
	}, [onItemsChange]);

	useEffect(() => {
		if (converting.current) return;

		const nextItem = items.find((item) => item.status === "queued");
		if (!nextItem) return;

		/** Commits image item changes through the parent state. */
		function commitItems(nextItems: ImageUploadItem[]) {
			latestItems.current = nextItems;
			latestOnItemsChange.current(nextItems);
		}

		converting.current = true;

		const processingItems = latestItems.current.map((item) =>
			item.id === nextItem.id
				? { ...item, status: "processing" as const }
				: item,
		);
		commitItems(processingItems);

		convertImageToWebp(nextItem.originalFile)
			.then((uploadFile) => {
				if (!latestItems.current.some((item) => item.id === nextItem.id)) {
					commitItems([...latestItems.current]);
					return;
				}

				const nextItems = latestItems.current.map((item) =>
					item.id === nextItem.id
						? {
								...item,
								status: "done" as const,
								uploadFile,
								error: undefined,
							}
						: item,
				);
				commitItems(nextItems);
			})
			.catch(() => {
				if (!latestItems.current.some((item) => item.id === nextItem.id)) {
					commitItems([...latestItems.current]);
					return;
				}

				toast.error(
					"An image could not be converted. Please remove it and try uploading it again.",
				);
				const nextItems = latestItems.current.map((item) =>
					item.id === nextItem.id
						? {
								...item,
								status: "error" as const,
								error: "Conversion failed.",
							}
						: item,
				);
				commitItems(nextItems);
			})
			.finally(() => {
				converting.current = false;
			});
	}, [items]);
}
