import { useState } from "react";
import {
  createDashboardDataset,
  createDefaultFilters,
  createGeneratedReports,
  type DashboardFilters,
  type DateRangeKey,
} from "../data/dashboardData";
import { HeaderControls } from "./HeaderControls";
import { InsightsSection } from "./InsightsSection";
import { MetricsGrid } from "./MetricsGrid";
import { QueueList } from "./QueueList";

/** Renders the standalone dashboard demo shell. */
export default function DashboardShell() {
  const [dateRange, setDateRange] = useState<DateRangeKey>("last-90");
  const [groupedByStatus, setGroupedByStatus] = useState(true);
  const [showTrends, setShowTrends] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [rowsPerGroup, setRowsPerGroup] = useState(5);
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    createDefaultFilters(),
  );
  const [sourceReports] = useState(() => createGeneratedReports());
  const dataset = createDashboardDataset(sourceReports, dateRange, filters);

  return (
    <main className="dashboard-shell">
      <HeaderControls
        dateRange={dateRange}
        filters={filters}
        groupedByStatus={groupedByStatus}
        rowsPerGroup={rowsPerGroup}
        showMap={showMap}
        showTrends={showTrends}
        onDateRangeChange={setDateRange}
        onFiltersChange={setFilters}
        onGroupedByStatusChange={setGroupedByStatus}
        onResetFilters={() => setFilters(createDefaultFilters())}
        onRowsPerGroupChange={setRowsPerGroup}
        onShowMapChange={setShowMap}
        onShowTrendsChange={setShowTrends}
      />
      <MetricsGrid metrics={dataset.metrics} />
      {showTrends || showMap ? (
        <InsightsSection
          categoryMix={dataset.categoryMix}
          claimTimeByMonth={dataset.claimTimeByMonth}
          countyLoad={dataset.countyLoad}
          showMap={showMap}
          showTrends={showTrends}
          submissionsByWeek={dataset.submissionsByWeek}
        />
      ) : null}
      <QueueList
        groupedByStatus={groupedByStatus}
        groups={dataset.groups}
        rows={dataset.tableRows}
        rowsPerGroup={rowsPerGroup}
      />
    </main>
  );
}
