import type { InertiaPrecognitiveFormProps } from "@inertiajs/react";
import clsx from "clsx";
import type React from "react";
import type { WizardField, WizardFormData } from "../wizard/fields";

interface BaseFieldProps {
	/** The Inertia precognitive form instance. */
	form: InertiaPrecognitiveFormProps<WizardFormData>;
	/** Form field key this input controls. */
	name: WizardField;
	/** Visible label text. */
	label: string;
	/** Shows "(optional)" next to the label. */
	optional?: boolean;
	/** Override the auto-detected valid state. */
	valid?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
	/** Render as a standard input (default). */
	as?: "input";
	/** Extra props forwarded to the underlying `<input>`. */
	inputProps?: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"id" | "value" | "aria-invalid" | "aria-describedby"
	>;
}

interface TextareaFieldProps extends BaseFieldProps {
	/** Render as a textarea. */
	as: "textarea";
	/** Extra props forwarded to the underlying `<textarea>`. */
	textareaProps?: Omit<
		React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		"id" | "value" | "aria-invalid" | "aria-describedby"
	>;
}

/** form field that handles label, validation feedback, and wires up to Inertia. supports input and textarea. */
/** Form field with label, validation feedback, wired to Inertia. Supports input and textarea. */
export default function Field(props: InputFieldProps | TextareaFieldProps) {
	const { form, name, label, optional, valid } = props;
	const errorId = `${name}-error`;
	const error = form.invalid(name) ? form.errors[name] : undefined;
	const hasError = Boolean(error);
	const isValid = valid ?? form.valid(name);

	const inputType =
		props.as === "textarea" ? undefined : props.inputProps?.type;
	const isCheck = inputType === "checkbox";

	const baseProps = {
		id: name,
		value: form.data[name],
		className: clsx(
			isCheck ? "form-check-input" : "form-control",

			props.as === "textarea"
				? props.textareaProps?.className
				: props.inputProps?.className,

			hasError && "is-invalid",
			isValid && "is-valid",
		),
		"aria-invalid": hasError,
		"aria-describedby": hasError ? errorId : undefined,
	};

	const errorFeedback = hasError && (
		<div id={errorId} className="invalid-feedback d-block">
			{error}
		</div>
	);

	if (isCheck) {
		const inputProps = (props as InputFieldProps).inputProps;

		if (!inputProps) {
			return null;
		}

		return (
			<div className="form-check">
				<input
					{...inputProps}
					{...baseProps}
					onChange={(event) => {
						inputProps.onChange?.(event);
						form.setData(name, String(event.target.checked));
					}}
					checked={form.data[name] === "true"}
				/>
				<label
					htmlFor={name}
					className="form-check-label small user-select-none"
				>
					<p className="fw-medium mb-0">
						{label}
						{optional && (
							<span className="fw-normal ms-1 text-muted">(optional)</span>
						)}
					</p>
					<p className="mb-0 text-muted">{inputProps.placeholder}</p>
				</label>
				{errorFeedback}
			</div>
		);
	}

	return (
		<div>
			<label htmlFor={name} className="form-label fw-medium small mb-0">
				{label}
				{optional && (
					<span className="fw-normal ms-1 text-muted">(optional)</span>
				)}
			</label>

			{props.as === "textarea" ? (
				<textarea
					{...props.textareaProps}
					{...baseProps}
					onChange={(event) => {
						props.textareaProps?.onChange?.(event);
						form.setData(name, event.target.value);
					}}
				/>
			) : (
				<input
					{...props.inputProps}
					{...baseProps}
					onChange={(event) => {
						props.inputProps?.onChange?.(event);
						form.setData(name, event.target.value);
					}}
				/>
			)}

			{errorFeedback}
		</div>
	);
}
