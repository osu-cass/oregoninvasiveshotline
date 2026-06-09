import { Button } from "@cloudflare/kumo/components/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from "@cloudflare/kumo/components/dialog";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { HelpCircle, Search, X } from "lucide-react";
import { useState } from "react";
import type { ReviewerScoreRow } from "../data/dashboardData";
import { emptyState } from "../styles/tailwindClasses";
import { getAriaSort } from "../utils/tableSortUtils";
import { CopyIconButton } from "./CopyIconButton";
import { TableSortHeader } from "./TableSortHeader";

interface ReviewerScoresGridProps {
  /** Reviewer score rows sorted by global score ascending. */
  rows: ReviewerScoreRow[];
}

type ReviewerTableMode = "scores" | "raw";

type ReviewerHelpTopic =
  | "overview"
  | "global"
  | "response"
  | "completion"
  | "workload"
  | "averageClaimDays"
  | "averageResponseDays"
  | "averageActiveAgeDays"
  | "completionRate";

interface ReviewerHelpContent {
  /** Dialog detail rows for the selected help topic. */
  rows: Array<{ description: string; title: string }>;
  /** Dialog summary text. */
  summary: string;
  /** Dialog title. */
  title: string;
}

const reviewerHelpContent = {
  overview: {
    rows: [
      {
        description:
          "Weighted blend of response, completion, and workload. Lower scores appear first so coordinators can find reviewers who may need support.",
        title: "Global",
      },
      {
        description:
          "Based on median days from claim to response, with missing responses treated as a low score.",
        title: "Response",
      },
      {
        description:
          "Based on the share of assigned reports with a response, plus credit for confirmed reports.",
        title: "Completion",
      },
      {
        description:
          "Starts at 0 and increases when the active assigned queue gets heavy.",
        title: "Workload",
      },
    ],
    summary:
      "Scores are demo triage signals for balancing reviewer work. Lower scores mean the reviewer may need attention first.",
    title: "Reviewer scores",
  },
  global: {
    rows: [
      {
        description:
          "Global = response x 40%, completion x 38%, and inverted workload pressure x 22%.",
        title: "Formula",
      },
      {
        description:
          "The table starts sorted by global ascending so the lowest overall reviewer health score appears first.",
        title: "Sort behavior",
      },
    ],
    summary:
      "Global combines timeliness, resolution progress, and current queue pressure into one triage score.",
    title: "Global score",
  },
  response: {
    rows: [
      {
        description:
          "Uses the median days between claim and response for that reviewer. Faster response times produce higher scores.",
        title: "Timing input",
      },
      {
        description:
          "Reviewers with assigned reports but no responses receive a low baseline so they surface in triage.",
        title: "Missing responses",
      },
    ],
    summary:
      "Response score answers whether claimed reports are getting archived quickly enough.",
    title: "Response score",
  },
  completion: {
    rows: [
      {
        description:
          "Responded reports contribute most of the score because an archived report is no longer waiting on the reviewer.",
        title: "Response share",
      },
      {
        description:
          "Confirmed reports add extra credit because they reached a stronger final state.",
        title: "Confirmation share",
      },
    ],
    summary:
      "Completion score shows whether assigned reports are moving out of active review.",
    title: "Completion score",
  },
  workload: {
    rows: [
      {
        description:
          "Starts at 0, then adds pressure when a reviewer has more than two active assigned reports.",
        title: "Queue pressure",
      },
      {
        description:
          "Active reports are assigned reports without a response date.",
        title: "Active definition",
      },
    ],
    summary:
      "Workload pressure gives coordinators a quick sense of whether the active queue is getting heavy.",
    title: "Workload pressure",
  },
  averageClaimDays: {
    rows: [
      {
        description:
          "Average days from public submission to the reviewer claiming the report.",
        title: "Calculation",
      },
      {
        description:
          "Only reports with a claim date are included. Unclaimed reports are not assigned to reviewers in this demo.",
        title: "Included rows",
      },
    ],
    summary:
      "Average claim days is a raw timing value used for operational context.",
    title: "Average claim days",
  },
  averageResponseDays: {
    rows: [
      {
        description:
          "Average days between the reviewer claiming a report and the report receiving a response/archive date.",
        title: "Calculation",
      },
      {
        description:
          "Reports still waiting for response are excluded from this average and captured by active age instead.",
        title: "Included rows",
      },
    ],
    summary:
      "Average response days is the raw timing value behind response performance.",
    title: "Average response days",
  },
  averageActiveAgeDays: {
    rows: [
      {
        description:
          "Average age, in days since submission, for assigned reports that do not yet have a response date.",
        title: "Calculation",
      },
      {
        description:
          "This helps separate a small fresh queue from a small stale queue.",
        title: "Why it matters",
      },
    ],
    summary:
      "Average active age shows how stale each reviewer's open assignments are.",
    title: "Average active age",
  },
  completionRate: {
    rows: [
      {
        description:
          "Responded reports divided by total assigned reports for that reviewer.",
        title: "Calculation",
      },
      {
        description:
          "This raw rate does not include the extra confirmation credit used by the completion score.",
        title: "Score difference",
      },
    ],
    summary:
      "Resolved rate is the raw completion measure shown in the days view.",
    title: "Resolved rate",
  },
} satisfies Record<ReviewerHelpTopic, ReviewerHelpContent>;

