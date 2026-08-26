import type { PrismaClient } from "@prisma/client";

type PrismaProperty = keyof PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPromise?: Promise<PrismaClient>;
};

function normalizeConnectionUrl(raw: string | undefined) {
  if (!raw) {
    return raw;
  }

  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/postgres(?:ql)?:\/\/\S+/i);
  if (!urlMatch) {
    return trimmed;
  }

  return urlMatch[0].replace(/^['"]|['"]$/g, "");
}

function normalizePrismaEnv() {
  const databaseUrl = normalizeConnectionUrl(process.env.DATABASE_URL);
  if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
  }

  const unpooledUrl = normalizeConnectionUrl(process.env.DATABASE_URL_UNPOOLED);
  if (unpooledUrl) {
    process.env.DATABASE_URL_UNPOOLED = unpooledUrl;
  }
}

function createPrismaClient() {
  normalizePrismaEnv();

  return import("@prisma/client").then(({ PrismaClient }) => {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }

    return client;
  });
}

export async function getDb() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createPrismaClient();
  }

  const client = await globalForPrisma.prismaPromise;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

function createPrismaPropertyProxy(property: PrismaProperty) {
  return new Proxy(
    async () => undefined,
    {
      apply(_target, _thisArg, args) {
        return getDb().then((client) => {
          const value = client[property] as unknown;

          if (typeof value !== "function") {
            throw new Error(`Unsupported Prisma client method: ${String(property)}`);
          }

          return value.apply(client, args);
        });
      },
      get(_target, method) {
        if (method === "then") {
          return undefined;
        }

        if (typeof method !== "string") {
          return undefined;
        }

        return async (...args: unknown[]) => {
          const client = await getDb();
          const delegate = client[property] as unknown as Record<
            string,
            (...fnArgs: unknown[]) => unknown
          >;
          const fn = delegate[method];

          if (typeof fn !== "function") {
            throw new Error(`Unsupported Prisma delegate method: ${String(property)}.${method}`);
          }

          return fn.apply(delegate, args);
        };
      },
    },
  );
}

export const db = new Proxy(
  {},
  {
    get(_target, property) {
      if (typeof property !== "string") {
        return undefined;
      }

      return createPrismaPropertyProxy(property as PrismaProperty);
    },
  },
) as PrismaClient;

export async function closeClient() {
  const client = await getDb();
  await client.$disconnect();
}

const dbClient = { db, getDb, closeClient };

export default dbClient;
