import {
  createDefaultFilters,
  type DashboardFilters,
  type DateRangeKey,
} from "./dashboardData";

export interface DashboardSettings {
  /** Selected report date range. */
  dateRange: DateRangeKey;
  /** Whether queue rows are grouped by workflow status. */
  groupedByStatus: boolean;
  /** Rows shown before each grouped section's show-more control. */
  rowsPerGroup: number;
}

export interface StoredDashboardState {
  /** Persisted dashboard controls. */
  settings: DashboardSettings;
  /** Persisted dashboard filters. */
  filters: DashboardFilters;
}

const storageKey = "hotline-dashboard-demo-state";

export const defaultDashboardSettings: DashboardSettings = {
  dateRange: "last-90",
  groupedByStatus: true,
  rowsPerGroup: 5,
};

/** Loads dashboard preferences from browser storage. */
export function loadDashboardState(): StoredDashboardState {
  const defaults = {
    filters: createDefaultFilters(),
    settings: defaultDashboardSettings,
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredDashboardState>;
    const storedRowsPerGroup = Number(parsed.settings?.rowsPerGroup);

    return {
      filters: {
        counties: Array.isArray(parsed.filters?.counties)
          ? parsed.filters.counties
          : defaults.filters.counties,
        category: parsed.filters?.category ?? defaults.filters.category,
        claimant: parsed.filters?.claimant ?? defaults.filters.claimant,
        publicOnly:
          typeof parsed.filters?.publicOnly === "boolean"
            ? parsed.filters.publicOnly
            : defaults.filters.publicOnly,
      },
      settings: {
        dateRange: parsed.settings?.dateRange ?? defaults.settings.dateRange,
        groupedByStatus:
          typeof parsed.settings?.groupedByStatus === "boolean"
            ? parsed.settings.groupedByStatus
            : defaults.settings.groupedByStatus,
        rowsPerGroup: [3, 5, 8].includes(storedRowsPerGroup)
          ? storedRowsPerGroup
          : defaults.settings.rowsPerGroup,
      },
    };
  } catch {
    return defaults;
  }
}

/** Saves dashboard preferences to browser storage. */
export function saveDashboardState(state: StoredDashboardState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state));
}
