import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Select } from "@cloudflare/kumo/components/select";
import { Switch } from "@cloudflare/kumo/components/switch";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type {
  ReportRow,
  ReviewerScoreRow,
  StatusGroup,
} from "../data/dashboardData";
import {
  menuContent,
  menuControl,
  emptyState,
  menuField,
  menuForm,
  menuLabel,
} from "../styles/tailwindClasses";
import { QueueSection } from "./QueueSection";
import { ReportsTable } from "./ReportsTable";
import { ReviewerScoresGrid } from "./ReviewerScoresGrid";

interface QueueListProps {
  /** Whether reports should be grouped by status. */
  groupedByStatus: boolean;
  /** Computed queue groups. */
  groups: StatusGroup[];
  /** Handles grouped display changes. */
  onGroupedByStatusChange: (groupedByStatus: boolean) => void;
  /** Handles row-count display changes. */
  onRowsPerGroupChange: (rowsPerGroup: number) => void;
  /** Reviewer score rows sorted by global score ascending. */
  reviewerScores: ReviewerScoreRow[];
  /** Flat report rows for ungrouped display. */
  rows: ReportRow[];
  /** Rows shown per group before show-more. */
  rowsPerGroup: number;
}

type QueueView = "reports" | "reviewers";

const viewOptions: Array<{
  description: string;
  key: QueueView;
  label: string;
}> = [
  {
    description: "Reports by assignment and response status.",
    key: "reports",
    label: "Reports",
  },
  {
    description: "Reviewer capacity and response timing.",
    key: "reviewers",
    label: "Reviewers",
  },
];

/** Renders the report queue with grouped and ungrouped display modes. */
export function QueueList({
  groupedByStatus,
  groups,
  onGroupedByStatusChange,
  onRowsPerGroupChange,
  reviewerScores,
  rows,
  rowsPerGroup,
}: QueueListProps) {
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [view, setView] = useState<QueueView>("reports");
  const selectedView =
    viewOptions.find((option) => option.key === view) ?? viewOptions[0];
  const showingReports = view === "reports";

  return (
    <div className="grid gap-2.5">
      <div className="mt-0.5 flex items-center justify-between gap-4 max-[720px]:items-start max-[720px]:flex-col">
        <div>
          <DropdownMenu
            modal={false}
            open={viewMenuOpen}
            onOpenChange={setViewMenuOpen}
          >
            <h2 className="mb-0">
              <DropdownMenu.Trigger>
                <button
                  className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[1.08rem] font-[740] leading-tight tracking-normal text-[#172033] hover:text-[#174b91] focus-visible:text-[#174b91]"
                  type="button"
                >
                  {selectedView.label}
                  <ChevronDown aria-hidden="true" size={18} />
                </button>
              </DropdownMenu.Trigger>
            </h2>
            <DropdownMenu.Content className={`${menuContent} min-w-[270px]`} sideOffset={8}>
              <div className={menuLabel}>View</div>
              {viewOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.key}
                  selected={option.key === view}
                  onClick={() => setView(option.key)}
                >
                  <span className="grid gap-0.5">
                    <span className="text-[0.86rem] font-[650] text-gray-800">
                      {option.label}
                    </span>
                    <small className="text-[0.74rem] leading-tight text-slate-500">
                      {option.description}
                    </small>
                  </span>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu>
          {!showingReports ? (
            <p className="mb-0 mt-1 text-[0.88rem] text-[#5f6d7e]">
              Reviewer capacity and response trends.
            </p>
          ) : null}
        </div>
        {showingReports ? (
          <div className="flex items-center gap-2 max-[720px]:flex-wrap max-[720px]:justify-start">
            <span className="whitespace-nowrap rounded-full bg-[#eef3f8] px-2.5 py-[5px] text-[0.78rem] font-[650] text-[#46596d]">
              {groupedByStatus ? "Grouped by status" : "Ungrouped"}
            </span>
            <DropdownMenu
              modal={false}
              open={displayMenuOpen}
              onOpenChange={setDisplayMenuOpen}
            >
              <DropdownMenu.Trigger>
                <Button variant="secondary" size="sm">
                  <SlidersHorizontal aria-hidden="true" size={15} />
                  <span className="text-[0.76rem]">Display</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                className={`${menuContent} min-w-[230px]`}
                sideOffset={8}
              >
                <form
                  className={menuForm}
                  onSubmit={(event) => event.preventDefault()}
                >
                  <div className={menuLabel}>Display</div>
                  <div className={menuControl}>
                    <Switch
                      checked={groupedByStatus}
                      label="Grouped by status"
                      onCheckedChange={onGroupedByStatusChange}
                      size="sm"
                    />
                  </div>
                  <DropdownMenu.Separator />
                  <div className={menuField}>
                    <span>Rows per group</span>
                    <Select
                      aria-label="Rows per group"
                      value={String(rowsPerGroup)}
                      onValueChange={(value) =>
                        onRowsPerGroupChange(Number(value))
                      }
                      renderValue={(value) => `${value} rows`}
                      size="sm"
                    >
                      <Select.Option value="3">3 rows</Select.Option>
                      <Select.Option value="5">5 rows</Select.Option>
                      <Select.Option value="8">8 rows</Select.Option>
                    </Select>
                  </div>
                </form>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
      <section className="p-0" aria-label={selectedView.label}>
        {!showingReports ? (
          <ReviewerScoresGrid rows={reviewerScores} />
        ) : groupedByStatus ? (
          <div className="grid gap-2.5">
            {groups.map((group) => (
              <QueueSection
                group={group}
                key={group.title}
                rowsPerGroup={rowsPerGroup}
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className={emptyState}>No reports match the current filters.</div>
        ) : (
          <ReportsTable rows={rows.slice(0, 36)} />
        )}
      </section>
    </div>
  );
}
