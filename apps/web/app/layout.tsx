import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { SITE } from "../src/site";
import { SiteHeader } from "../src/components/site-header";
import { SiteFooter } from "../src/components/site-footer";

import "./globals.css";

const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--ff-display"
});

const fontGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-grotesk"
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s | ${SITE.name}`
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "Celo",
    "ERC-8004",
    "AI agents",
    "agent identity",
    "x402",
    "MCP",
    "A2A",
    "Self protocol",
    "onchain attestation",
    "agent verification"
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} - ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name }]
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} - ${SITE.tagline}`,
    description: SITE.description,
    images: ["/opengraph-image"]
  },
  robots: { index: true, follow: true },
  category: "technology"
};

export const viewport: Viewport = {
  themeColor: "#050806",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: {
  readonly children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontGrotesk.variable} ${fontMono.variable}`}
    >
      <body>
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
