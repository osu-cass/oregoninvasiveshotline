const stepFields = {
	photos: ["find_description"],
	identification: ["category", "species", "identification_process"],
	location: ["location_description", "location"],
	contact: ["first_name", "last_name", "email", "phone", "questions"],
} as const;

export type WizardField = (typeof stepFields)[keyof typeof stepFields][number];
export type WizardFormData = Record<WizardField, string>;

export const allFields = Object.values(stepFields).flat() as WizardField[];

export const initialWizardData: WizardFormData = Object.fromEntries(
	allFields.map((field) => [field, ""]),
) as WizardFormData;

export type WizardStepProps = {
	form: {
		data: WizardFormData;
		setData(field: WizardField, value: string): void;
		errors: Partial<Record<WizardField, string>>;
		valid(field: WizardField): boolean;
		invalid(field: WizardField): boolean;
	};
};

type Step = {
	title: string;
	fields: readonly WizardField[];
};

export const Steps: Step[] = [
	{ title: "Photos", fields: stepFields.photos },
	{ title: "Identification", fields: stepFields.identification },
	{ title: "Location", fields: stepFields.location },
	{ title: "Contact Info", fields: stepFields.contact },
];

