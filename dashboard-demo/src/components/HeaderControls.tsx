import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Select } from "@cloudflare/kumo/components/select";
import { Switch } from "@cloudflare/kumo/components/switch";
import { useForm } from "@tanstack/react-form";
import {
  ChevronDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import {
  categories,
  claimants,
  countyGroups,
  getDateRangeLabel,
  hasActiveFilters,
  type DashboardFilters,
  type DateRangeKey,
} from "../data/dashboardData";
import type {
  DashboardSettings,
} from "../data/dashboardSettings";
import {
  menuContent,
  menuControl,
  menuField,
  menuFooter,
  menuForm,
  menuLabel,
} from "../styles/tailwindClasses";

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
    <header className="mb-5 flex items-start justify-between gap-6 max-[1180px]:flex-col">
      <div>
        <h1 className="mb-0 text-[clamp(1.45rem,2.1vw,2rem)] font-[760] tracking-normal text-[#172033]">
          Hotline Console
        </h1>
      </div>
      <div className="flex min-w-[430px] flex-wrap justify-end gap-2.5 max-[1180px]:min-w-0 max-[1180px]:justify-start max-[720px]:w-full">
        <DropdownMenu
          modal={false}
          open={dateMenuOpen}
          onOpenChange={setDateMenuOpen}
        >
          <DropdownMenu.Trigger>
            <Button
              aria-label="Date range"
              className="min-w-[140px] justify-between"
              variant="secondary"
              size="sm"
            >
              {getDateRangeLabel(settings.dateRange)}
              <ChevronDown aria-hidden="true" size={14} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className={`${menuContent} min-w-[150px]`}
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
          open={filterMenuOpen}
          onOpenChange={setFilterMenuOpen}
        >
          <DropdownMenu.Trigger>
            <Button
              variant={activeFilters ? "primary" : "secondary"}
              size="sm"
            >
              <Filter aria-hidden="true" size={15} />
              <span className="text-[0.76rem]">
                {activeFilters ? "Filters active" : "Filters"}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className={`${menuContent} w-[294px]`} sideOffset={8}>
            <form
              className={menuForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <div className={menuLabel}>Filters</div>
              <div className={menuField}>
                <span>County</span>
                <div className="rounded-md border border-[rgba(118,130,150,0.26)] bg-white px-[9px] py-[7px] text-[0.78rem] text-slate-700">
                  {countyFilterLabel}
                </div>
                <div className="max-h-[210px] overflow-auto rounded-md border border-[rgba(118,130,150,0.2)] bg-white p-1 [&_[role=menuitemcheckbox]]:w-full">
                  {countyGroups.map((group) => (
                    <div
                      className="mt-1 border-t border-[rgba(118,130,150,0.14)] pt-1 first:mt-0 first:border-t-0 first:pt-0"
                      key={group.state}
                    >
                      <div className="px-2 pb-1 pt-1.5 text-[0.72rem] font-[680] text-slate-500">
                        {group.label}
                      </div>
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
              <div className={menuField}>
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
              <div className={menuField}>
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
                  <div className={menuControl}>
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
              <div className={menuFooter}>
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
