import { getReadyListSnapshot } from "../../../src/data/reports";

export function GET() {
  const { entries, generatedAt, summary } = getReadyListSnapshot();

  return Response.json({ generatedAt, summary, agents: entries });
}
