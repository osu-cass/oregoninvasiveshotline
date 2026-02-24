import type { ComponentType } from "react";
import StepOne from "./one";
import StepTwo from "./two";

const stepFields = {
	contact: ["first_name", "last_name", "email", "phone"],
	report: ["description", "location"],
} as const;

export type WizardField = (typeof stepFields)[keyof typeof stepFields][number];
export type WizardFormData = Record<WizardField, string>;

const allFields = Object.values(stepFields).flat() as WizardField[];

export const initialWizardData: WizardFormData = Object.fromEntries(
	allFields.map((field) => [field, ""]),
) as WizardFormData;

export interface WizardStepProps {
	form: {
		data: WizardFormData;
		setData(field: WizardField, value: string): void;
		errors: Partial<Record<WizardField, string>>;
		valid(field: WizardField): boolean;
		invalid(field: WizardField): boolean;
	};
}

type Step = {
	title: string;
	fields: readonly WizardField[];
	component: ComponentType<WizardStepProps>;
};

export const Steps: Step[] = [
	{ title: "Contact Info", fields: stepFields.contact, component: StepOne },
	{ title: "Report Details", fields: stepFields.report, component: StepTwo },
];
