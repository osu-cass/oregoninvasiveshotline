import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Select } from "@cloudflare/kumo/components/select";
import { Switch } from "@cloudflare/kumo/components/switch";
import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  categories,
  claimants,
  counties,
  getDateRangeLabel,
  getStageLabel,
  hasActiveFilters,
  type DashboardFilters,
  type DateRangeKey,
  type ReportStage,
} from "../data/dashboardData";

const stageOptions: Array<ReportStage | "all"> = [
  "all",
  "unclaimed",
  "claimed_needs_response",
  "responded",
  "confirmed",
  "flagged",
];

interface HeaderControlsProps {
  /** Current date range. */
  dateRange: DateRangeKey;
  /** Active dashboard filters. */
  filters: DashboardFilters;
  /** Whether queue rows are grouped by status. */
  groupedByStatus: boolean;
  /** Current row limit for grouped sections. */
  rowsPerGroup: number;
  /** Whether the map panel is visible. */
  showMap: boolean;
  /** Whether trend panels are visible. */
  showTrends: boolean;
  /** Handles date range changes. */
  onDateRangeChange: (range: DateRangeKey) => void;
  /** Handles dashboard filter changes. */
  onFiltersChange: (filters: DashboardFilters) => void;
  /** Handles status grouping changes. */
  onGroupedByStatusChange: (checked: boolean) => void;
  /** Clears all dashboard filters. */
  onResetFilters: () => void;
  /** Handles row limit changes. */
  onRowsPerGroupChange: (rows: number) => void;
  /** Handles map visibility changes. */
  onShowMapChange: (checked: boolean) => void;
  /** Handles trend visibility changes. */
  onShowTrendsChange: (checked: boolean) => void;
}

/** Renders the dashboard heading and Kumo-powered controls. */
export function HeaderControls({
  dateRange,
  filters,
  groupedByStatus,
  rowsPerGroup,
  showMap,
  showTrends,
  onDateRangeChange,
  onFiltersChange,
  onGroupedByStatusChange,
  onResetFilters,
  onRowsPerGroupChange,
  onShowMapChange,
  onShowTrendsChange,
}: HeaderControlsProps) {
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const activeFilters = hasActiveFilters(filters);

  const updateFilters = (nextFilters: Partial<DashboardFilters>) => {
    onFiltersChange({ ...filters, ...nextFilters });
  };

  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Private Hotline</p>
        <h1>Report Operations</h1>
        <p className="page-subtitle">
          A client demo for seeing where reports are waiting and how the
          hotline is performing.
        </p>
      </div>
      <div className="header-actions">
        <Select
          aria-label="Date range"
          value={dateRange}
          onValueChange={(value) => onDateRangeChange(value as DateRangeKey)}
          renderValue={(value) => getDateRangeLabel(value as DateRangeKey)}
          size="sm"
          className="date-select"
        >
          <Select.Option value="last-30">Last 30 days</Select.Option>
          <Select.Option value="last-90">Last 90 days</Select.Option>
          <Select.Option value="ytd">Year to date</Select.Option>
          <Select.Option value="all">All time</Select.Option>
        </Select>
        <DropdownMenu
          modal={false}
          open={displayMenuOpen}
          onOpenChange={setDisplayMenuOpen}
        >
          <DropdownMenu.Trigger>
            <Button variant="secondary" size="sm">
              <SlidersHorizontal aria-hidden="true" size={15} />
              Display
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="demo-menu" sideOffset={8}>
            <div className="menu-label">Display</div>
            <div className="menu-control">
              <Switch
                checked={groupedByStatus}
                label="Grouped by status"
                onCheckedChange={onGroupedByStatusChange}
                size="sm"
              />
            </div>
            <div className="menu-control">
              <Switch
                checked={showTrends}
                label="Show trends"
                onCheckedChange={onShowTrendsChange}
                size="sm"
              />
            </div>
            <div className="menu-control">
              <Switch
                checked={showMap}
                label="Show map"
                onCheckedChange={onShowMapChange}
                size="sm"
              />
            </div>
            <DropdownMenu.Separator />
            <div className="menu-label">Rows per group</div>
            <Select
              aria-label="Rows per group"
              value={String(rowsPerGroup)}
              onValueChange={(value) => onRowsPerGroupChange(Number(value))}
              renderValue={(value) => `${value} rows`}
              size="sm"
            >
              <Select.Option value="3">3 rows</Select.Option>
              <Select.Option value="5">5 rows</Select.Option>
              <Select.Option value="8">8 rows</Select.Option>
            </Select>
          </DropdownMenu.Content>
        </DropdownMenu>
        <DropdownMenu
          modal={false}
          open={filterMenuOpen}
          onOpenChange={setFilterMenuOpen}
        >
          <DropdownMenu.Trigger>
            <Button
              variant={activeFilters ? "primary" : "secondary"}
              size="sm"
            >
              <Filter aria-hidden="true" size={15} />
              {activeFilters ? "Filters active" : "Filters"}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="demo-menu filter-menu" sideOffset={8}>
            <div className="menu-label">Filters</div>
            <div className="menu-field">
              <span>Status</span>
              <Select
                aria-label="Status filter"
                value={filters.stage}
                onValueChange={(value) =>
                  updateFilters({ stage: value as DashboardFilters["stage"] })
                }
                renderValue={(value) =>
                  getStageLabel(value as ReportStage | "all")
                }
                size="sm"
              >
                {stageOptions.map((stage) => (
                  <Select.Option key={stage} value={stage}>
                    {getStageLabel(stage)}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="menu-field">
              <span>County</span>
              <Select
                aria-label="County filter"
                value={filters.county}
                onValueChange={(value) => updateFilters({ county: value })}
                renderValue={(value) =>
                  value === "all" ? "All counties" : String(value)
                }
                size="sm"
              >
                <Select.Option value="all">All counties</Select.Option>
                {counties.map((county) => (
                  <Select.Option key={county} value={county}>
                    {county}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="menu-field">
              <span>Category</span>
              <Select
                aria-label="Category filter"
                value={filters.category}
                onValueChange={(value) =>
                  updateFilters({ category: value as DashboardFilters["category"] })
                }
                renderValue={(value) =>
                  value === "all" ? "All categories" : String(value)
                }
                size="sm"
              >
                <Select.Option value="all">All categories</Select.Option>
                {categories.map((category) => (
                  <Select.Option key={category} value={category}>
                    {category}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="menu-field">
              <span>Claimant</span>
              <Select
                aria-label="Claimant filter"
                value={filters.claimant}
                onValueChange={(value) => updateFilters({ claimant: value })}
                renderValue={(value) =>
                  value === "all" ? "All claimants" : String(value)
                }
                size="sm"
              >
                <Select.Option value="all">All claimants</Select.Option>
                {claimants.map((claimant) => (
                  <Select.Option key={claimant} value={claimant}>
                    {claimant}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <DropdownMenu.Separator />
            <div className="menu-control">
              <Switch
                checked={filters.flaggedOnly}
                label="Flagged only"
                onCheckedChange={(checked) => updateFilters({ flaggedOnly: checked })}
                size="sm"
              />
            </div>
            <div className="menu-control">
              <Switch
                checked={filters.publicOnly}
                label="Public only"
                onCheckedChange={(checked) => updateFilters({ publicOnly: checked })}
                size="sm"
              />
            </div>
            <DropdownMenu.Separator />
            <div className="menu-footer">
              <Button
                variant="secondary"
                size="sm"
                disabled={!activeFilters}
                onClick={onResetFilters}
              >
                <RotateCcw aria-hidden="true" size={14} />
                Reset filters
              </Button>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  );
}
