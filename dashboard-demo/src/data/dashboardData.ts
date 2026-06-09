export type DateRangeKey = "last-30" | "last-90" | "ytd" | "all";

export type StateKey = "oregon" | "washington";

export type ReportStage =
  | "unclaimed"
  | "claimed_needs_response"
  | "responded"
  | "confirmed"
  | "flagged";

export type ReportCategory = (typeof categories)[number];

export interface DashboardFilters {
  /** County keys to include; empty includes all counties. */
  counties: string[];
  /** Report category to include, or all categories. */
  category: ReportCategory | "all";
  /** Claimant to include, or all claimants. */
  claimant: string | "all";
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
  /** State that owns the report county. */
  state: StateKey;
  /** Stable state/county filter key. */
  countyKey: string;
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
  /** Numeric submitted date for table sorting. */
  submittedTime: number;
  /** Human-readable age in the current dashboard window. */
  age: string;
  /** Numeric report age for table sorting. */
  ageDays: number;
  /** Optional assignee name for claimed reports. */
  claimedBy: string;
  /** Oregon county name for grouping and filtering. */
  county: string;
  /** State abbreviation for display. */
  state: string;
  /** Publicly reported category. */
  category: string;
  /** Recent operational note shown in the queue. */
  lastAction: string;
  /** Demo workflow bucket. */
  status: ReportStage;
  /** Demo reviewer email used by row actions. */
  reviewerEmail: string;
  /** Demo issue URL opened by row actions. */
  issueUrl: string;
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
  detail?: string;
  /** Optional change indicator. */
  delta?: string;
  /** Visual tone for the delta. */
  tone?: "neutral" | "good" | "warning";
  /** Small trend values shown inside operational cards. */
  trend?: number[];
  /** Unit suffix for chart axis labels. */
  trendUnit?: string;
}

export interface CategoryDatum {
  /** Category label. */
  label: ReportCategory;
  /** Count in the selected range. */
  value: number;
}

export interface CategoryCountyDatum {
  /** County display label. */
  county: string;
  /** State abbreviation. */
  state: string;
  /** Count in the selected range. */
  value: number;
}

export interface CategoryDetail {
  /** Category label. */
  category: ReportCategory;
  /** Accent color used in the chart and dialog. */
  color: string;
  /** Current report count. */
  total: number;
  /** Share of all reports in the selected range. */
  share: number;
  /** Unclaimed reports in this category. */
  unclaimed: number;
  /** Claimed reports that still need a response. */
  needsResponse: number;
  /** Confirmed reports in this category. */
  confirmed: number;
  /** Reports not yet confirmed. */
  unresolved: number;
  /** Public reports in this category. */
  publicCount: number;
  /** Private reports in this category. */
  privateCount: number;
  /** Median days from submission to claim. */
  medianClaimDays: number;
  /** Median days from claim to response. */
  medianResponseDays: number;
  /** Counties with the largest category load. */
  topCounties: CategoryCountyDatum[];
  /** Most common reported species in the category. */
  topSpecies: { species: string; value: number }[];
  /** Operational rows that most need attention. */
  priorityReports: ReportRow[];
}

export interface CountyDatum {
  /** County name. */
  county: string;
  /** Stable state/county filter key. */
  countyKey: string;
  /** Owning state. */
  state: StateKey;
  /** Count in the selected range. */
  value: number;
}

export interface ReviewerScoreRow {
  /** Reviewer display name. */
  reviewer: string;
  /** Demo reviewer email. */
  email: string;
  /** Current assigned report count. */
  assignedReports: number;
  /** Current assigned reports that still need action. */
  activeReports: number;
  /** Average days from submission to claim. */
  averageClaimDays: number;
  /** Average days from claim to response. */
  averageResponseDays: number;
  /** Average age in days for active assigned reports. */
  averageActiveAgeDays: number;
  /** Share of assigned reports with a response. */
  completionRate: number;
  /** Combined score used for default triage sorting. */
  global: number;
  /** Timeliness score for claims and responses. */
  response: number;
  /** Score for reports that reach a resolved state. */
  completion: number;
  /** Workload pressure score from active assigned reports. */
  workload: number;
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
  /** Category drilldown details derived from reports. */
  categoryDetails: CategoryDetail[];
  /** County workload derived from reports. */
  countyLoad: CountyDatum[];
  /** Flat report rows for ungrouped display. */
  tableRows: ReportRow[];
  /** Reviewer score rows sorted by global score ascending. */
  reviewerScores: ReviewerScoreRow[];
}

