import { getReadyListSnapshot } from "../../../src/data/reports";

export function GET() {
  const { generatedAt, reports, summary } = getReadyListSnapshot();

  return Response.json({ generatedAt, summary, reports });
}
