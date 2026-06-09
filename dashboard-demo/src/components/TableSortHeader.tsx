import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { getSortLabel } from "../utils/tableSortUtils";

interface TableSortHeaderProps<TData, TValue> {
  /** TanStack column controlled by this header. */
  column: Column<TData, TValue>;
  /** Visible header label. */
  label: string;
}

/** Renders a sortable table header with a reserved directional icon slot. */
export function TableSortHeader<TData, TValue>({
  column,
  label,
}: TableSortHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();

  return (
    <button
      aria-label={`Sort by ${label}. ${getSortLabel(sorted)}`}
      className="inline-flex cursor-pointer items-center gap-[5px] whitespace-nowrap border-0 bg-transparent p-0 text-left font-[inherit] text-[inherit]"
      type="button"
      onClick={column.getToggleSortingHandler()}
    >
      <span>{label}</span>
      <span className={`inline-flex size-3.5 shrink-0 items-center justify-center text-[#173f7c] ${sorted ? "opacity-100" : "opacity-0"}`}>
        {sorted === "asc" ? (
          <ArrowUp aria-hidden="true" size={13} />
        ) : sorted === "desc" ? (
          <ArrowDown aria-hidden="true" size={13} />
        ) : null}
      </span>
    </button>
  );
}