/** Renders reviewer metrics in a filterable TanStack table. */
export function ReviewerScoresGrid({ rows }: ReviewerScoresGridProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [helpTopic, setHelpTopic] = useState<ReviewerHelpTopic | null>(null);
  const [mode, setMode] = useState<ReviewerTableMode>("scores");
  const [sorting, setSorting] = useState<SortingState>([
    { desc: false, id: "global" },
  ]);
  const columns =
    mode === "scores"
      ? createScoreColumns(setHelpTopic)
      : createRawColumns(setHelpTopic);
  const table = useReactTable({
    columns,
    data: rows,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: {
      columnVisibility: mode === "raw" ? { global: false } : {},
      globalFilter,
      sorting,
    },
  });
  const helpContent = helpTopic ? reviewerHelpContent[helpTopic] : null;

  if (rows.length === 0) {
    return <div className={emptyState}>No reviewers match the current filters.</div>;
  }

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between gap-3 max-[720px]:items-start max-[720px]:flex-col">
        <label className="inline-flex w-[min(320px,100%)] items-center gap-2 rounded-[7px] border border-[rgba(118,130,150,0.26)] bg-white px-[9px] py-[7px] text-slate-500">
          <Search aria-hidden="true" size={15} />
          <span className="sr-only">Filter reviewers</span>
          <input
            className="min-w-0 w-full border-0 bg-transparent text-[0.84rem] text-[#172033] outline-none placeholder:text-slate-400"
            value={globalFilter}
            placeholder="Filter reviewers"
            onChange={(event) => setGlobalFilter(event.currentTarget.value)}
          />
        </label>
        <div className="flex items-center justify-end gap-2 max-[720px]:w-full max-[720px]:flex-wrap max-[720px]:justify-start">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setHelpTopic("overview")}
          >
            <HelpCircle aria-hidden="true" size={15} />
            What are these scores for?
          </Button>
          <div
            className="inline-flex overflow-hidden rounded-[7px] border border-[rgba(118,130,150,0.24)] bg-white"
            role="group"
            aria-label="Reviewer table values"
          >
            {renderModeButton("scores", mode, setMode, setSorting, "Scores")}
            {renderModeButton("raw", mode, setMode, setSorting, "Timing")}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[rgba(118,130,150,0.2)] bg-white">
        <table
          className="w-full min-w-[1040px] border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_td]:border-[#edf1f5] [&_tbody_td]:align-middle [&_tbody_td]:text-[0.84rem] [&_tbody_td]:text-[#253247] [&_tbody_tr:hover_td]:bg-[#f8fbff] [&_tbody_tr:last-child_td]:border-b-0 [&_thead_th]:border-b [&_thead_th]:border-[#dfe5ec] [&_thead_th]:bg-[#f5f7fa] [&_thead_th]:text-left [&_thead_th]:text-[0.82rem] [&_thead_th]:font-[680] [&_thead_th]:text-[#536173] [&_thead_th]:whitespace-nowrap"
          aria-label="Reviewer metrics"
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    aria-sort={getAriaSort(header.column.getIsSorted())}
                    className="px-3 py-2.5"
                    key={header.id}
                    scope="col"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-[18px] text-center text-slate-500"
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  No reviewers match this filter.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className="px-3 py-[11px]" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DialogRoot
        open={helpContent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setHelpTopic(null);
          }
        }}
      >
        {helpContent ? (
          <Dialog className="overflow-hidden rounded-lg" size="lg">
            <div className="flex items-start justify-between gap-3.5 border-b border-[rgba(118,130,150,0.16)] px-5 pb-4 pt-[18px]">
              <div>
                <DialogTitle className="mb-[5px] text-[1.08rem] font-[740] tracking-normal text-[#172033]">
                  {helpContent.title}
                </DialogTitle>
                <DialogDescription>{helpContent.summary}</DialogDescription>
              </div>
              <DialogClose
                render={(props) => (
                  <Button
                    {...props}
                    aria-label="Close score explanation"
                    shape="square"
                    size="sm"
                    variant="ghost"
                  >
                    <X aria-hidden="true" size={16} />
                  </Button>
                )}
              />
            </div>
            <div className="grid gap-2 px-5 pb-5 pt-4">
              {helpContent.rows.map((row) =>
                renderScoreHelp(row.title, row.description),
              )}
            </div>
          </Dialog>
        ) : null}
      </DialogRoot>
    </div>
  );
}

