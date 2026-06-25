import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@celo-agent-preflight/readylist",
    "@celo-agent-preflight/report-schema"
  ],
  typedRoutes: true,
  turbopack: {
    root: workspaceRoot
  }
};

export default nextConfig;
