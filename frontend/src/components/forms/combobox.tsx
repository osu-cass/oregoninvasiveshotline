import { Combobox } from "@base-ui/react/combobox";
import type { InertiaPrecognitiveFormProps } from "@inertiajs/react";
import { type Key, type ReactNode, useId, useMemo } from "react";
import type { WizardField, WizardFormData } from "../wizard-steps/fields";

interface Item {
	label: ReactNode;
	value: Key;
}

export default function FormCombobox<T extends Item>({
	items,
	itemsName,
	itemsNamePlural,
	placeholder,
	form,
	name,
	disabled,
	onChange,
}: {
	items: T[];
	itemsName: string;
	itemsNamePlural: string;
	placeholder?: string;
	form: InertiaPrecognitiveFormProps<WizardFormData>;
	name: WizardField;
	disabled?: boolean;
	onChange?: (value: T | null) => void;
}) {
	const id = useId();
	const formValue = form.data[name];
	const selectedItem = useMemo(
		() => items.find((item) => String(item.value) === formValue) ?? null,
		[items, formValue],
	);

	const error = form.invalid(name) ? form.errors[name] : undefined;
	const hasError = Boolean(error);
	const isValid = form.valid(name);
	const errorId = `${name}-error`;

	const validationClass = hasError
		? "is-invalid"
		: isValid
			? "is-valid"
			: undefined;

	const errorFeedback = hasError && (
		<div id={errorId} className="invalid-feedback d-block">
			{error}
		</div>
	);

	return (
		<Combobox.Root
			items={items}
			disabled={disabled}
			value={selectedItem}
			onValueChange={(value: T | null) => {
				form.setData(name, value ? String(value.value) : "");
				onChange?.(value);
			}}
		>
			<div className="d-flex flex-column gap-1 text-body">
				<label htmlFor={id} className="form-label fw-medium small mb-0">
					Choose a {itemsName}
				</label>
				<div className="position-relative">
					<Combobox.Input
						placeholder={placeholder}
						id={id}
						className={`form-control pe-5 ${validationClass ?? ""}`}
						aria-invalid={hasError}
						aria-describedby={hasError ? errorId : undefined}
					/>
					<div
						className="position-absolute d-flex end-0 top-0 h-100 align-items-center text-secondary"
						style={{ paddingInlineEnd: isValid || hasError ? "2.25rem" : "0.75rem" }}
					>
						<Combobox.Clear
							className="combobox-clear btn btn-link btn-sm lh-1 me-1 p-0 text-secondary"
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
				{errorFeedback}
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
