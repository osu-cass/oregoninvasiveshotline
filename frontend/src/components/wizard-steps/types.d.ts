export type CategoryWithSpecies = {
	category_id: number;
	name: string;
	species: {
		species_id: number;
		name: string;
		scientific_name: string;
	}[];
};

export type ContactInfo = {
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone: string;
} | null;
