import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl =
  "postgresql://prisma:prisma@127.0.0.1:5432/errant_arts";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});
