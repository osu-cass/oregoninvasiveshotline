import type { ImageConversionStats } from "../forms/images/types";
import ConfirmDialog from "../ui/dialog";

interface ImageConversionDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Callback when dialog open state changes. */
	onOpenChange: (open: boolean) => void;
	/** Current image conversion progress. */
	stats: ImageConversionStats;
}

/** Shows progress while selected photos finish WebP conversion. */
export default function ImageConversionDialog({
	open,
	onOpenChange,
	stats,
}: ImageConversionDialogProps) {
	const progress = stats.total
		? Math.round((stats.done / stats.total) * 100)
		: 100;

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Converting images"
			description={
				<div>
					<p className="mb-3">
						Preparing {stats.done} of {stats.total} photos for upload.
					</p>
					<div
						className="progress"
						role="progressbar"
						aria-label="Image conversion progress"
						aria-valuenow={progress}
						aria-valuemin={0}
						aria-valuemax={100}
						style={{ height: "0.5rem" }}
					>
						<div className="progress-bar" style={{ width: `${progress}%` }} />
					</div>
					{stats.hasErrors && (
						<p className="small mt-3 mb-0 text-danger">
							Remove or re-upload any photos that failed to process.
						</p>
					)}
				</div>
			}
		/>
	);
}
