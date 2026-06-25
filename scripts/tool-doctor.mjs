import { execFileSync } from "node:child_process";

const checks = [
  ["node", ["--version"], /^v24\.17\.0$/],
  ["pnpm", ["--version"], /^11\.9\.0$/],
  ["corepack", ["--version"], /^\d+\./],
  ["forge", ["--version"], /forge Version:/],
  ["cast", ["--version"], /cast Version:/],
  ["anvil", ["--version"], /anvil Version:/],
  ["solc", ["--version"], /Version: 0\.8\.24/],
  ["slither", ["--version"], /^\d+\./],
  ["wrangler", ["--version"], /^\d+\./],
  ["semgrep", ["--version"], /^\d+\./],
  ["gitleaks", ["version"], /^\d+\./],
  ["osv-scanner", ["--version"], /osv-scanner/],
  ["vercel", ["--version"], /Vercel CLI|\d+\./],
  ["gh", ["--version"], /gh version/],
  ["ctx7", ["--version"], /^\d+\./],
  ["context7-mcp", ["--version"], /^\d+\./]
];

let failed = 0;

for (const [bin, args, expected] of checks) {
  try {
    const output = execFileSync(bin, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    const firstLine = output.split("\n")[0] ?? "";
    const ok = expected.test(output);
    console.log(`${ok ? "ok" : "bad"} ${bin}: ${firstLine}`);
    if (!ok) failed += 1;
  } catch (error) {
    console.log(`missing ${bin}: ${error.message}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} tool check(s) failed.`);
  process.exit(1);
}

console.log("\nAll tool checks passed.");

