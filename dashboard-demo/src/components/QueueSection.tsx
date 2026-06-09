import { Button } from "@cloudflare/kumo/components/button";
import { Collapsible } from "@cloudflare/kumo/components/collapsible";
import {
  Archive,
  BadgeCheck,
  ChevronDown,
  Flag,
  Inbox,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  ReportStage,
  StatusGroup,
} from "../data/dashboardData";
import { emptyState, panelSurface } from "../styles/tailwindClasses";
import { ReportsTable } from "./ReportsTable";

interface QueueSectionProps {
  /** Queue status group to render. */
  group: StatusGroup;
  /** Rows shown before expanding. */
  rowsPerGroup: number;
}

const iconByStage = {
  unclaimed: Inbox,
  claimed_needs_response: UserCheck,
  responded: Archive,
  confirmed: BadgeCheck,
  flagged: Flag,
} satisfies Record<ReportStage, LucideIcon>;

/** Renders one collapsible report status group. */
export function QueueSection({
  group,
  rowsPerGroup,
}: QueueSectionProps) {
  const [open, setOpen] = useState(group.defaultOpen);
  const [visibleRows, setVisibleRows] = useState(rowsPerGroup);
  const canShowMore = visibleRows < group.rows.length;
  const Icon = iconByStage[group.stage];

  useEffect(() => {
    setVisibleRows(rowsPerGroup);
  }, [rowsPerGroup]);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className={`group overflow-hidden transition-[border-color,box-shadow] duration-150 hover:border-[rgba(69,92,124,0.3)] hover:shadow-[0_5px_18px_rgba(28,36,50,0.06)] ${panelSurface}`}
    >
      <Collapsible.Trigger className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-4 py-3.5 text-left hover:bg-slate-50 max-[720px]:items-start max-[720px]:flex-col">
        <div className="flex min-w-0 items-center gap-[11px]">
          <ChevronDown
            className="shrink-0 transition-transform duration-150 group-data-[open=true]:rotate-180"
            aria-hidden="true"
            size={18}
          />
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(98,113,133,0.18)] bg-[#f7f9fb] text-[#24476f]">
            <Icon aria-hidden="true" size={17} />
          </span>
          <div>
            <h3 className="mb-0 flex items-center gap-2 text-[0.96rem] font-[730] tracking-normal">
              {group.title}
              <span className="inline-flex h-[22px] min-w-6 items-center justify-center rounded-full bg-[#eef3f8] px-2 text-[0.76rem] font-[720] text-slate-600">
                {group.count}
              </span>
            </h3>
            <p className="mb-0 text-[0.82rem] text-[#5f6d7e]">
              {group.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-[0.8rem] font-[620] text-[#5f6d7e] max-[720px]:justify-start">
          <span>Oldest {group.oldestAge}</span>
        </div>
      </Collapsible.Trigger>
      <Collapsible.Panel className="border-t border-[rgba(118,130,150,0.18)] bg-[#fbfcfd] p-0">
        {group.rows.length > 0 ? (
          <>
            <ReportsTable
              ariaLabel={`${group.title} reports`}
              rows={group.rows.slice(0, visibleRows)}
              showControls={false}
            />
            <div className="mt-0 flex items-center justify-between gap-4 border-t border-[rgba(118,130,150,0.14)] px-4 py-3 text-[0.82rem] text-[#5f6d7e] max-[720px]:items-start max-[720px]:flex-col">
              <span>
                Showing {Math.min(visibleRows, group.rows.length)} of{" "}
                {group.rows.length} sample rows.
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!canShowMore}
                onClick={() => setVisibleRows((current) => current + rowsPerGroup)}
              >
                Show more
              </Button>
            </div>
          </>
        ) : (
          <div className={emptyState}>No reports match this bucket.</div>
        )}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
