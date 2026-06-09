import { Badge } from "@cloudflare/kumo/components/badge";
import { Button } from "@cloudflare/kumo/components/button";
import { Chart } from "@cloudflare/kumo/components/chart";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from "@cloudflare/kumo/components/dialog";
import { PieChart } from "echarts/charts";
import { LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { ExternalLink, X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import {
  categoryColors,
  type CategoryDatum,
  type CategoryDetail,
  type ReportCategory,
  type ReportStage,
} from "../data/dashboardData";
import {
  insightPanel,
  panelHeading,
  panelHint,
  panelTitle,
} from "../styles/tailwindClasses";

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface CategoryMixChartProps {
  /** Category drilldown data. */
  categoryDetails: CategoryDetail[];
  /** Category mix data. */
  categoryMix: CategoryDatum[];
}

const badgeByStatus = {
  unclaimed: "warning",
  claimed_needs_response: "error",
  responded: "success",
  confirmed: "info",
  flagged: "secondary",
} as const;

const labelByStatus = {
  unclaimed: "Unclaimed",
  claimed_needs_response: "Needs response",
  responded: "Responded",
  confirmed: "Confirmed",
  flagged: "Flagged",
} as const;

/** Renders report category mix and a category drilldown dialog. */
export function CategoryMixChart({
  categoryDetails,
  categoryMix,
}: CategoryMixChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(
    null,
  );
  const sortedMix = categoryMix.slice().sort((a, b) => b.value - a.value);
  const selectedDetail =
    categoryDetails.find((detail) => detail.category === selectedCategory) ?? null;

  return (
    <article className={insightPanel}>
      <div className={panelHeading}>
        <div>
          <h2 className={panelTitle}>Category mix</h2>
          <p className={panelHint}>Click category for more info</p>
        </div>
      </div>
      <Chart
        echarts={echarts}
        height={190}
        onEvents={{
          click: (params) => {
            if (isReportCategory(params.name)) {
              setSelectedCategory(params.name);
            }
          },
        }}
        options={{
          color: sortedMix.map((item) => categoryColors[item.label]),
          legend: {
            bottom: 0,
            icon: "circle",
            itemGap: 10,
            itemHeight: 8,
            itemWidth: 8,
            textStyle: {
              color: "#4f6075",
              fontSize: 11,
              fontWeight: 600,
            },
          },
          tooltip: {
            confine: true,
            trigger: "item",
            valueFormatter: (value) => `${value} reports`,
          },
          series: [
            {
              avoidLabelOverlap: true,
              center: ["50%", "43%"],
              data: sortedMix.map((item) => ({
                itemStyle: {
                  color: categoryColors[item.label],
                },
                name: item.label,
                value: item.value,
              })),
              itemStyle: {
                borderColor: "#ffffff",
                borderRadius: 4,
                borderWidth: 2,
              },
              label: {
                color: "#334155",
                fontSize: 11,
                formatter: "{c}",
                fontWeight: 650,
                show: true,
              },
              labelLine: {
                length: 8,
                length2: 6,
              },
              name: "Reports",
              radius: ["43%", "64%"],
              type: "pie",
            },
          ],
        }}
      />
      <DialogRoot
        open={selectedDetail !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCategory(null);
          }
        }}
      >
        {selectedDetail ? (
          <Dialog
            className="overflow-hidden rounded-lg"
            size="lg"
            style={
              {
                "--category-accent": selectedDetail.color,
                maxWidth: "900px",
                width: "min(900px, calc(100vw - 2rem))",
              } as CSSProperties
            }
          >
            <div className="h-1 bg-[var(--category-accent)]" />
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(118,130,150,0.16)] px-5 pb-4 pt-[18px] max-[720px]:p-4">
              <div>
                <DialogTitle className="mb-1 text-[1.22rem] font-[760] tracking-normal text-[#172033]">
                  {selectedDetail.category}
                </DialogTitle>
                <DialogDescription>
                  {selectedDetail.total} reports,{" "}
                  {formatPercent(selectedDetail.share)} of the selected range.
                </DialogDescription>
              </div>
              <DialogClose
                render={(props) => (
                  <Button
                    {...props}
                    aria-label="Close category details"
                    shape="square"
                    size="sm"
                    variant="ghost"
                  >
                    <X aria-hidden="true" size={16} />
                  </Button>
                )}
              />
            </div>
            <div className="grid max-h-[calc(100vh-11rem)] gap-3 overflow-y-auto px-5 pb-5 pt-4 max-[720px]:px-4 max-[720px]:pb-4 max-[720px]:pt-3.5">
              <div className="grid grid-cols-4 gap-2.5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
                {renderStat("Reports", String(selectedDetail.total), "In range")}
                {renderStat(
                  "Unresolved",
                  String(selectedDetail.unresolved),
                  `${selectedDetail.confirmed} confirmed`,
                )}
                {renderStat(
                  "Median response",
                  formatDays(selectedDetail.medianResponseDays),
                  `Claim ${formatDays(selectedDetail.medianClaimDays)}`,
                )}
                {renderStat(
                  "Needs response",
                  String(selectedDetail.needsResponse),
                  `${selectedDetail.unclaimed} unclaimed`,
                )}
              </div>
              <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2.5 max-[900px]:grid-cols-1">
                <div className="rounded-lg border border-[rgba(118,130,150,0.18)] bg-white p-3">
                  <div className="mb-[9px] flex items-center justify-between gap-2.5">
                    <h3 className="mb-0 text-[0.88rem] font-[720] tracking-normal text-[#172033]">
                      Resolution
                    </h3>
                    <span className="text-[0.76rem] text-slate-500">
                      {formatPercent(selectedDetail.confirmed / selectedDetail.total)}
                    </span>
                  </div>
                  {renderSplitBar(
                    selectedDetail.confirmed,
                    selectedDetail.unresolved,
                    "Confirmed",
                    "Unresolved",
                  )}
                  <div className="mb-[9px] mt-3 flex items-center justify-between gap-2.5 border-t border-[rgba(118,130,150,0.12)] pt-3">
                    <h3 className="mb-0 text-[0.88rem] font-[720] tracking-normal text-[#172033]">
                      Visibility
                    </h3>
                    <span className="text-[0.76rem] text-slate-500">
                      {formatPercent(selectedDetail.publicCount / selectedDetail.total)} public
                    </span>
                  </div>
                  {renderSplitBar(
                    selectedDetail.publicCount,
                    selectedDetail.privateCount,
                    "Public",
                    "Private",
                  )}
                </div>
                <div className="rounded-lg border border-[rgba(118,130,150,0.18)] bg-white p-3">
                  <div className="mb-[9px] flex items-center justify-between gap-2.5">
                    <h3 className="mb-0 text-[0.88rem] font-[720] tracking-normal text-[#172033]">
                      Top counties
                    </h3>
                  </div>
                  <div className="grid gap-[7px]">
                    {selectedDetail.topCounties.map((county) => (
                      <div
                        className="flex min-h-[30px] items-center justify-between gap-3 rounded-md bg-slate-50 px-[9px] py-[7px] text-[0.82rem] text-slate-700"
                        key={`${county.state}:${county.county}`}
                      >
                        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {county.county}, {county.state}
                        </span>
                        <strong className="font-[740] text-[#172033]">
                          {county.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[rgba(118,130,150,0.18)] bg-white p-3">
                  <div className="mb-[9px] flex items-center justify-between gap-2.5">
                    <h3 className="mb-0 text-[0.88rem] font-[720] tracking-normal text-[#172033]">
                      Top species
                    </h3>
                  </div>
                  <div className="grid gap-[7px]">
                    {selectedDetail.topSpecies.map((species) => (
                      <div
                        className="flex min-h-[30px] items-center justify-between gap-3 rounded-md bg-slate-50 px-[9px] py-[7px] text-[0.82rem] text-slate-700"
                        key={species.species}
                      >
                        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {species.species}
                        </span>
                        <strong className="font-[740] text-[#172033]">
                          {species.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[rgba(118,130,150,0.18)] bg-white p-3">
                <div className="mb-[9px] flex items-center justify-between gap-2.5">
                  <h3 className="mb-0 text-[0.88rem] font-[720] tracking-normal text-[#172033]">
                    Priority reports
                  </h3>
                  <span className="text-[0.76rem] text-slate-500">
                    Oldest waiting first
                  </span>
                </div>
                <div className="grid gap-[7px]">
                  {selectedDetail.priorityReports.map((report) => (
                    <div
                      className="flex min-h-12 items-center justify-between gap-3 rounded-[7px] bg-slate-50 px-2.5 py-2"
                      key={report.id}
                    >
                      <div className="grid min-w-0 gap-0.5">
                        <strong className="text-[0.86rem] text-[#173f7c]">
                          {report.id}
                        </strong>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.76rem] text-slate-500">
                          {report.county}, {report.state} · {report.age} ·{" "}
                          {report.lastAction}
                        </span>
                      </div>
                      <Badge
                        className={
                          report.status === "flagged"
                            ? "border border-violet-200 bg-violet-50 text-violet-800"
                            : undefined
                        }
                        variant={badgeByStatus[report.status]}
                      >
                        {getStatusLabel(report.status)}
                      </Badge>
                      <Button
                        aria-label={`Open ${report.id} in a new tab`}
                        shape="square"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(
                            report.issueUrl,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        <ExternalLink aria-hidden="true" size={15} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Dialog>
        ) : null}
      </DialogRoot>
    </article>
  );
}

/** Renders a compact metric cell for the dialog. */
function renderStat(label: string, value: string, detail: string) {
  return (
    <div className="grid gap-[3px] rounded-lg border border-[rgba(118,130,150,0.18)] bg-[#fbfcfd] px-3 py-2.5">
      <span className="text-[0.76rem] not-italic text-slate-500">{label}</span>
      <strong className="text-[1.18rem] font-[760] leading-none text-[#172033]">
        {value}
      </strong>
      <em className="text-[0.76rem] not-italic text-slate-500">{detail}</em>
    </div>
  );
}

/** Renders a two-part proportional split bar. */
function renderSplitBar(
  leftValue: number,
  rightValue: number,
  leftLabel: string,
  rightLabel: string,
) {
  const total = Math.max(leftValue + rightValue, 1);
  const leftPercent = (leftValue / total) * 100;

  return (
    <div className="grid gap-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <span
          className="block h-full rounded-[inherit] bg-[var(--category-accent)]"
          style={{ width: `${leftPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-[0.76rem] text-slate-500">
        <span>
          {leftLabel} <strong className="font-[740] text-[#172033]">{leftValue}</strong>
        </span>
        <span>
          {rightLabel} <strong className="font-[740] text-[#172033]">{rightValue}</strong>
        </span>
      </div>
    </div>
  );
}

/** Returns whether an ECharts event name is a known report category. */
function isReportCategory(value: unknown): value is ReportCategory {
  return typeof value === "string" && value in categoryColors;
}

/** Returns a human-readable report stage label. */
function getStatusLabel(stage: ReportStage): string {
  return labelByStatus[stage];
}

/** Formats a day duration for compact stat display. */
function formatDays(value: number): string {
  return value === 0 ? "n/a" : `${value.toFixed(1)}d`;
}

/** Formats a ratio as a whole-number percentage. */
function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
