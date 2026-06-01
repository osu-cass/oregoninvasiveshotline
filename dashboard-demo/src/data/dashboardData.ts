export type DateRangeKey = "last-30" | "last-90" | "ytd" | "all";

export type ReportStage =
  | "unclaimed"
  | "claimed_needs_response"
  | "responded"
  | "confirmed"
  | "flagged";

export type ReportCategory = (typeof categories)[number];

export interface DashboardFilters {
  /** Workflow stage to include, or all stages. */
  stage: ReportStage | "all";
  /** County to include, or all counties. */
  county: string | "all";
  /** Report category to include, or all categories. */
  category: ReportCategory | "all";
  /** Claimant to include, or all claimants. */
  claimant: string | "all";
  /** Whether to show only flagged reports. */
  flaggedOnly: boolean;
  /** Whether to show only public reports. */
  publicOnly: boolean;
}

export interface HotlineReport {
  /** Stable public-facing report id. */
  id: string;
  /** Date the report was submitted. */
  submittedAt: Date;
  /** Date the report was claimed, when applicable. */
  claimedAt: Date | null;
  /** Date the report was archived/responded, when applicable. */
  respondedAt: Date | null;
  /** Date the report was identified, when applicable. */
  confirmedAt: Date | null;
  /** Claimed user display name. */
  claimant: string | null;
  /** Oregon county name. */
  county: string;
  /** Reported category. */
  category: string;
  /** Reported species display name. */
  reportedSpecies: string;
  /** Confirmed species display name. */
  actualSpecies: string | null;
  /** Admin flag for reports worth remembering. */
  flagged: boolean;
  /** Public visibility state. */
  public: boolean;
}

export interface ReportRow {
  /** Stable display id for the sample report. */
  id: string;
  /** Date the public report was submitted. */
  submitted: string;
  /** Human-readable age in the current dashboard window. */
  age: string;
  /** Optional assignee name for claimed reports. */
  claimedBy: string;
  /** Oregon county name for grouping and filtering. */
  county: string;
  /** Publicly reported category. */
  category: string;
  /** Recent operational note shown in the queue. */
  lastAction: string;
  /** Demo workflow bucket. */
  status: ReportStage;
}

export interface StatusGroup {
  /** Queue group heading. */
  title: string;
  /** Short operational purpose for the group. */
  description: string;
  /** Current count in the selected date range. */
  count: number;
  /** Oldest item age shown as a triage cue. */
  oldestAge: string;
  /** Optional warning threshold text. */
  threshold?: string;
  /** Whether the group starts expanded. */
  defaultOpen: boolean;
  /** Demo rows displayed by the group. */
  rows: ReportRow[];
  /** Stable group stage. */
  stage: ReportStage;
}

export interface MetricCardData {
  /** Card label. */
  label: string;
  /** Primary value. */
  value: string;
  /** Supporting context. */
  detail: string;
  /** Optional change indicator. */
  delta?: string;
  /** Visual tone for the delta. */
  tone?: "neutral" | "good" | "warning";
}

export interface CategoryDatum {
  /** Category label. */
  label: string;
  /** Count in the selected range. */
  value: number;
}

export interface CountyDatum {
  /** Oregon county name. */
  county: string;
  /** Count in the selected range. */
  value: number;
}

export interface DashboardDataset {
  /** Generated reports in the current date range. */
  reports: HotlineReport[];
  /** Top metric cards. */
  metrics: MetricCardData[];
  /** Queue groups derived from reports. */
  groups: StatusGroup[];
  /** Weekly submission chart data. */
  submissionsByWeek: [number, number][];
  /** Monthly median time to claim chart data. */
  claimTimeByMonth: { label: string; value: number }[];
  /** Category mix derived from reports. */
  categoryMix: CategoryDatum[];
  /** County workload derived from reports. */
  countyLoad: CountyDatum[];
  /** Flat report rows for ungrouped display. */
  tableRows: ReportRow[];
}

