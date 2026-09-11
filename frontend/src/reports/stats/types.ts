/** Counts for one year in the filtered report set. */
export interface YearStats {
	year: number;
	total: number;
	confirmed: number;
}

/** Counts for one effective category in the filtered report set. */
export interface CategoryStats {
	category_name: string | null;
	count: number;
}

/** Lifecycle shared by the report charts. */
export interface ReportChart {
	/** Fit the chart and its labels to its container. */
	resize(): void;
	/** Release the chart and its event listeners. */
	destroy(): void;
}
