#!/usr/bin/env node

/**
 * Bundle all GitHub Actions using @vercel/ncc.
 * Creates dist/index.js for each action — ready for GitHub Actions runners.
 *
 * Usage: node scripts/bundle-actions.js [action-name]
 * Examples:
 *   node scripts/bundle-actions.js         # Bundle all actions
 *   node scripts/bundle-actions.js pr-review  # Bundle specific action
 */

const { execSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ACTIONS_DIR = path.join(ROOT, "actions");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

const ACTIONS = ["pr-review", "commit-message", "release-notes", "readme-generator"];

const targetAction = process.argv[2];
const actionsToBuild = targetAction
  ? ACTIONS.filter((a) => a === targetAction)
  : ACTIONS;

if (targetAction && actionsToBuild.length === 0) {
  console.error(`${RED}Unknown action: ${targetAction}${RESET}`);
  console.error(`Available: ${ACTIONS.join(", ")}`);
  process.exit(1);
}

console.log(`${CYAN}Bundling ${actionsToBuild.length} action(s)...${RESET}\n`);

let hasErrors = false;

for (const action of actionsToBuild) {
  const actionDir = path.join(ACTIONS_DIR, action);
  const entryPoint = path.join(actionDir, "src", "main.ts");
  const outDir = path.join(actionDir, "dist");

  if (!existsSync(entryPoint)) {
    console.error(`${RED}✗ ${action}: src/main.ts not found${RESET}`);
    hasErrors = true;
    continue;
  }

  console.log(`${CYAN}→ Bundling ${action}...${RESET}`);

  try {
    const startTime = Date.now();
    execSync(
      `pnpm exec ncc build src/main.ts -o dist --source-map --license licenses.txt`,
      { cwd: actionDir, stdio: "pipe" },
    );
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ${GREEN}✓ ${action} bundled in ${elapsed}s → dist/index.js${RESET}`);
  } catch (error) {
    console.error(`  ${RED}✗ ${action} bundle failed:${RESET}`);
    console.error(error.stderr?.toString() ?? error.message);
    hasErrors = true;
  }
}

console.log();

if (hasErrors) {
  console.error(`${RED}Some actions failed to bundle. Check errors above.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}All actions bundled successfully!${RESET}`);
  console.log(`Dist files are ready for GitHub Actions runners.`);
}