export const counties = [
  "Baker",
  "Benton",
  "Clackamas",
  "Clatsop",
  "Columbia",
  "Coos",
  "Crook",
  "Curry",
  "Deschutes",
  "Douglas",
  "Jackson",
  "Jefferson",
  "Josephine",
  "Klamath",
  "Lane",
  "Lincoln",
  "Linn",
  "Malheur",
  "Marion",
  "Multnomah",
  "Polk",
  "Tillamook",
  "Umatilla",
  "Union",
  "Wasco",
  "Washington",
  "Yamhill",
] as const;

export const categories = ["Plant", "Insect", "Aquatic", "Mollusk", "Pathogen"] as const;

const reportedSpeciesByCategory = {
  Plant: ["Tree-of-heaven", "Garlic mustard", "Japanese knotweed", "Puncturevine"],
  Insect: ["Emerald ash borer", "Spotted lanternfly", "Japanese beetle"],
  Aquatic: ["Quagga mussel", "New Zealand mudsnail", "Hydrilla"],
  Mollusk: ["Zebra mussel", "Brown garden snail", "Chinese mystery snail"],
  Pathogen: ["Sudden oak death", "White pine blister rust"],
} as const;

export const claimants = [
  "A. Morgan",
  "C. Nguyen",
  "J. Riley",
  "M. Ellis",
  "S. Patel",
  "T. Wallace",
  "R. Kim",
] as const;

const now = new Date("2026-05-29T12:00:00-07:00");

/** Creates a generated dashboard dataset for a selected range. */
export function createDashboardDataset(
  sourceReports: HotlineReport[],
  range: DateRangeKey,
  filters: DashboardFilters,
): DashboardDataset {
  const reports = filterReports(filterReportsByRange(sourceReports, range), filters);
  const tableRows = reports
    .slice()
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
    .map(toReportRow);

  return {
    reports,
    metrics: createMetrics(reports),
    groups: createGroups(reports),
    submissionsByWeek: createSubmissionsByWeek(reports),
    claimTimeByMonth: createClaimTimeByMonth(reports),
    categoryMix: createCategoryMix(reports),
    countyLoad: createCountyLoad(reports),
    tableRows,
  };
}

/** Creates an empty filter set for the dashboard controls. */
export function createDefaultFilters(): DashboardFilters {
  return {
    stage: "all",
    county: "all",
    category: "all",
    claimant: "all",
    flaggedOnly: false,
    publicOnly: false,
  };
}

/** Returns whether any dashboard filter is active. */
export function hasActiveFilters(filters: DashboardFilters): boolean {
  return (
    filters.stage !== "all" ||
    filters.county !== "all" ||
    filters.category !== "all" ||
    filters.claimant !== "all" ||
    filters.flaggedOnly ||
    filters.publicOnly
  );
}

/** Returns a human-readable workflow stage label. */
export function getStageLabel(stage: ReportStage | "all"): string {
  const labels: Record<ReportStage | "all", string> = {
    all: "All statuses",
    unclaimed: "Unclaimed",
    claimed_needs_response: "Needs response",
    responded: "Responded",
    confirmed: "Confirmed",
    flagged: "Flagged",
  };
  return labels[stage];
}

/** Generates a fake but coherent report dataset for the current reload. */
export function createGeneratedReports(): HotlineReport[] {
  return generateReports();
}

/** Returns the display label for a date range key. */
export function getDateRangeLabel(range: DateRangeKey): string {
  const labels: Record<DateRangeKey, string> = {
    "last-30": "Last 30 days",
    "last-90": "Last 90 days",
    ytd: "Year to date",
    all: "All time",
  };
  return labels[range];
}

/** Returns the workflow stage for a generated report. */
export function getReportStage(report: HotlineReport): ReportStage {
  if (report.flagged) {
    return "flagged";
  }

  if (report.confirmedAt) {
    return "confirmed";
  }

  if (report.respondedAt) {
    return "responded";
  }

  if (report.claimedAt) {
    return "claimed_needs_response";
  }

  return "unclaimed";
}

