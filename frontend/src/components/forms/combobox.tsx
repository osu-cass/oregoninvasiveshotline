import { Combobox } from "@base-ui/react/combobox";
import { type Key, type ReactNode, useId } from "react";

interface Item {
	label: ReactNode;
	value: Key;
}

export default function FormCombobox<T extends Item>({
	items,
}: {
	items: T[];
}) {
	const id = useId();
	return (
		<Combobox.Root items={items}>
			<div className="d-flex fw-medium small flex-column gap-1 text-body">
				<label htmlFor={id} className="form-label mb-0">
					Choose a fruit
				</label>
				<div className="position-relative">
					<Combobox.Input
						placeholder="e.g. Apple"
						id={id}
						className="form-control pe-5"
					/>
					<div className="position-absolute d-flex end-0 top-0 h-100 pe-2 align-items-center text-secondary">
						<Combobox.Clear
							className="combobox-clear btn btn-link btn-sm lh-1 p-0 text-secondary"
							aria-label="Clear selection"
						>
							<i className="bi bi-x" />
						</Combobox.Clear>
						<Combobox.Trigger
							className="btn btn-link btn-sm lh-1 p-0 text-secondary"
							aria-label="Open popup"
						>
							<i className="bi bi-chevron-down" />
						</Combobox.Trigger>
					</div>
				</div>
			</div>

			<Combobox.Portal>
				<Combobox.Positioner sideOffset={4}>
					<Combobox.Popup
						className="dropdown-menu show rounded border p-0 shadow"
						style={{
							width: "var(--anchor-width)",
							maxWidth: "var(--available-width)",
							maxHeight: "23rem",
							overflow: "hidden",
						}}
					>
						<Combobox.Empty className="small px-3 py-2 text-muted">
							No fruits found.
						</Combobox.Empty>
						<Combobox.List
							className="mb-0 overflow-y-auto py-2"
							style={{ maxHeight: "23rem" }}
						>
							{(item: T) => (
								<Combobox.Item
									key={item.value}
									value={item}
									className="dropdown-item d-flex gap-2 px-3 py-2 align-items-center"
								>
									<span
										style={{
											width: "0.75rem",
											display: "inline-flex",
											justifyContent: "center",
										}}
									>
										<Combobox.ItemIndicator>
											<i className="bi bi-check" />
										</Combobox.ItemIndicator>
									</span>
									<span>{item.label}</span>
								</Combobox.Item>
							)}
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Positioner>
			</Combobox.Portal>
		</Combobox.Root>
	);
}
