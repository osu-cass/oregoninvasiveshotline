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

/** Union of all valid form field names (string-valued fields only) so that we can validate these separately. */
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

/** Ordered list of wizard steps with their headings, descriptions, and field keys. */
export const Steps: {
	title: string;
	description: string;
	fields: readonly WizardField[];
}[] = [
	{
		title: "Add photos and field notes",
		description:
			"Upload clear photos if you have them, then describe what you found.",
		fields: stepFields.photos,
	},
	{
		title: "Identify the species",
		description: "Choose the closest category and species, or mark it unknown.",
		fields: stepFields.identification,
	},
	{
		title: "Mark the location",
		description:
			"Pin the find as closely as you can and add helpful access details.",
		fields: stepFields.location,
	},
	{
		title: "Share your contact info",
		description: "Tell us how experts can follow up about your report.",
		fields: stepFields.contact,
	},
];
