import type { InertiaPrecognitiveFormProps } from "@inertiajs/react";

// This is where all of the fields are defined
// Each step has it's own fields so that each step can have validation run on it independantly
const stepFields = {
	photos: ["find_description"],
	identification: [
		"category",
		"species",
		"identification_process",
		"is_species_unknown",
	],
	location: ["location_description", "location"],
	contact: ["first_name", "last_name", "email", "phone", "questions"],
} as const;

export type WizardField = (typeof stepFields)[keyof typeof stepFields][number];
export type WizardFormData = Record<WizardField, string>;

export const allFields = Object.values(stepFields).flat() as WizardField[];
export const initialWizardData: WizardFormData = Object.fromEntries(
	allFields.map((field) => [field, ""]),
) as WizardFormData;

export const Steps: {
	title: string;
	fields: readonly WizardField[];
}[] = [
	{ title: "Photos", fields: stepFields.photos },
	{ title: "Identification", fields: stepFields.identification },
	{ title: "Location", fields: stepFields.location },
	{ title: "Contact Info", fields: stepFields.contact },
];
