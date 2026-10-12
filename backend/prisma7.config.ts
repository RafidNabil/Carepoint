import "dotenv/config";
import { defineConfig } from "prisma/config";

const env = (globalThis as typeof globalThis & {
  process: { env: Record<string, string | undefined> };
}).process.env;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env["DIRECT_URL"] || env["DATABASE_URL"],
  },
});
