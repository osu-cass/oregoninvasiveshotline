import { Badge } from "@cloudflare/kumo/components/badge";
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
import { useState } from "react";
import type { ReportStage, StatusGroup } from "../data/dashboardData";
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
export function QueueSection({ group, rowsPerGroup }: QueueSectionProps) {
  const [open, setOpen] = useState(group.defaultOpen);
  const [visibleRows, setVisibleRows] = useState(rowsPerGroup);
  const canShowMore = visibleRows < group.rows.length;
  const Icon = iconByStage[group.stage];

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="queue-section">
      <Collapsible.Trigger className="queue-trigger">
        <div className="section-title-group">
          <ChevronDown className="chevron" aria-hidden="true" size={18} />
          <span className="section-icon">
            <Icon aria-hidden="true" size={17} />
          </span>
          <div>
            <h3>
              {group.title}
              <span className="section-count">{group.count}</span>
            </h3>
            <p>{group.description}</p>
          </div>
        </div>
        <div className="section-meta">
          {group.threshold ? <Badge variant="warning">{group.threshold}</Badge> : null}
          <span>Oldest {group.oldestAge}</span>
        </div>
      </Collapsible.Trigger>
      <Collapsible.Panel className="queue-panel-body">
        {group.rows.length > 0 ? (
          <>
            <ReportsTable rows={group.rows.slice(0, visibleRows)} />
            <div className="show-more-row">
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
          <div className="empty-state">No reports match this bucket.</div>
        )}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
