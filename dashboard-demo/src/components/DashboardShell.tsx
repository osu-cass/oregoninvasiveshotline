import { useEffect, useState } from "react";
import {
  createDashboardDataset,
  createDefaultFilters,
  createGeneratedReports,
  type DashboardFilters,
} from "../data/dashboardData";
import {
  loadDashboardState,
  saveDashboardState,
  type DashboardSettings,
} from "../data/dashboardSettings";
import { HeaderControls } from "./HeaderControls";
import { InsightsSection } from "./InsightsSection";
import { MetricsGrid } from "./MetricsGrid";
import { QueueList } from "./QueueList";

/** Renders the standalone dashboard demo shell. */
export default function DashboardShell() {
  const [storedState] = useState(() => loadDashboardState());
  const [settings, setSettings] = useState<DashboardSettings>(
    storedState.settings,
  );
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    storedState.filters,
  );
  const [sourceReports] = useState(() => createGeneratedReports());
  const dataset = createDashboardDataset(sourceReports, settings.dateRange, filters);

  useEffect(() => {
    saveDashboardState({ filters, settings });
  }, [filters, settings]);

  const updateSettings = (nextSettings: Partial<DashboardSettings>) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }));
  };
  const toggleCountyFilter = (countyKey: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      counties: currentFilters.counties.includes(countyKey)
        ? currentFilters.counties.filter(
            (selectedCountyKey) => selectedCountyKey !== countyKey,
          )
        : [...currentFilters.counties, countyKey],
    }));
  };

  return (
    <main className="mx-auto w-[min(1480px,calc(100vw-40px))] py-8 pb-12 max-[720px]:w-[min(1480px,calc(100vw-24px))] max-[720px]:pt-5">
      <HeaderControls
        filters={filters}
        settings={settings}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters(createDefaultFilters())}
        onSettingsChange={updateSettings}
      />
      <MetricsGrid metrics={dataset.metrics} />
      <InsightsSection
        categoryDetails={dataset.categoryDetails}
        categoryMix={dataset.categoryMix}
        claimTimeByMonth={dataset.claimTimeByMonth}
        countyLoad={dataset.countyLoad}
        onCountySelectionChange={toggleCountyFilter}
        selectedCountyKeys={filters.counties}
        showMap={true}
        showTrends={true}
        submissionsByWeek={dataset.submissionsByWeek}
      />
      <QueueList
        groupedByStatus={settings.groupedByStatus}
        groups={dataset.groups}
        onGroupedByStatusChange={(groupedByStatus) =>
          updateSettings({ groupedByStatus })
        }
        onRowsPerGroupChange={(rowsPerGroup) =>
          updateSettings({ rowsPerGroup })
        }
        reviewerScores={dataset.reviewerScores}
        rows={dataset.tableRows}
        rowsPerGroup={settings.rowsPerGroup}
      />
    </main>
  );
}