export interface WarningThresholds {
  /** Days before unclaimed reports are warning-worthy. */
  unclaimedDays: number;
  /** Days before claimed reports need response follow-up. */
  responseDays: number;
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

export const washingtonCounties = [
  "Adams",
  "Asotin",
  "Benton",
  "Chelan",
  "Clallam",
  "Clark",
  "Columbia",
  "Cowlitz",
  "Douglas",
  "Ferry",
  "Franklin",
  "Garfield",
  "Grant",
  "Grays Harbor",
  "Island",
  "Jefferson",
  "King",
  "Kitsap",
  "Kittitas",
  "Klickitat",
  "Lewis",
  "Lincoln",
  "Mason",
  "Okanogan",
  "Pacific",
  "Pend Oreille",
  "Pierce",
  "San Juan",
  "Skagit",
  "Skamania",
  "Snohomish",
  "Spokane",
  "Stevens",
  "Thurston",
  "Wahkiakum",
  "Walla Walla",
  "Whatcom",
  "Whitman",
  "Yakima",
] as const;

export const countyGroups = [
  {
    label: "Oregon",
    state: "oregon",
    counties,
  },
  {
    label: "Washington",
    state: "washington",
    counties: washingtonCounties,
  },
] as const;

export const categories = ["Plant", "Insect", "Aquatic", "Mollusk", "Pathogen"] as const;

export const categoryColors = {
  Aquatic: "#2563eb",
  Insect: "#f59e0b",
  Mollusk: "#7c3aed",
  Pathogen: "#0f766e",
  Plant: "#16a34a",
} satisfies Record<ReportCategory, string>;

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

const now = getDemoNow();

/** Creates a generated dashboard dataset for a selected range. */
export function createDashboardDataset(
  sourceReports: HotlineReport[],
  range: DateRangeKey,
  filters: DashboardFilters,
  thresholds: WarningThresholds = {
    responseDays: 7,
    unclaimedDays: 2,
  },
): DashboardDataset {
  const rangeReports = filterReportsByRange(sourceReports, range);
  const countyContextReports = filterReports(rangeReports, {
    ...filters,
    counties: [],
  });
  const reports = filterReports(rangeReports, filters);
  const tableRows = reports
    .slice()
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
    .map(toReportRow);

  return {
    reports,
    metrics: createMetrics(reports, thresholds),
    groups: createGroups(reports),
    submissionsByWeek: createSubmissionsByWeek(reports),
    claimTimeByMonth: createClaimTimeByMonth(reports),
    categoryMix: createCategoryMix(reports),
    categoryDetails: createCategoryDetails(reports),
    countyLoad: createCountyLoad(countyContextReports),
    reviewerScores: createReviewerScores(reports),
    tableRows,
  };
}

/** Creates an empty filter set for the dashboard controls. */
export function createDefaultFilters(): DashboardFilters {
  return {
    counties: [],
    category: "all",
    claimant: "all",
    publicOnly: false,
  };
}

/** Returns whether any dashboard filter is active. */
export function hasActiveFilters(filters: DashboardFilters): boolean {
  return (
    filters.counties.length > 0 ||
    filters.category !== "all" ||
    filters.claimant !== "all" ||
    filters.publicOnly
  );
}

/** Generates a stable fake but coherent report dataset. */
export function createGeneratedReports(): HotlineReport[] {
  return generateReports(createSeededRandom(20260529));
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

function generateReports(random: () => number): HotlineReport[] {
  const reportCount = 103;

  return Array.from({ length: reportCount }, (_, index) => {
    const category = pick(categories, random);
    const stageRoll = random();
    const wasClaimed = stageRoll > 0.18;
    const wasResponded = wasClaimed && stageRoll > 0.46;
    const wasConfirmed = wasResponded && stageRoll > 0.78;
    const submittedAt = daysAgo(
      wasClaimed
        ? randomInt(random, 0, 220)
        : pick([0, 0, 1, 1, 2, 2, 3, 4, 6, 8], random),
    );
    const claimedAt = wasClaimed ? addDays(submittedAt, randomInt(random, 0, 5)) : null;
    const respondedAt =
      wasResponded && claimedAt ? addDays(claimedAt, randomInt(random, 1, 15)) : null;
    const confirmedAt =
      wasConfirmed && respondedAt ? addDays(respondedAt, randomInt(random, 0, 9)) : null;
    const reportedSpecies = pick(reportedSpeciesByCategory[category], random);

    const state = random() > 0.24 ? "oregon" : "washington";
    const county = pickWeightedCounty(state, random);

    return {
      id: `2026-${String(index + 221).padStart(4, "0")}`,
      submittedAt,
      claimedAt,
      respondedAt,
      confirmedAt,
      claimant: wasClaimed ? pick(claimants, random) : null,
      county,
      state,
      countyKey: createCountyKey(state, county),
      category,
      reportedSpecies,
      actualSpecies: confirmedAt ? reportedSpecies : null,
      flagged: random() > 0.91,
      public: random() > 0.38,
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
    if (
      filters.counties.length > 0 &&
      !filters.counties.includes(report.countyKey)
    ) {
      return false;
    }

    if (filters.category !== "all" && report.category !== filters.category) {
      return false;
    }

    if (filters.claimant !== "all" && report.claimant !== filters.claimant) {
      return false;
    }

    if (filters.publicOnly && !report.public) {
      return false;
    }

    return true;
  });
}

function createMetrics(
  reports: HotlineReport[],
  thresholds: WarningThresholds,
): MetricCardData[] {
  const unclaimed = reports.filter((report) => !report.claimedAt);
  const needsResponse = reports.filter(
    (report) => report.claimedAt && !report.respondedAt,
  );
  const claimDurations = reports.flatMap((report) =>
    report.claimedAt ? [daysBetween(report.submittedAt, report.claimedAt)] : [],
  );
  const responseDurations = reports.flatMap((report) =>
    report.claimedAt && report.respondedAt
      ? [daysBetween(report.claimedAt, report.respondedAt)]
      : [],
  );

  return [
    {
      label: "Needs response",
      value: String(needsResponse.length),
      delta: `${needsResponse.filter((report) => getClaimAge(report) > thresholds.responseDays).length} waiting 7d+`,
      tone: "warning",
      trend: createRecentStageTrend(needsResponse, 18),
    },
    {
      label: "Unclaimed",
      value: String(unclaimed.length),
      delta: `${unclaimed.filter((report) => ageInDays(report.submittedAt) > thresholds.unclaimedDays).length} waiting 2d+`,
      tone: "warning",
      trend: createRecentStageTrend(unclaimed, 15),
    },
    {
      label: "Median time to claim",
      value: `${medianDays(claimDurations).toFixed(1)}d`,
      tone: "good",
      trend: createRecentDurationTrend(reports, "claim"),
      trendUnit: "d",
    },
    {
      label: "Median time to respond",
      value: `${medianDays(responseDurations).toFixed(1)}d`,
      delta: `${responseDurations.filter((duration) => duration > 7).length} took 7d+`,
      tone: "warning",
      trend: createRecentDurationTrend(reports, "respond"),
      trendUnit: "d",
    },
  ];
}

function createGroups(
  reports: HotlineReport[],
): StatusGroup[] {
  const groups = [
    {
      title: "Unclaimed reports",
      description: "Created but not assigned.",
      stage: "unclaimed",
      defaultOpen: true,
    },
    {
      title: "Claimed, needs response",
      description: "Claimed reports that are not archived.",
      stage: "claimed_needs_response",
      defaultOpen: true,
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
      defaultOpen: true,
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
      "defaultOpen" | "description" | "stage" | "title"
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

function createRecentStageTrend(
  reports: HotlineReport[],
  baseline: number,
): number[] {
  const buckets = Array.from({ length: 22 }, (_, index) =>
    Math.max(0, Math.round(baseline + Math.sin(index / 2) * 3)),
  );
  const start = daysAgo(21);

  for (const report of reports) {
    const weekIndex = Math.floor(daysBetween(start, report.submittedAt));

    if (weekIndex >= 0 && weekIndex < buckets.length) {
      buckets[weekIndex] += 1;
    }
  }

  return buckets;
}

function createRecentDurationTrend(
  reports: HotlineReport[],
  durationType: "claim" | "respond",
): number[] {
  const buckets = Array.from({ length: 22 }, () => [] as number[]);
  const start = daysAgo(21);

  for (const report of reports) {
    const eventDate =
      durationType === "claim" ? report.claimedAt : report.respondedAt;
    const duration =
      durationType === "claim"
        ? report.claimedAt
          ? daysBetween(report.submittedAt, report.claimedAt)
          : null
        : report.claimedAt && report.respondedAt
          ? daysBetween(report.claimedAt, report.respondedAt)
          : null;

    if (!eventDate || duration === null) {
      continue;
    }

    const dayIndex = Math.floor(daysBetween(start, eventDate));

    if (dayIndex >= 0 && dayIndex < buckets.length) {
      buckets[dayIndex].push(duration);
    }
  }

  return buckets.map((values, index) => {
    if (values.length > 0) {
      return Number(medianDays(values).toFixed(1));
    }

    return durationType === "claim"
      ? Number((2.4 + Math.sin(index / 2.2) * 0.5).toFixed(1))
      : Number((8.7 + Math.sin(index / 4) * 1.2).toFixed(1));
  });
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

/** Creates detailed category stats for the drilldown dialog. */
function createCategoryDetails(reports: HotlineReport[]): CategoryDetail[] {
  const totalReports = reports.length;

  return categories
    .map((category) => {
      const categoryReports = reports.filter(
        (report) => report.category === category,
      );
      const claimDurations = categoryReports.flatMap((report) =>
        report.claimedAt
          ? [daysBetween(report.submittedAt, report.claimedAt)]
          : [],
      );
      const responseDurations = categoryReports.flatMap((report) =>
        report.claimedAt && report.respondedAt
          ? [daysBetween(report.claimedAt, report.respondedAt)]
          : [],
      );
      const confirmed = categoryReports.filter(
        (report) => report.confirmedAt,
      ).length;

      return {
        category,
        color: categoryColors[category],
        confirmed,
        medianClaimDays: medianDays(claimDurations),
        medianResponseDays: medianDays(responseDurations),
        needsResponse: categoryReports.filter(
          (report) => report.claimedAt && !report.respondedAt,
        ).length,
        priorityReports: createPriorityReports(categoryReports),
        privateCount: categoryReports.filter((report) => !report.public).length,
        publicCount: categoryReports.filter((report) => report.public).length,
        share:
          totalReports === 0 ? 0 : categoryReports.length / totalReports,
        topCounties: createTopCategoryCounties(categoryReports),
        topSpecies: createTopSpecies(categoryReports),
        total: categoryReports.length,
        unclaimed: categoryReports.filter((report) => !report.claimedAt).length,
        unresolved: categoryReports.length - confirmed,
      };
    })
    .filter((detail) => detail.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Returns the highest-priority category reports for the dialog. */
function createPriorityReports(reports: HotlineReport[]): ReportRow[] {
  return reports
    .slice()
    .sort((left, right) => {
      const stagePriority =
        getStagePriority(getReportStage(left)) - getStagePriority(getReportStage(right));

      if (stagePriority !== 0) {
        return stagePriority;
      }

      return left.submittedAt.getTime() - right.submittedAt.getTime();
    })
    .slice(0, 4)
    .map(toReportRow);
}

/** Returns the counties with the largest category load. */
function createTopCategoryCounties(reports: HotlineReport[]): CategoryCountyDatum[] {
  const counts = new Map<string, CategoryCountyDatum>();

  for (const report of reports) {
    const key = report.countyKey;
    const current = counts.get(key);
    counts.set(key, {
      county: report.county,
      state: report.state === "oregon" ? "OR" : "WA",
      value: (current?.value ?? 0) + 1,
    });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

/** Returns the most common reported species names. */
function createTopSpecies(
  reports: HotlineReport[],
): Array<{ species: string; value: number }> {
  const counts = new Map<string, number>();

  for (const report of reports) {
    counts.set(report.reportedSpecies, (counts.get(report.reportedSpecies) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([species, value]) => ({ species, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

function createCountyLoad(reports: HotlineReport[]): CountyDatum[] {
  return countyGroups
    .flatMap((group) =>
      group.counties.map((county) => ({
        county,
        countyKey: createCountyKey(group.state, county),
        state: group.state,
        value: reports.filter(
          (report) => report.countyKey === createCountyKey(group.state, county),
        ).length,
      })),
    )
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Creates reviewer score rows sorted from lowest global score to highest. */
function createReviewerScores(reports: HotlineReport[]): ReviewerScoreRow[] {
  return claimants
    .map((reviewer) => {
      const assignedReports = reports.filter((report) => report.claimant === reviewer);
      const activeReports = assignedReports.filter((report) => !report.respondedAt);
      const respondedReports = assignedReports.filter((report) => report.respondedAt);
      const confirmedReports = assignedReports.filter((report) => report.confirmedAt);
      const claimDurations = assignedReports.flatMap((report) =>
        report.claimedAt
          ? [daysBetween(report.submittedAt, report.claimedAt)]
          : [],
      );
      const responseDurations = assignedReports.flatMap((report) =>
        report.claimedAt && report.respondedAt
          ? [daysBetween(report.claimedAt, report.respondedAt)]
          : [],
      );
      const activeAges = activeReports.map((report) => ageInDays(report.submittedAt));
      const response =
        assignedReports.length === 0
          ? 0
          : responseDurations.length === 0
            ? 2
            : clampScore(10 - medianDays(responseDurations) / 1.8);
      const completion = clampScore(
        assignedReports.length === 0
          ? 0
          : (respondedReports.length / assignedReports.length) * 7 +
              (confirmedReports.length / assignedReports.length) * 3,
      );
      const workload = clampScore(Math.max(0, activeReports.length - 2) * 1.4);
      const workloadHealth = 10 - workload;
      const global = clampScore(
        response * 0.4 + completion * 0.38 + workloadHealth * 0.22,
      );

      return {
        activeReports: activeReports.length,
        assignedReports: assignedReports.length,
        averageActiveAgeDays: averageDays(activeAges),
        averageClaimDays: averageDays(claimDurations),
        averageResponseDays: averageDays(responseDurations),
        completion,
        completionRate:
          assignedReports.length === 0
            ? 0
            : respondedReports.length / assignedReports.length,
        email: createReviewerEmail(reviewer),
        global,
        response,
        reviewer,
        workload,
      };
    })
    .filter((row) => row.assignedReports > 0)
    .sort((a, b) => a.global - b.global);
}

function toReportRow(report: HotlineReport): ReportRow {
  return {
    id: report.id,
    submitted: formatDate(report.submittedAt),
    submittedTime: report.submittedAt.getTime(),
    age: `${ageInDays(report.submittedAt)}d`,
    ageDays: ageInDays(report.submittedAt),
    claimedBy: report.claimant ?? "-",
    county: report.county,
    state: report.state === "oregon" ? "OR" : "WA",
    category: report.category,
    lastAction: getLastAction(report),
    status: getReportStage(report),
    reviewerEmail: createReviewerEmail(report.claimant),
    issueUrl: `https://example.com/reports/${report.id}`,
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

/** Returns the operational priority order for report stages. */
function getStagePriority(stage: ReportStage): number {
  const priority: Record<ReportStage, number> = {
    claimed_needs_response: 1,
    flagged: 2,
    unclaimed: 3,
    responded: 4,
    confirmed: 5,
  };

  return priority[stage];
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

function getDemoNow(): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

function getClaimAge(report: HotlineReport): number {
  return report.claimedAt ? ageInDays(report.claimedAt) : ageInDays(report.submittedAt);
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

/** Returns the average day value for a set of durations. */
function averageDays(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Number(
    (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1),
  );
}

/** Keeps a report score within the visible zero-to-ten range. */
function clampScore(score: number): number {
  return Number(Math.max(0, Math.min(10, score)).toFixed(1));
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

function pick<T>(items: readonly T[], random: () => number): T {
  return items[randomInt(random, 0, items.length - 1)];
}

function pickWeightedCounty(state: StateKey, random: () => number): string {
  const weighted =
    state === "oregon"
      ? [
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
        ]
      : [
          "King",
          "King",
          "Pierce",
          "Snohomish",
          "Clark",
          "Spokane",
          "Yakima",
          "Whatcom",
          ...washingtonCounties,
        ];
  return pick(weighted, random);
}

function createCountyKey(state: StateKey, county: string): string {
  return `${state}:${county}`;
}

function createReviewerEmail(claimant: string | null): string {
  if (!claimant) {
    return "hotline-triage@example.org";
  }

  return `${claimant.toLowerCase().replaceAll(/[^a-z]+/g, ".").replace(/^\.+|\.+$/g, "")}@example.org`;
}

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
