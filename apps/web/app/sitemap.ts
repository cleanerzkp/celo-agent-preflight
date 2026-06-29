import type { MetadataRoute } from "next";

import { SITE } from "../src/site";
import { listReports } from "../src/data/reports";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/scan`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/agents`, changeFrequency: "daily", priority: 0.8 }
  ];

  let reportRoutes: MetadataRoute.Sitemap = [];
  try {
    reportRoutes = listReports()
      .filter((report) => Boolean(report.reportHash))
      .map((report) => ({
        url: `${base}/reports/${report.reportHash}`,
        changeFrequency: "monthly" as const,
        priority: 0.5
      }));
  } catch {
    reportRoutes = [];
  }

  return [...staticRoutes, ...reportRoutes];
}
