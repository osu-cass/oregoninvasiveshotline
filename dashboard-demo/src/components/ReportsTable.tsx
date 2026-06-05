import { Badge } from "@cloudflare/kumo/components/badge";
import { Table } from "@cloudflare/kumo/components/table";
import { Button } from "@cloudflare/kumo/components/button";
import { Dialog, DialogClose, DialogRoot, DialogTitle } from "@cloudflare/kumo/components/dialog";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Textarea } from "@cloudflare/kumo/components/input";
import {
  Clipboard,
  ExternalLink,
  Link,
  Mail,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useState } from "react";
import type { ReportRow } from "../data/dashboardData";

interface ReportsTableProps {
  /** Rows to render in the report table. */
  rows: ReportRow[];
}

const badgeByStatus = {
  unclaimed: "warning",
  claimed_needs_response: "error",
  responded: "success",
  confirmed: "info",
  flagged: "blue",
} as const;

const labelByStatus = {
  unclaimed: "Unclaimed",
  claimed_needs_response: "Needs response",
  responded: "Responded",
  confirmed: "Confirmed",
  flagged: "Flagged",
} as const;

type SortKey =
  | "age"
  | "category"
  | "claimedBy"
  | "county"
  | "id"
  | "lastAction"
  | "stage"
  | "submitted";

type SortDirection = "asc" | "desc";

interface SortState {
  /** Active column key. */
  key: SortKey;
  /** Active sort direction. */
  direction: SortDirection;
}

