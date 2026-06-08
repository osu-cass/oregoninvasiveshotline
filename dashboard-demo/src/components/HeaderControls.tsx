import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Select } from "@cloudflare/kumo/components/select";
import { Switch } from "@cloudflare/kumo/components/switch";
import { useForm } from "@tanstack/react-form";
import {
  ChevronDown,
  Filter,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import {
  categories,
  claimants,
  countyGroups,
  getDateRangeLabel,
  getStageLabel,
  hasActiveFilters,
  type DashboardFilters,
  type DateRangeKey,
  type ReportStage,
} from "../data/dashboardData";
import type {
  DashboardSettings,
} from "../data/dashboardSettings";

const stageOptions: Array<ReportStage | "all"> = [
  "all",
  "unclaimed",
  "claimed_needs_response",
  "responded",
  "confirmed",
  "flagged",
];

const dateRangeOptions: DateRangeKey[] = ["last-30", "last-90", "ytd", "all"];

interface HeaderControlsProps {
  /** Active dashboard filters. */
  filters: DashboardFilters;
  /** Active dashboard display settings. */
  settings: DashboardSettings;
  /** Handles dashboard filter changes. */
  onFiltersChange: (filters: DashboardFilters) => void;
  /** Clears all dashboard filters. */
  onResetFilters: () => void;
  /** Handles display setting changes. */
  onSettingsChange: (settings: Partial<DashboardSettings>) => void;
}

/** Renders the dashboard heading and Kumo-powered controls. */
export function HeaderControls({
  filters,
  settings,
  onFiltersChange,
  onResetFilters,
  onSettingsChange,
}: HeaderControlsProps) {
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const activeFilters = hasActiveFilters(filters);
  const form = useForm({
    defaultValues: {
      ...filters,
      ...settings,
    },
    onSubmit: () => undefined,
  });

  const updateFilters = (nextFilters: Partial<DashboardFilters>) => {
    onFiltersChange({ ...filters, ...nextFilters });
  };
  const updateCountyFilter = (countyKey: string, checked: boolean) => {
    const counties = checked
      ? [...filters.counties, countyKey]
      : filters.counties.filter((selectedCounty) => selectedCounty !== countyKey);

    updateFilters({ counties });
  };
  const countyFilterLabel =
    filters.counties.length === 0
      ? "All counties"
      : `${filters.counties.length} selected`;

  return (
    <header className="page-header">
      <div>
        <h1>Report Operations</h1>
        <p className="page-subtitle">
          A client demo for seeing where reports are waiting and how the
          hotline is performing.
        </p>
      </div>
      <div className="header-actions">
        <DropdownMenu
          modal={false}
          open={dateMenuOpen}
          onOpenChange={setDateMenuOpen}
        >
          <DropdownMenu.Trigger>
            <Button
              aria-label="Date range"
              className="date-select"
              variant="secondary"
              size="sm"
            >
              {getDateRangeLabel(settings.dateRange)}
              <ChevronDown aria-hidden="true" size={14} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="demo-menu date-range-menu"
            sideOffset={8}
          >
            {dateRangeOptions.map((range) => (
              <DropdownMenu.Item
                key={range}
                selected={settings.dateRange === range}
                onClick={() => onSettingsChange({ dateRange: range })}
              >
                {getDateRangeLabel(range)}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu>
        <DropdownMenu
          modal={false}
          open={displayMenuOpen}
          onOpenChange={setDisplayMenuOpen}
        >
          <DropdownMenu.Trigger>
            <Button variant="secondary" size="sm">
              <SlidersHorizontal aria-hidden="true" size={15} />
              <span className="header-action-label">Display</span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="demo-menu" sideOffset={8}>
            <form
              className="menu-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="menu-label">Display</div>
              <form.Field name="showMetricCards">
                {(field) => (
                  <div className="menu-control">
                    <Switch
                      checked={settings.showMetricCards}
                      label="Show top cards"
                      onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        onSettingsChange({ showMetricCards: checked });
                      }}
                      size="sm"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="groupedByStatus">
                {(field) => (
                  <div className="menu-control">
                    <Switch
                      checked={settings.groupedByStatus}
                      label="Grouped by status"
                      onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        onSettingsChange({ groupedByStatus: checked });
                      }}
                      size="sm"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="insightDisplay">
                {(field) => (
                  <div className="menu-control">
                    <Switch
                      checked={settings.insightDisplay !== "hidden"}
                      label="Show insights"
                      onCheckedChange={(checked) => {
                        const insightDisplay = checked ? "all" : "hidden";
                        field.handleChange(insightDisplay);
                        onSettingsChange({ insightDisplay });
                      }}
                      size="sm"
                    />
                  </div>
                )}
              </form.Field>
              <DropdownMenu.Separator />
              <div className="menu-field">
                <span>Rows per group</span>
                <form.Field name="rowsPerGroup">
                  {(field) => (
                    <Select
                      aria-label="Rows per group"
                      value={String(settings.rowsPerGroup)}
                      onValueChange={(value) => {
                        const rows = Number(value);
                        field.handleChange(rows);
                        onSettingsChange({ rowsPerGroup: rows });
                      }}
                      renderValue={(value) => `${value} rows`}
                      size="sm"
                    >
                      <Select.Option value="3">3 rows</Select.Option>
                      <Select.Option value="5">5 rows</Select.Option>
                      <Select.Option value="8">8 rows</Select.Option>
                    </Select>
                  )}
                </form.Field>
              </div>
              <div className="menu-field">
                <span>Unclaimed warning</span>
                <form.Field name="unclaimedWarningDays">
                  {(field) => (
                    <Select
                      aria-label="Unclaimed warning threshold"
                      value={String(settings.unclaimedWarningDays)}
                      onValueChange={(value) => {
                        const days = Number(value);
                        field.handleChange(days);
                        onSettingsChange({ unclaimedWarningDays: days });
                      }}
                      renderValue={(value) => `Warn after ${value} days`}
                      size="sm"
                    >
                      <Select.Option value="1">Warn after 1 day</Select.Option>
                      <Select.Option value="2">Warn after 2 days</Select.Option>
                      <Select.Option value="3">Warn after 3 days</Select.Option>
                      <Select.Option value="5">Warn after 5 days</Select.Option>
                    </Select>
                  )}
                </form.Field>
              </div>
            </form>
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
              <span className="header-action-label">
                {activeFilters ? "Filters active" : "Filters"}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="demo-menu filter-menu" sideOffset={8}>
            <form
              className="menu-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="menu-label">Filters</div>
            <div className="menu-field">
              <span>Status</span>
              <form.Field name="stage">
                {(field) => (
                  <Select
                    aria-label="Status filter"
                    value={filters.stage}
                    onValueChange={(value) => {
                      const stage = value as DashboardFilters["stage"];
                      field.handleChange(stage);
                      updateFilters({ stage });
                    }}
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
                )}
              </form.Field>
            </div>
            <div className="menu-field">
              <span>County</span>
              <div className="county-filter-summary">{countyFilterLabel}</div>
              <div className="county-filter-list">
                {countyGroups.map((group) => (
                  <div className="county-filter-group" key={group.state}>
                    <div className="county-filter-heading">{group.label}</div>
                    {group.counties.map((county) => {
                      const countyKey = `${group.state}:${county}`;

                      return (
                        <DropdownMenu.CheckboxItem
                          checked={filters.counties.includes(countyKey)}
                          closeOnClick={false}
                          key={countyKey}
                          onCheckedChange={(checked) =>
                            updateCountyFilter(countyKey, Boolean(checked))
                          }
                        >
                          {county}
                        </DropdownMenu.CheckboxItem>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="menu-field">
              <span>Category</span>
              <form.Field name="category">
                {(field) => (
                  <Select
                    aria-label="Category filter"
                    value={filters.category}
                    onValueChange={(value) => {
                      const category = value as DashboardFilters["category"];
                      field.handleChange(category);
                      updateFilters({ category });
                    }}
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
                )}
              </form.Field>
            </div>
            <div className="menu-field">
              <span>Claimant</span>
              <form.Field name="claimant">
                {(field) => (
                  <Select
                    aria-label="Claimant filter"
                    value={filters.claimant}
                    onValueChange={(value) => {
                      field.handleChange(value);
                      updateFilters({ claimant: value });
                    }}
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
                )}
              </form.Field>
            </div>
            <DropdownMenu.Separator />
            <form.Field name="publicOnly">
              {(field) => (
                <div className="menu-control">
                  <Switch
                    checked={filters.publicOnly}
                    label="Public only"
                    onCheckedChange={(checked) => {
                      field.handleChange(checked);
                      updateFilters({ publicOnly: checked });
                    }}
                    size="sm"
                  />
                </div>
              )}
            </form.Field>
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
            </form>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  );
}
