#!/usr/bin/env node

/**
 * Development environment setup script.
 * Runs automatically after `pnpm install` via the `prepare` lifecycle hook.
 * Can also be run manually: `node scripts/setup.js`
 */

const { execSync } = require("node:child_process");
const { existsSync, writeFileSync, readFileSync } = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const log = {
  info: (msg) => console.log(`${CYAN}ℹ${RESET}  ${msg}`),
  success: (msg) => console.log(`${GREEN}✓${RESET}  ${msg}`),
  warn: (msg) => console.log(`${YELLOW}⚠${RESET}  ${msg}`),
  error: (msg) => console.error(`${RED}✗${RESET}  ${msg}`),
  header: (msg) => console.log(`\n${CYAN}━━━ ${msg} ━━━${RESET}`),
};

function run(cmd, options = {}) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit", ...options });
    return true;
  } catch {
    return false;
  }
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: "pipe" }).toString().trim();
  } catch {
    return null;
  }
}

// ─── Step 1: Check Node.js version ────────────────────────────────────────────
log.header("Checking Prerequisites");

const nodeVersion = process.versions.node;
const [major] = nodeVersion.split(".").map(Number);
if (major < 20) {
  log.error(`Node.js 20+ required. Current: ${nodeVersion}`);
  log.error("Download from: https://nodejs.org");
  process.exit(1);
}
log.success(`Node.js ${nodeVersion}`);

// ─── Step 2: Check pnpm ───────────────────────────────────────────────────────
const pnpmVersion = runSilent("pnpm --version");
if (!pnpmVersion) {
  log.error("pnpm not found. Install with: npm install -g pnpm");
  process.exit(1);
}
log.success(`pnpm ${pnpmVersion}`);

// ─── Step 3: Set up .env ──────────────────────────────────────────────────────
log.header("Environment Setup");

const envPath = path.join(ROOT, ".env");
const envExamplePath = path.join(ROOT, ".env.example");

if (!existsSync(envPath) && existsSync(envExamplePath)) {
  const example = readFileSync(envExamplePath, "utf-8");
  writeFileSync(envPath, example);
  log.success("Created .env from .env.example");
  log.warn("Please fill in your API keys in .env");
} else if (existsSync(envPath)) {
  log.success(".env already exists");
} else {
  log.warn(".env.example not found — skipping .env creation");
}

// ─── Step 4: Set up Husky ────────────────────────────────────────────────────
log.header("Git Hooks");

const huskyDir = path.join(ROOT, ".husky");
if (!existsSync(huskyDir)) {
  const success = run("pnpm exec husky");
  if (success) {
    log.success("Husky initialized");
  } else {
    log.warn("Husky init failed — git hooks will not run");
  }
} else {
  log.success("Husky already configured");
}

// ─── Step 5: Build packages ──────────────────────────────────────────────────
log.header("Building Packages");

log.info("Building shared packages (first time takes ~30s)...");
const buildSuccess = run("pnpm turbo run build --filter='./packages/*'", {
  stdio: ["inherit", "pipe", "inherit"],
});

if (buildSuccess) {
  log.success("Packages built successfully");
} else {
  log.warn("Package build failed — run 'pnpm build' to retry after setup");
}

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log(`
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  GitHub AI Actions development environment ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}

Next steps:
  1. Add API keys to ${CYAN}.env${RESET}
  2. Run tests: ${CYAN}pnpm test${RESET}
  3. Start developing: ${CYAN}code .${RESET}

Useful commands:
  ${CYAN}pnpm build${RESET}      Build all packages
  ${CYAN}pnpm test${RESET}       Run all tests  
  ${CYAN}pnpm lint${RESET}       Lint all files
  ${CYAN}pnpm typecheck${RESET}  TypeScript check
  ${CYAN}pnpm changeset${RESET}  Create a release changeset

Documentation:
  README.md      → Quick start
  ARCHITECTURE.md → Technical design
  CONTRIBUTING.md → How to contribute
`);
