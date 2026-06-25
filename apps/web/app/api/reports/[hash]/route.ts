import { getReportByHash } from "../../../../src/data/reports";

interface ReportRouteParams {
  readonly hash: string;
}

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<ReportRouteParams> }
) {
  const { hash } = await params;
  const report = getReportByHash(hash);

  if (!report) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  return Response.json({ report });
}
