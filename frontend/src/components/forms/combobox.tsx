import { Combobox } from "@base-ui/react/combobox";
import { type Key, type ReactNode, useId } from "react";

interface Item {
	label: ReactNode;
	value: Key;
}

export default function FormCombobox<T extends Item>({
	items,
	itemsName,
	itemsNamePlural,
	placeholder,
}: {
	items: T[];
	itemsName: string;
	itemsNamePlural: string;
	placeholder?: string;
}) {
	const id = useId();
	return (
		<Combobox.Root items={items}>
			<div className="d-flex flex-column gap-1 text-body">
				<label htmlFor={id} className="form-label fw-medium small mb-0">
					Choose a {itemsName}
				</label>
				<div className="position-relative">
					<Combobox.Input
						placeholder={placeholder}
						id={id}
						className="form-control pe-5"
					/>
					<div className="position-absolute d-flex end-0 top-0 h-100 pe-2 align-items-center text-secondary">
						<Combobox.Clear
							className="combobox-clear btn btn-link btn-sm lh-1 p-0 text-secondary"
							aria-label="Clear selection"
						>
							<i className="bi bi-x fs-5" />
						</Combobox.Clear>
						<Combobox.Trigger
							className="btn btn-link btn-sm lh-1 p-0 text-secondary"
							aria-label="Open popup"
						>
							<i className="bi bi-chevron-down fs-5" />
						</Combobox.Trigger>
					</div>
				</div>
			</div>

			<Combobox.Portal>
				<Combobox.Positioner sideOffset={4}>
					<Combobox.Popup
						className="rounded-3 border bg-white p-0 shadow"
						style={{
							width: "var(--anchor-width)",
							maxWidth: "var(--available-width)",
							maxHeight: "23rem",
							overflow: "hidden",
						}}
					>
						<Combobox.Empty>
							<p
								className="small d-flex mt-1 mb-1 px-3 align-items-center text-muted"
								style={{ height: "2.5rem" }}
							>
								No {itemsNamePlural} found.
							</p>
						</Combobox.Empty>
						<Combobox.List
							className={(state) =>
								`mb-0 overflow-y-auto ${!state.empty && "py-1"}`
							}
							style={{ maxHeight: "23rem" }}
						>
							{(item: T) => (
								<Combobox.Item
									key={item.value}
									value={item}
									style={{
										height: "2.5rem",
										cursor: "pointer",
									}}
									className={(state) =>
										`d-flex mx-1 cursor-pointer gap-2 rounded-2 px-3 align-items-center ${state.highlighted ? "bg-primary text-white" : ""}`
									}
								>
									<span
										style={{
											width: "0.75rem",
											display: "inline-flex",
											justifyContent: "center",
										}}
									>
										<Combobox.ItemIndicator>
											<i className="bi bi-check fs-5" />
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
