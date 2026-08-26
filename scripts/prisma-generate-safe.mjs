#!/usr/bin/env node

import { existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const maxAttempts = 5;
const retryDelayMs = 1000;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const prismaClientDirectory = resolve(projectRoot, "node_modules", ".prisma", "client");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupPrismaClientArtifacts() {
  if (!existsSync(prismaClientDirectory)) {
    return;
  }

  for (const entry of readdirSync(prismaClientDirectory)) {
    if (!/query_engine-.*\.dll\.node(?:\.tmp\d+)?$/i.test(entry)) {
      continue;
    }

    try {
      rmSync(resolve(prismaClientDirectory, entry), { force: true });
    } catch (error) {
      console.warn(`Unable to remove stale Prisma engine artifact ${entry}:`, error?.message ?? error);
    }
  }
}

function isRetryableGenerateError(result) {
  const combinedOutput = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return /EPERM|EBUSY|access is denied|rename .*\.tmp/i.test(combinedOutput);
}

async function main() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    cleanupPrismaClientArtifacts();

    const result = spawnSync("prisma", ["generate"], {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      shell: process.platform === "win32",
      env: process.env,
    });

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.status === 0) {
      process.exit(0);
    }

    const retryable = result.error || isRetryableGenerateError(result);
    if (!retryable || attempt === maxAttempts) {
      if (result.error) {
        console.error("Prisma generate failed:", result.error);
      }
      process.exit(result.status ?? 1);
    }

    const waitMs = retryDelayMs * attempt;
    console.warn(`Prisma generate failed on attempt ${attempt}/${maxAttempts}. Retrying in ${waitMs}ms...`);
    await sleep(waitMs);
  }
}

main().catch((error) => {
  console.error("Prisma generate wrapper failed:", error);
  process.exit(1);
});