function generateReports(): HotlineReport[] {
  const reportCount = 185 + randomInt(0, 34);

  return Array.from({ length: reportCount }, (_, index) => {
    const submittedAt = daysAgo(randomInt(0, 220));
    const category = pick(categories);
    const wasClaimed = Math.random() > 0.16;
    const wasResponded = wasClaimed && Math.random() > 0.28;
    const wasConfirmed = wasResponded && Math.random() > 0.62;
    const claimedAt = wasClaimed ? addDays(submittedAt, randomInt(0, 8)) : null;
    const respondedAt =
      wasResponded && claimedAt ? addDays(claimedAt, randomInt(1, 18)) : null;
    const confirmedAt =
      wasConfirmed && respondedAt ? addDays(respondedAt, randomInt(0, 9)) : null;
    const reportedSpecies = pick(reportedSpeciesByCategory[category]);

    return {
      id: `2026-${String(index + 221).padStart(4, "0")}`,
      submittedAt,
      claimedAt,
      respondedAt,
      confirmedAt,
      claimant: wasClaimed ? pick(claimants) : null,
      county: pickWeightedCounty(),
      category,
      reportedSpecies,
      actualSpecies: confirmedAt ? reportedSpecies : null,
      flagged: Math.random() > 0.9,
      public: Math.random() > 0.38,
    };
  });
}

function filterReportsByRange(
  reports: HotlineReport[],
  range: DateRangeKey,
): HotlineReport[] {
  if (range === "all") {
    return reports;
  }

  const start =
    range === "last-30"
      ? daysAgo(30)
      : range === "last-90"
        ? daysAgo(90)
        : new Date("2026-01-01T00:00:00-08:00");

  return reports.filter((report) => report.submittedAt >= start);
}

function filterReports(
  reports: HotlineReport[],
  filters: DashboardFilters,
): HotlineReport[] {
  return reports.filter((report) => {
    if (filters.stage !== "all" && getReportStage(report) !== filters.stage) {
      return false;
    }

    if (filters.county !== "all" && report.county !== filters.county) {
      return false;
    }

    if (filters.category !== "all" && report.category !== filters.category) {
      return false;
    }

    if (filters.claimant !== "all" && report.claimant !== filters.claimant) {
      return false;
    }

    if (filters.flaggedOnly && !report.flagged) {
      return false;
    }

    if (filters.publicOnly && !report.public) {
      return false;
    }

    return true;
  });
}

function createMetrics(reports: HotlineReport[]): MetricCardData[] {
  const unclaimed = reports.filter((report) => !report.claimedAt);
  const needsResponse = reports.filter(
    (report) => report.claimedAt && !report.respondedAt,
  );
  const flagged = reports.filter((report) => report.flagged);

  return [
    {
      label: "Needs response",
      value: String(needsResponse.length),
      detail: "Claimed but not archived",
      delta: `${needsResponse.filter((report) => ageInDays(report.submittedAt) > 7).length} over threshold`,
      tone: "warning",
    },
    {
      label: "Unclaimed",
      value: String(unclaimed.length),
      detail: oldestDetail(unclaimed),
      delta: `${unclaimed.filter((report) => ageInDays(report.submittedAt) > 2).length} over threshold`,
      tone: "warning",
    },
    {
      label: "Median time to claim",
      value: `${medianDays(
        reports.flatMap((report) =>
          report.claimedAt ? [daysBetween(report.submittedAt, report.claimedAt)] : [],
        ),
      ).toFixed(1)}d`,
      detail: "Generated from claimed reports",
      delta: "Computed on reload",
      tone: "good",
    },
    {
      label: "Median time to respond",
      value: `${medianDays(
        reports.flatMap((report) =>
          report.claimedAt && report.respondedAt
            ? [daysBetween(report.claimedAt, report.respondedAt)]
            : [],
        ),
      ).toFixed(1)}d`,
      detail: "Archived response time",
      delta: "Computed on reload",
      tone: "neutral",
    },
    {
      label: "Flagged",
      value: String(flagged.length),
      detail: "Important reports",
    },
  ];
}