/** Renders report rows in a Kumo table. */
export function ReportsTable({ rows }: ReportsTableProps) {
  const [sort, setSort] = useState<SortState>({
    direction: "asc",
    key: "submitted",
  });
  const [emailRow, setEmailRow] = useState<ReportRow | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const sortedRows = sortRows(rows, sort);

  const updateSort = (key: SortKey) => {
    setSort((currentSort) => ({
      direction:
        currentSort.key === key && currentSort.direction === "asc"
          ? "desc"
          : "asc",
      key,
    }));
  };

  const openEmailDialog = (row: ReportRow) => {
    setEmailRow(row);
    setEmailBody(createEmailDraft(row));
  };

  return (
    <>
      <div className="table-wrap">
        <Table layout="fixed">
          <Table.Header variant="compact">
            <Table.Row>
              <Table.Head>
                <button className="sort-button" onClick={() => updateSort("id")}>
                  Report{getSortMarker(sort, "id")}
                </button>
              </Table.Head>
              <Table.Head>
                <button
                  className="sort-button"
                  onClick={() => updateSort("submitted")}
                >
                  Submitted{getSortMarker(sort, "submitted")}
                </button>
              </Table.Head>
              <Table.Head>
                <button className="sort-button" onClick={() => updateSort("age")}>
                  Age{getSortMarker(sort, "age")}
                </button>
              </Table.Head>
              <Table.Head>
                <button className="sort-button" onClick={() => updateSort("stage")}>
                  Stage{getSortMarker(sort, "stage")}
                </button>
              </Table.Head>
              <Table.Head>
                <button
                  className="sort-button"
                  onClick={() => updateSort("claimedBy")}
                >
                  Claimed by{getSortMarker(sort, "claimedBy")}
                </button>
              </Table.Head>
              <Table.Head>
                <button
                  className="sort-button"
                  onClick={() => updateSort("county")}
                >
                  County{getSortMarker(sort, "county")}
                </button>
              </Table.Head>
              <Table.Head>
                <button
                  className="sort-button"
                  onClick={() => updateSort("category")}
                >
                  Category{getSortMarker(sort, "category")}
                </button>
              </Table.Head>
              <Table.Head>
                <button
                  className="sort-button"
                  onClick={() => updateSort("lastAction")}
                >
                  Last action{getSortMarker(sort, "lastAction")}
                </button>
              </Table.Head>
              <Table.Head>
                <span className="visually-hidden">Actions</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedRows.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell>
                  <span className="report-id">{row.id}</span>
                </Table.Cell>
                <Table.Cell>{row.submitted}</Table.Cell>
                <Table.Cell>
                  <span className="age-pill">{row.age}</span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={badgeByStatus[row.status]}>
                    {labelByStatus[row.status]}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{row.claimedBy}</Table.Cell>
                <Table.Cell>
                  {row.county}, {row.state}
                </Table.Cell>
                <Table.Cell>{row.category}</Table.Cell>
                <Table.Cell>{row.lastAction}</Table.Cell>
                <Table.Cell>
                  <div className="row-actions">
                    <Button
                      aria-label={`Open ${row.id} in a new tab`}
                      size="sm"
                      shape="square"
                      variant="ghost"
                      onClick={() =>
                        window.open(row.issueUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink aria-hidden="true" size={15} />
                    </Button>
                    <DropdownMenu modal={false}>
                      <DropdownMenu.Trigger>
                        <Button
                          aria-label={`More actions for ${row.id}`}
                          size="sm"
                          shape="square"
                          variant="ghost"
                        >
                          <MoreHorizontal aria-hidden="true" size={16} />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content className="row-action-menu" sideOffset={6}>
                        {row.claimedBy !== "-" ? (
                          <>
                            <DropdownMenu.Item
                              icon={<Mail aria-hidden="true" size={15} />}
                              onClick={() => openEmailDialog(row)}
                            >
                              Draft email to reviewer
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              icon={<Clipboard aria-hidden="true" size={15} />}
                              onClick={() =>
                                navigator.clipboard.writeText(row.reviewerEmail)
                              }
                            >
                              Copy reviewer email
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                          </>
                        ) : null}
                        <DropdownMenu.Item
                          icon={<Link aria-hidden="true" size={15} />}
                          onClick={() => navigator.clipboard.writeText(row.issueUrl)}
                        >
                          Copy report link
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      <DialogRoot
        open={emailRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEmailRow(null);
          }
        }}
      >
        <Dialog className="email-dialog" size="base">
          <div className="dialog-header">
            <DialogTitle>Draft email to reviewer</DialogTitle>
          </div>
          <div className="dialog-body">
            <div className="email-meta">
              <span>To</span>
              <strong>{emailRow?.reviewerEmail}</strong>
            </div>
            <Textarea
              aria-label="Email draft"
              value={emailBody}
              onChange={(event) => setEmailBody(event.currentTarget.value)}
              rows={9}
            />
          </div>
          <div className="dialog-footer">
            <DialogClose
              render={(props) => (
                <Button {...props} variant="secondary">
                  Cancel
                </Button>
              )}
            />
            <Button onClick={() => setEmailRow(null)}>
              <Send aria-hidden="true" size={15} />
              Send
            </Button>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}

function sortRows(rows: ReportRow[], sort: SortState): ReportRow[] {
  return rows.slice().sort((left, right) => {
    const direction = sort.direction === "asc" ? 1 : -1;
    return compareRows(left, right, sort.key) * direction;
  });
}

function compareRows(left: ReportRow, right: ReportRow, key: SortKey): number {
  if (key === "age") {
    return left.ageDays - right.ageDays;
  }

  if (key === "submitted") {
    return left.submittedTime - right.submittedTime;
  }

  return getSortValue(left, key).localeCompare(getSortValue(right, key));
}

function getSortValue(row: ReportRow, key: SortKey): string {
  const values: Record<Exclude<SortKey, "age" | "submitted">, string> = {
    category: row.category,
    claimedBy: row.claimedBy,
    county: `${row.county}, ${row.state}`,
    id: row.id,
    lastAction: row.lastAction,
    stage: labelByStatus[row.status],
  };

  return values[key as Exclude<SortKey, "age" | "submitted">];
}

function getSortMarker(sort: SortState, key: SortKey): string {
  if (sort.key !== key) {
    return "";
  }

  return sort.direction === "asc" ? " ↑" : " ↓";
}

function createEmailDraft(row: ReportRow): string {
  return `Hi,

Could you take a look at report ${row.id}? It is currently marked as "${labelByStatus[row.status]}" and the last action was "${row.lastAction}".

County: ${row.county}, ${row.state}
Category: ${row.category}
Age: ${row.age}

Thanks.`;
}
