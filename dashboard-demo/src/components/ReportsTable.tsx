import { Badge } from "@cloudflare/kumo/components/badge";
import { Table } from "@cloudflare/kumo/components/table";
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

/** Renders report rows in a Kumo table. */
export function ReportsTable({ rows }: ReportsTableProps) {
  return (
    <div className="table-wrap">
      <Table layout="fixed">
        <Table.Header variant="compact">
          <Table.Row>
            <Table.Head>Report</Table.Head>
            <Table.Head>Submitted</Table.Head>
            <Table.Head>Age</Table.Head>
            <Table.Head>Stage</Table.Head>
            <Table.Head>Claimed by</Table.Head>
            <Table.Head>County</Table.Head>
            <Table.Head>Category</Table.Head>
            <Table.Head>Last action</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
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
              <Table.Cell>{row.county}</Table.Cell>
              <Table.Cell>{row.category}</Table.Cell>
              <Table.Cell>{row.lastAction}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
