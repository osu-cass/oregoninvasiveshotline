import { AlertDialog } from "@base-ui/react";
import ConfirmDialog from "../ui/dialog";

interface ConfirmNoImagesDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Callback when dialog open state changes. */
	onOpenChange: (open: boolean) => void;
	/** Called when the user confirms they want to proceed without photos. */
	onConfirm: () => void;
}

/** Prompts the user to confirm advancing without uploading any photos. */
export default function ConfirmNoImagesDialog({
	open,
	onOpenChange,
	onConfirm,
}: ConfirmNoImagesDialogProps) {
	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title="No photos attached"
			description="Photos greatly help experts identify species. Are you sure you want to continue without any?"
		>
			<div className="d-flex justify-content-sm-end flex-column-reverse flex-sm-row gap-2">
				<AlertDialog.Close
					className="btn btn-secondary px-3"
					data-testid="confirm-no-images-go-back"
				>
					Go back
				</AlertDialog.Close>
				<AlertDialog.Close
					className={`btn btn-primary px-3`}
					onClick={onConfirm}
					data-testid="confirm-no-images-continue"
				>
					Continue without photos
				</AlertDialog.Close>
			</div>
		</ConfirmDialog>
	);
}
