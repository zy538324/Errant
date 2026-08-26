import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const envPath = resolve(process.cwd(), ".env.production.local");

const DATABASE_URL_FALLBACK_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING_POOLED",
  "NEON_DATABASE_URL",
  "NEON_POSTGRES_URL",
];

function normaliseConnectionUrl(raw) {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const urlMatch = trimmed.match(/postgres(?:ql)?:\/\/\S+/i);
  return (urlMatch ? urlMatch[0] : trimmed).replace(/^['"]|['"]$/g, "");
}

function resolveDatabaseUrl() {
  for (const key of DATABASE_URL_FALLBACK_KEYS) {
    const value = normaliseConnectionUrl(process.env[key]);
    if (value) {
      process.env.DATABASE_URL = value;
      console.log(`Using ${key} as DATABASE_URL for Prisma.`);
      return value;
    }
  }

  return null;
}

function resolvePrismaCommand() {
  const prismaNodeEntrypoint = resolve(
    process.cwd(),
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );

  if (existsSync(prismaNodeEntrypoint)) {
    return {
      command: process.execPath,
      args: [prismaNodeEntrypoint, "db", "push"],
      label: `node ${prismaNodeEntrypoint} db push`,
      shell: false,
    };
  }

  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["prisma", "db", "push"],
    label: "npx prisma db push",
    shell: process.platform === "win32",
  };
}

if (!existsSync(envPath)) {
  console.error("Missing .env.production.local. Run `npm run vercel:env:pull:prod` first.");
  process.exit(1);
}

const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.error(`Unable to load ${envPath}:`, result.error);
  process.exit(1);
}

if (!resolveDatabaseUrl()) {
  console.error(
    "No supported production database URL was found in .env.production.local. Add DATABASE_URL to Vercel Production Environment Variables, or expose one of: " +
      DATABASE_URL_FALLBACK_KEYS.filter((key) => key !== "DATABASE_URL").join(", "),
  );
  process.exit(1);
}

const { command, args, label, shell } = resolvePrismaCommand();
console.log(`Running: ${label}`);

const push = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env,
  shell,
});

if (push.error) {
  console.error("Unable to start Prisma db push:", push.error.message);
  process.exit(1);
}

if (typeof push.status !== "number") {
  console.error("Prisma db push ended without an exit status.");
  process.exit(1);
}

if (push.status !== 0) {
  console.error(`Prisma db push failed with exit code ${push.status}.`);
  process.exit(push.status);
}

console.log("Prisma db push completed successfully.");
