import type React from "react";
import type { WizardField, WizardStepProps } from "../wizard-steps";

type BaseFieldProps = {
	form: WizardStepProps["form"];
	name: WizardField;
	label: string;
	optional?: boolean;
	valid?: boolean;
};

type InputFieldProps = BaseFieldProps & {
	as?: "input";
	inputProps?: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"id" | "value" | "aria-invalid" | "aria-describedby"
	>;
};

type TextareaFieldProps = BaseFieldProps & {
	as: "textarea";
	textareaProps?: Omit<
		React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		"id" | "value" | "aria-invalid" | "aria-describedby"
	>;
};

type FieldProps = InputFieldProps | TextareaFieldProps;

export default function Field(props: FieldProps) {
	const { form, name, label, optional, valid } = props;
	const id = name;
	const errorId = `${id}-error`;
	const error = form.invalid(name) ? form.errors[name] : undefined;
	const hasError = Boolean(error);
	const isValid = valid ?? form.valid(name);
	const className = [
		"form-control",
		props.as === "textarea" ? props.textareaProps?.className : props.inputProps?.className,
		hasError ? "is-invalid" : isValid ? "is-valid" : undefined,
	]
		.filter(Boolean)
		.join(" ");
	const baseProps = {
		id,
		value: form.data[name],
		className,
		"aria-invalid": hasError,
		"aria-describedby": hasError ? errorId : undefined,
	};

	return (
		<div>
			<label htmlFor={id} className="form-label">
				{label}
				{optional && <span className="ms-1 text-muted">(optional)</span>}
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

			{hasError && (
				<div id={errorId} className="invalid-feedback d-block">
					{error}
				</div>
			)}
		</div>
	);
}
