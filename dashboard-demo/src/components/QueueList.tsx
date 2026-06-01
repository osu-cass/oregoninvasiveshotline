import type { ReportRow, StatusGroup } from "../data/dashboardData";
import { QueueSection } from "./QueueSection";
import { ReportsTable } from "./ReportsTable";

interface QueueListProps {
  /** Whether reports should be grouped by status. */
  groupedByStatus: boolean;
  /** Computed queue groups. */
  groups: StatusGroup[];
  /** Flat report rows for ungrouped display. */
  rows: ReportRow[];
  /** Rows shown per group before show-more. */
  rowsPerGroup: number;
}

/** Renders the report queue with grouped and ungrouped display modes. */
export function QueueList({
  groupedByStatus,
  groups,
  rows,
  rowsPerGroup,
}: QueueListProps) {
  return (
    <section className="queue-panel" aria-label="Reports">
      <div className="queue-heading">
        <div>
          <h2>Reports</h2>
          <p>
            {groupedByStatus
              ? "Grouped by status, with responded open by default."
              : "Ungrouped report list sorted by submission date."}
          </p>
        </div>
        <span className="group-chip">
          {groupedByStatus ? "Grouped by status" : "Ungrouped"}
        </span>
      </div>
      {groupedByStatus ? (
        <div className="queue-stack">
          {groups.map((group) => (
            <QueueSection
              group={group}
              key={group.title}
              rowsPerGroup={rowsPerGroup}
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No reports match the current filters.</div>
      ) : (
        <ReportsTable rows={rows.slice(0, 36)} />
      )}
    </section>
  );
}
