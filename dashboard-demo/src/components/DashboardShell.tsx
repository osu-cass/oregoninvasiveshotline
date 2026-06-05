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
  const dataset = createDashboardDataset(sourceReports, settings.dateRange, filters, {
    responseDays: 7,
    unclaimedDays: settings.unclaimedWarningDays,
  });
  const showInsights = settings.insightDisplay === "all";

  useEffect(() => {
    saveDashboardState({ filters, settings });
  }, [filters, settings]);

  const updateSettings = (nextSettings: Partial<DashboardSettings>) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }));
  };

  return (
    <main className="dashboard-shell">
      <HeaderControls
        filters={filters}
        settings={settings}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters(createDefaultFilters())}
        onSettingsChange={updateSettings}
      />
      {settings.showMetricCards ? <MetricsGrid metrics={dataset.metrics} /> : null}
      {showInsights ? (
        <InsightsSection
          categoryMix={dataset.categoryMix}
          claimTimeByMonth={dataset.claimTimeByMonth}
          countyLoad={dataset.countyLoad}
          showMap={true}
          showTrends={true}
          submissionsByWeek={dataset.submissionsByWeek}
        />
      ) : null}
      <QueueList
        groupedByStatus={settings.groupedByStatus}
        groups={dataset.groups}
        rows={dataset.tableRows}
        rowsPerGroup={settings.rowsPerGroup}
      />
    </main>
  );
}
