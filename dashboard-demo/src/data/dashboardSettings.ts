import {
  createDefaultFilters,
  type DashboardFilters,
  type DateRangeKey,
} from "./dashboardData";

export type InsightDisplay = "all" | "hidden";

export interface DashboardSettings {
  /** Selected report date range. */
  dateRange: DateRangeKey;
  /** Whether queue rows are grouped by workflow status. */
  groupedByStatus: boolean;
  /** Which insight panels should be visible. */
  insightDisplay: InsightDisplay;
  /** Whether the top metric cards are visible. */
  showMetricCards: boolean;
  /** Rows shown before each grouped section's show-more control. */
  rowsPerGroup: number;
  /** Days before unclaimed reports show as warning-worthy. */
  unclaimedWarningDays: number;
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
  insightDisplay: "all",
  rowsPerGroup: 5,
  showMetricCards: true,
  unclaimedWarningDays: 2,
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

    return {
      filters: {
        ...defaults.filters,
        ...parsed.filters,
        counties: Array.isArray(parsed.filters?.counties)
          ? parsed.filters.counties
          : defaults.filters.counties,
      },
      settings: {
        ...defaults.settings,
        ...parsed.settings,
        insightDisplay:
          parsed.settings?.insightDisplay === "hidden" ? "hidden" : "all",
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
