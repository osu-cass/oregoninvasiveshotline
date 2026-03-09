/** Field keys grouped by wizard step. Each step validates independently. */
const stepFields = {
	photos: ["find_description"],
	identification: [
		"category",
		"species",
		"identification_process",
		"is_species_unknown",
	],
	location: ["location_description", "latitude", "longitude"],
	contact: ["first_name", "last_name", "email", "phone", "questions"],
} as const;

/** Union of all valid form field names (string-valued fields only). */
export type WizardField = (typeof stepFields)[keyof typeof stepFields][number];

/** Full form data including string fields and image file arrays. */
export type WizardFormData = Record<WizardField, string> & {
	images: File[];
	image_captions: string[];
};

/** Flat array of every string field name across all steps. */
export const allFields = Object.values(stepFields).flat() as WizardField[];

/** Blank form data with every field initialized. */
export const initialWizardData = {
	...Object.fromEntries(allFields.map((field) => [field, ""])),
	images: [] as File[],
	image_captions: [] as string[],
} as WizardFormData;

/** Ordered list of wizard steps with their titles and field keys. */
export const Steps: {
	title: string;
	fields: readonly WizardField[];
}[] = [
	{ title: "Photos", fields: stepFields.photos },
	{ title: "Identification", fields: stepFields.identification },
	{ title: "Location", fields: stepFields.location },
	{ title: "Contact Info", fields: stepFields.contact },
];
