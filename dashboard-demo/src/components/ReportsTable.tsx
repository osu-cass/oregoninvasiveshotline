import { Badge } from "@cloudflare/kumo/components/badge";
import { Button } from "@cloudflare/kumo/components/button";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
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
import { Clipboard, ExternalLink, Link, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";
import type { ReportRow, ReportStage } from "../data/dashboardData";
import { getAriaSort } from "../utils/tableSortUtils";
import { TableSortHeader } from "./TableSortHeader";

interface ReportsTableProps {
  /** Accessible label for the table. */
  ariaLabel?: string;
  /** Whether to render table-level filter controls. */
  showControls?: boolean;
  /** Visual treatment for the table container. */
  variant?: "embedded" | "standalone";
  /** Rows to render in the report table. */
  rows: ReportRow[];
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
} satisfies Record<ReportStage, string>;

/** Renders report rows in a filterable TanStack table. */
export function ReportsTable({
  ariaLabel = "Reports",
  rows,
  showControls = true,
  variant = "standalone",
}: ReportsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { desc: false, id: "submitted" },
  ]);
  const standalone = variant === "standalone";
  const table = useReactTable({
    columns: createReportColumns(),
    data: rows,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: {
      globalFilter,
      sorting,
    },
  });

  return (
    <div className="grid gap-2.5">
      {showControls ? (
        <div className="flex items-center justify-between gap-3 max-[720px]:items-start max-[720px]:flex-col">
          <label className="inline-flex w-[min(320px,100%)] items-center gap-2 rounded-[7px] border border-[rgba(118,130,150,0.26)] bg-white px-[9px] py-[7px] text-slate-500">
            <Search aria-hidden="true" size={15} />
            <span className="sr-only">Filter reports</span>
            <input
              className="min-w-0 w-full border-0 bg-transparent text-[0.84rem] text-[#172033] outline-none placeholder:text-slate-400"
              value={globalFilter}
              placeholder="Filter reports"
              onChange={(event) => setGlobalFilter(event.currentTarget.value)}
            />
          </label>
        </div>
      ) : null}
      <div
        className={
          standalone
            ? "overflow-x-auto rounded-lg border border-[rgba(118,130,150,0.2)] bg-white"
            : "overflow-x-auto bg-white"
        }
      >
        <table
          className={`w-full border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_td]:border-[#edf1f5] [&_tbody_td]:align-middle [&_tbody_td]:text-[0.84rem] [&_tbody_td]:text-[#253247] [&_tbody_tr:hover_td]:bg-[#f8fbff] [&_tbody_tr:last-child_td]:border-b-0 [&_thead_th]:border-b [&_thead_th]:border-[#dfe5ec] [&_thead_th]:bg-[#f5f7fa] [&_thead_th]:text-left [&_thead_th]:text-[0.82rem] [&_thead_th]:font-[680] [&_thead_th]:text-[#536173] [&_thead_th]:whitespace-nowrap ${
            standalone ? "min-w-[1040px]" : "min-w-[980px] table-fixed"
          }`}
          aria-label={ariaLabel}
        >
          {standalone ? null : (
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[28%]" />
              <col className="w-[6%]" />
            </colgroup>
          )}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    aria-sort={getAriaSort(header.column.getIsSorted())}
                    className={
                      standalone
                        ? "px-3 py-2.5"
                        : "overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2.5"
                    }
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
                  No reports match this filter.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className={
                        standalone
                          ? "px-3 py-[11px]"
                          : "overflow-hidden text-ellipsis whitespace-nowrap px-3 py-[11px]"
                      }
                      key={cell.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Creates TanStack columns for report rows. */
function createReportColumns(): ColumnDef<ReportRow>[] {
  return [
    {
      accessorKey: "id",
      cell: ({ getValue }) => (
        <span className="font-[740] text-[#173f7c]">{getValue<string>()}</span>
      ),
      header: ({ column }) => renderColumnHeader(column, "Report"),
    },
    {
      accessorFn: (row) => row.submitted,
      cell: ({ row }) => row.original.submitted,
      header: ({ column }) => renderColumnHeader(column, "Submitted"),
      id: "submitted",
      sortingFn: (left, right) =>
        left.original.submittedTime - right.original.submittedTime,
    },
    {
      accessorFn: (row) => row.age,
      cell: ({ row }) => (
        <span className="inline-flex min-w-[34px] justify-center rounded-full bg-[#eef3f8] px-[7px] py-0.5 text-[0.76rem] font-[720] text-[#42566d]">
          {row.original.age}
        </span>
      ),
      header: ({ column }) => renderColumnHeader(column, "Age"),
      id: "age",
      sortingFn: (left, right) => left.original.ageDays - right.original.ageDays,
    },
    {
      accessorFn: (row) => labelByStatus[row.status],
      cell: ({ row }) => (
        <Badge
          className={
            row.original.status === "flagged"
              ? "border border-violet-200 bg-violet-50 text-violet-800"
              : undefined
          }
          variant={badgeByStatus[row.original.status]}
        >
          {labelByStatus[row.original.status]}
        </Badge>
      ),
      header: ({ column }) => renderColumnHeader(column, "Stage"),
      id: "stage",
    },
    {
      accessorKey: "claimedBy",
      header: ({ column }) => renderColumnHeader(column, "Claimed by"),
    },
    {
      accessorFn: (row) => `${row.county}, ${row.state}`,
      cell: ({ row }) => `${row.original.county}, ${row.original.state}`,
      header: ({ column }) => renderColumnHeader(column, "County"),
      id: "county",
    },
    {
      accessorKey: "category",
      header: ({ column }) => renderColumnHeader(column, "Category"),
    },
    {
      accessorKey: "lastAction",
      header: ({ column }) => renderColumnHeader(column, "Last action"),
    },
    {
      cell: ({ row }) => (
        <div className="flex justify-end gap-0.5">
          <Button
            aria-label={`Open ${row.original.id} in a new tab`}
            size="sm"
            shape="square"
            variant="ghost"
            onClick={() =>
              window.open(row.original.issueUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink aria-hidden="true" size={15} />
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenu.Trigger>
              <Button
                aria-label={`More actions for ${row.original.id}`}
                size="sm"
                shape="square"
                variant="ghost"
              >
                <MoreHorizontal aria-hidden="true" size={16} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              className="min-w-[218px] rounded-lg p-1.5 shadow-[0_14px_34px_rgba(28,36,50,0.16)] [&_[role=menuitem]]:grid [&_[role=menuitem]]:grid-cols-[18px_minmax(0,1fr)] [&_[role=menuitem]]:items-center [&_[role=menuitem]]:gap-[9px] [&_[role=menuitem]]:rounded-md [&_[role=menuitem]]:px-[9px] [&_[role=menuitem]]:py-2 [&_[role=menuitem]]:text-[0.86rem] [&_[role=menuitem]]:leading-tight [&_[role=menuitem]]:text-gray-800 [&_[role=menuitem]:hover]:bg-slate-100 [&_[role=menuitem][data-highlighted]]:bg-slate-100 [&_[role=separator]]:mx-1 [&_[role=separator]]:my-[5px] [&_svg]:text-slate-500"
              sideOffset={6}
            >
              {row.original.claimedBy !== "-" ? (
                <>
                  <DropdownMenu.Item
                    icon={<Clipboard aria-hidden="true" size={15} />}
                    onClick={() =>
                      navigator.clipboard.writeText(row.original.reviewerEmail)
                    }
                  >
                    Copy reviewer email
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                </>
              ) : null}
              <DropdownMenu.Item
                icon={<Link aria-hidden="true" size={15} />}
                onClick={() => navigator.clipboard.writeText(row.original.issueUrl)}
              >
                Copy report link
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      ),
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
    },
  ];
}

/** Renders the shared sortable report table header. */
function renderColumnHeader<TValue>(
  column: Column<ReportRow, TValue>,
  label: string,
) {
  return <TableSortHeader column={column} label={label} />;
}
