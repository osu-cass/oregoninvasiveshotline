import type { InertiaPrecognitiveFormProps } from "@inertiajs/react";
import type { WizardFormData } from "./fields";

/** A category with its nested species list, as returned by the backend. */
export type CategoryWithSpecies = {
	category_id: number;
	name: string;
	species: {
		species_id: number;
		name: string;
		scientific_name: string;
		identification_image: string | null;
		identification_image_alt: string | null;
		identification_external_resource_link: string | null;
	}[];
};

/** Logged-in user's contact info, or null if anonymous. */
export type ContactInfo = {
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone: string;
} | null;

/** Props shared by all wizard step components. */
export interface WizardStepProps {
	/** The Inertia precognitive form instance. */
	form: InertiaPrecognitiveFormProps<WizardFormData>;
}
