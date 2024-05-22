import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_PATH || "sqlite.db" },
  schema: "./app/drizzle/schema.server.ts",
  out: "./migrations",
  strict: true,
  verbose: true,
});
