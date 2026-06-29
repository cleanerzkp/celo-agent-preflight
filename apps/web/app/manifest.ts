import type { MetadataRoute } from "next";

import { SITE } from "../src/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#050806",
    theme_color: "#050806",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }]
  };
}
