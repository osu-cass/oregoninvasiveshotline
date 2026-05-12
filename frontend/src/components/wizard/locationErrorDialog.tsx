import { AlertDialog } from "@base-ui/react";
import ConfirmDialog from "../ui/dialog";

interface LocationErrorDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Callback when the open state changes. */
	onOpenChange: (open: boolean) => void;
	/** Message shown in the dialog body. */
	description: string;
}

/** Alerts the user that location access could not be retrieved. */
export default function LocationErrorDialog({
	open,
	onOpenChange,
	description,
}: LocationErrorDialogProps) {
	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Location unavailable"
			description={description}
		>
			<div className="d-flex justify-content-end">
				<AlertDialog.Close className="btn btn-primary px-3">
					OK
				</AlertDialog.Close>
			</div>
		</ConfirmDialog>
	);
}
