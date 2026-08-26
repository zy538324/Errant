import { existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

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
      console.log(`Using ${key} as DATABASE_URL.`);
      return value;
    }
  }

  return null;
}

function requireValue(name, value) {
  const trimmed = value?.trim();
  if (!trimmed) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
  return trimmed;
}

if (existsSync(envPath)) {
  const result = dotenv.config({ path: envPath, override: true });
  if (result.error) {
    console.error(`Unable to load ${envPath}:`, result.error);
    process.exit(1);
  }
} else {
  console.warn(".env.production.local was not found. Falling back to current process environment.");
}

if (!resolveDatabaseUrl()) {
  console.error("No production database URL was found. Add DATABASE_URL to .env.production.local or the current shell environment.");
  process.exit(1);
}

const username = requireValue("ADMIN_USERNAME", process.env.ADMIN_USERNAME);
const email = requireValue("ADMIN_EMAIL", process.env.ADMIN_EMAIL).toLowerCase();
const password = requireValue("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD);

if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters long.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      email,
      passwordHash,
      role: "ADMIN",
      mfaEnabled: false,
    },
    create: {
      username,
      email,
      passwordHash,
      role: "ADMIN",
      mfaEnabled: false,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  console.log(`Admin user ready: ${user.username} <${user.email}> (${user.role})`);
} catch (error) {
  console.error("Unable to create admin user:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