function createGroups(reports: HotlineReport[]): StatusGroup[] {
  const groups = [
    {
      title: "Unclaimed reports",
      description: "Created but not assigned.",
      stage: "unclaimed",
      threshold: "Warn after 2 days",
      defaultOpen: false,
    },
    {
      title: "Claimed, needs response",
      description: "Claimed reports that are not archived.",
      stage: "claimed_needs_response",
      threshold: "Warn after 7 days",
      defaultOpen: false,
    },
    {
      title: "Responded",
      description: "Archived reports in the selected range.",
      stage: "responded",
      defaultOpen: true,
    },
    {
      title: "Confirmed",
      description: "Responded reports with confirmed species.",
      stage: "confirmed",
      defaultOpen: false,
    },
    {
      title: "Flagged reports",
      description: "Important reports saved for follow-up.",
      stage: "flagged",
      defaultOpen: false,
    },
  ] satisfies Array<
    Pick<
      StatusGroup,
      "defaultOpen" | "description" | "stage" | "threshold" | "title"
    >
  >;

  return groups.map((group) => {
    const groupedReports = reports
      .filter((report) => getReportStage(report) === group.stage)
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

    return {
      ...group,
      count: groupedReports.length,
      oldestAge: oldestAge(groupedReports),
      rows: groupedReports.map(toReportRow),
    };
  });
}

function createSubmissionsByWeek(reports: HotlineReport[]): [number, number][] {
  const buckets = new Map<number, number>();

  for (const report of reports) {
    const bucket = startOfWeek(report.submittedAt).getTime();
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
}

function createClaimTimeByMonth(
  reports: HotlineReport[],
): { label: string; value: number }[] {
  const monthMap = new Map<number, number[]>();

  for (const report of reports) {
    if (!report.claimedAt) {
      continue;
    }

    const month = report.submittedAt.getMonth();
    const values = monthMap.get(month) ?? [];
    values.push(daysBetween(report.submittedAt, report.claimedAt));
    monthMap.set(month, values);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a - b)
    .slice(-6)
    .map(([month, values]) => ({
      label: new Date(2026, month, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
      value: medianDays(values),
    }));
}

function createCategoryMix(reports: HotlineReport[]): CategoryDatum[] {
  return categories
    .map((category) => ({
      label: category,
      value: reports.filter((report) => report.category === category).length,
    }))
    .filter((item) => item.value > 0);
}

function createCountyLoad(reports: HotlineReport[]): CountyDatum[] {
  return counties
    .map((county) => ({
      county,
      value: reports.filter((report) => report.county === county).length,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function toReportRow(report: HotlineReport): ReportRow {
  return {
    id: report.id,
    submitted: formatDate(report.submittedAt),
    age: `${ageInDays(report.submittedAt)}d`,
    claimedBy: report.claimant ?? "-",
    county: report.county,
    category: report.category,
    lastAction: getLastAction(report),
    status: getReportStage(report),
  };
}

function getLastAction(report: HotlineReport): string {
  if (report.flagged) {
    return "Flagged for follow-up";
  }

  if (report.confirmedAt) {
    return `Confirmed ${formatDate(report.confirmedAt)}`;
  }

  if (report.respondedAt) {
    return `Archived ${formatDate(report.respondedAt)}`;
  }

  if (report.claimedAt) {
    return `Claimed ${formatDate(report.claimedAt)}`;
  }

  return "Submitted with photos";
}

function oldestDetail(reports: HotlineReport[]): string {
  return reports.length > 0 ? `Oldest is ${oldestAge(reports)}` : "No reports";
}

function oldestAge(reports: HotlineReport[]): string {
  if (reports.length === 0) {
    return "0d";
  }

  const oldest = Math.max(...reports.map((report) => ageInDays(report.submittedAt)));
  return `${oldest}d`;
}

function daysAgo(days: number): Date {
  return addDays(now, -days);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0.2, (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function ageInDays(date: Date): number {
  return Math.max(0, Math.ceil(daysBetween(date, now)));
}

function medianDays(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function pickWeightedCounty(): string {
  const weighted = [
    "Lane",
    "Lane",
    "Multnomah",
    "Multnomah",
    "Washington",
    "Clackamas",
    "Marion",
    "Benton",
    "Jackson",
    ...counties,
  ];
  return pick(weighted);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
