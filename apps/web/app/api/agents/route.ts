import { listReadyListEntries } from "../../../src/data/reports";

export function GET() {
  return Response.json({ agents: listReadyListEntries() });
}
