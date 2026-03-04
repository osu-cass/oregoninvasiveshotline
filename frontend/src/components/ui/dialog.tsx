import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The title of the confirmation dialog. */
	title: ReactNode;
	/** The description of the confirmation dialog. */
	description: ReactNode;
	children?: ReactNode;
}

/** Reusable confirmation dialog built on base-ui AlertDialog. */
export default function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
}: ConfirmDialogProps) {
	return (
		<AlertDialog.Root open={open} onOpenChange={onOpenChange}>
			<AlertDialog.Portal>
				<AlertDialog.Backdrop
					style={{
						position: "fixed",
						inset: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						zIndex: 1050,
					}}
				/>
				<AlertDialog.Popup
					className="rounded-3 border bg-white p-4 shadow"
					style={{
						position: "fixed",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						zIndex: 1055,
						width: "24rem",
						maxWidth: "calc(100vw - 3rem)",
					}}
				>
					<AlertDialog.Title className="fs-5 fw-semibold mb-2">
						{title}
					</AlertDialog.Title>
					<AlertDialog.Description className="mb-4 text-muted">
						{description}
					</AlertDialog.Description>
					{children}
				</AlertDialog.Popup>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