/** Creates columns for the score table mode. */
function createScoreColumns(
  onHelpTopicChange: (topic: ReviewerHelpTopic) => void,
): ColumnDef<ReviewerScoreRow>[] {
  return [
    createReviewerColumn(onHelpTopicChange),
    {
      accessorKey: "assignedReports",
      cell: ({ getValue }) => getValue<number>(),
      header: ({ column }) =>
        renderColumnHeader(column, "Assigned", null, onHelpTopicChange),
    },
    {
      accessorKey: "global",
      cell: ({ getValue }) => renderScore(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(column, "Global", "global", onHelpTopicChange),
    },
    {
      accessorKey: "response",
      cell: ({ getValue }) => renderScore(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(column, "Response", "response", onHelpTopicChange),
    },
    {
      accessorKey: "completion",
      cell: ({ getValue }) => renderScore(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(column, "Completion", "completion", onHelpTopicChange),
    },
    {
      accessorKey: "workload",
      cell: ({ getValue }) => renderPressureScore(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(column, "Workload", "workload", onHelpTopicChange),
    },
    createActionsColumn(),
  ];
}

/** Creates columns for the raw reviewer timing table mode. */
function createRawColumns(
  onHelpTopicChange: (topic: ReviewerHelpTopic) => void,
): ColumnDef<ReviewerScoreRow>[] {
  return [
    createReviewerColumn(onHelpTopicChange),
    {
      accessorKey: "assignedReports",
      cell: ({ getValue }) => getValue<number>(),
      header: ({ column }) =>
        renderColumnHeader(column, "Assigned", null, onHelpTopicChange),
    },
    {
      accessorKey: "global",
      cell: ({ getValue }) => renderScore(getValue<number>()),
      enableGlobalFilter: false,
      header: ({ column }) =>
        renderColumnHeader(column, "Global", "global", onHelpTopicChange),
    },
    {
      accessorKey: "averageClaimDays",
      cell: ({ getValue }) => formatDays(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(column, "Avg claim", "averageClaimDays", onHelpTopicChange),
    },
    {
      accessorKey: "averageResponseDays",
      cell: ({ getValue }) => formatDays(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(
          column,
          "Avg response",
          "averageResponseDays",
          onHelpTopicChange,
        ),
    },
    {
      accessorKey: "activeReports",
      cell: ({ getValue }) => getValue<number>(),
      header: ({ column }) =>
        renderColumnHeader(column, "Active", "workload", onHelpTopicChange),
    },
    {
      accessorKey: "averageActiveAgeDays",
      cell: ({ getValue }) => formatDays(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(
          column,
          "Avg active age",
          "averageActiveAgeDays",
          onHelpTopicChange,
        ),
    },
    {
      accessorKey: "completionRate",
      cell: ({ getValue }) => formatPercent(getValue<number>()),
      header: ({ column }) =>
        renderColumnHeader(column, "Resolved", "completionRate", onHelpTopicChange),
    },
    createActionsColumn(),
  ];
}

/** Creates the shared reviewer identity column. */
function createReviewerColumn(
  onHelpTopicChange: (topic: ReviewerHelpTopic) => void,
): ColumnDef<ReviewerScoreRow> {
  return {
    accessorKey: "reviewer",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <strong className="font-[720] text-[#172033]">
          {row.original.reviewer}
        </strong>
        <span className="text-[0.76rem] text-slate-500">
          {row.original.email}
        </span>
      </div>
    ),
    header: ({ column }) =>
      renderColumnHeader(column, "Reviewer", null, onHelpTopicChange),
  };
}

/** Creates the shared row action column. */
function createActionsColumn(): ColumnDef<ReviewerScoreRow> {
  return {
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CopyIconButton
          ariaLabel={`Copy ${row.original.reviewer} email`}
          copiedLabel={`${row.original.reviewer} email copied`}
          text={row.original.email}
        />
      </div>
    ),
    enableGlobalFilter: false,
    enableSorting: false,
    header: () => <span className="sr-only">Actions</span>,
    id: "actions",
  };
}

/** Renders a sortable table header with optional help. */
function renderColumnHeader<TValue>(
  column: Column<ReviewerScoreRow, TValue>,
  label: string,
  helpTopic: ReviewerHelpTopic | null,
  onHelpTopicChange: (topic: ReviewerHelpTopic) => void,
) {
  return (
    <span className="inline-flex min-w-0 items-center gap-[5px]">
      <TableSortHeader column={column} label={label} />
      {helpTopic ? (
        <button
          aria-label={`How ${label} is calculated`}
          className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-slate-500 hover:bg-[#e8f0ff] hover:text-[#173f7c] focus-visible:bg-[#e8f0ff] focus-visible:text-[#173f7c]"
          type="button"
          onClick={() => onHelpTopicChange(helpTopic)}
        >
          <HelpCircle aria-hidden="true" size={13} />
        </button>
      ) : null}
    </span>
  );
}

/** Renders one table mode switch button. */
function renderModeButton(
  value: ReviewerTableMode,
  mode: ReviewerTableMode,
  onModeChange: (mode: ReviewerTableMode) => void,
  onSortingChange: (sorting: SortingState) => void,
  label: string,
) {
  const active = mode === value;

  return (
    <button
      aria-pressed={active}
      className={`min-h-[30px] min-w-[76px] cursor-pointer whitespace-nowrap border-0 border-r border-[rgba(118,130,150,0.18)] px-2.5 text-[0.78rem] font-[680] last:border-r-0 ${
        active
          ? "!bg-[#173f7c] !text-white"
          : "bg-white text-[#526174] hover:bg-slate-100 hover:text-[#172033] focus-visible:bg-slate-100 focus-visible:text-[#172033]"
      }`}
      type="button"
      onClick={() => {
        onModeChange(value);
        onSortingChange([{ desc: false, id: "global" }]);
      }}
    >
      {label}
    </button>
  );
}

/** Renders one reviewer score explanation row. */
function renderScoreHelp(title: string, description: string) {
  return (
    <div className="grid gap-[3px] rounded-[7px] border border-[rgba(118,130,150,0.16)] bg-[#fbfcfd] px-3 py-2.5">
      <strong className="text-[0.88rem] text-[#172033]">{title}</strong>
      <span className="text-[0.82rem] leading-snug text-slate-500">
        {description}
      </span>
    </div>
  );
}

/** Renders a score value with its visual severity. */
function renderScore(score: number) {
  return (
    <span className={`inline-flex min-w-[58px] justify-center rounded-md px-[7px] py-[3px] text-[0.75rem] font-[740] leading-tight ${getScoreTone(score)}`}>
      {score.toFixed(1)}/10
    </span>
  );
}

/** Returns the tone class for a reviewer score. */
function getScoreTone(score: number): string {
  if (score < 4) {
    return "bg-red-100 text-red-800";
  }

  if (score < 7) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-green-100 text-green-800";
}

/** Renders a workload pressure value with its visual severity. */
function renderPressureScore(score: number) {
  return (
    <span className={`inline-flex min-w-[58px] justify-center rounded-md px-[7px] py-[3px] text-[0.75rem] font-[740] leading-tight ${getPressureTone(score)}`}>
      {score.toFixed(1)}/10
    </span>
  );
}

/** Returns the tone class for a workload pressure score. */
function getPressureTone(score: number): string {
  if (score < 4) {
    return "bg-green-100 text-green-800";
  }

  if (score < 7) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-red-100 text-red-800";
}

/** Formats a day value for raw timing columns. */
function formatDays(value: number): string {
  return value === 0 ? "n/a" : `${value.toFixed(1)}d`;
}

/** Formats a ratio as a whole-number percentage. */
function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
