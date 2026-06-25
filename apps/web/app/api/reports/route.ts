import { listReports } from "../../../src/data/reports";

export function GET() {
  return Response.json({ reports: listReports() });
}
