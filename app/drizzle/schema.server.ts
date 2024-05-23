import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: integer("id").primaryKey(),
  externalId: text("external_id").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const columns = sqliteTable("columns", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  order: real("order").notNull().default(0),
  boardId: integer("board_id").references(() => boards.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  // We split the difference between the prev/next items. If an item is dropped
  // between 1.00 and 2.00 it will be 1.50. If dropped between 1.50 and 2.00 it
  // will be 1.75, etc.
  order: real("order").notNull().default(0),
  upvotes: integer("upvotes", { mode: "number" }).notNull().default(0),
  boardId: integer("board_id").references(() => boards.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  columnId: integer("column_id").references(() => columns.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});