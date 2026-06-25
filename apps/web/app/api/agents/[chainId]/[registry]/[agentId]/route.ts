import { getReportForAgent } from "../../../../../../src/data/reports";

interface AgentRouteParams {
  readonly agentId: string;
  readonly chainId: string;
  readonly registry: string;
}

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<AgentRouteParams> }
) {
  const report = getReportForAgent(await params);

  if (!report) {
    return Response.json({ error: "Agent report not found." }, { status: 404 });
  }

  return Response.json({ report });
}
