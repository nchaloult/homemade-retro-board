import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "~/drizzle/schema.server";

const dbPath = process.env.DATABASE_PATH || "sqlite.db";

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
