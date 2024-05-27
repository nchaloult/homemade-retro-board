import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: integer("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const boardsRelations = relations(boards, ({ many }) => ({
  columns: many(columns),
  entries: many(entries),
  comments: many(comments),
}));

export const columns = sqliteTable("columns", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  // We split the difference between the prev/next items. If an item is dropped
  // between 1.00 and 2.00 it will be 1.50. If dropped between 1.50 and 2.00 it
  // will be 1.75, etc.
  order: real("order").notNull().default(0),
  boardId: integer("board_id").references(() => boards.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const columnsRelations = relations(columns, ({ many, one }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  entries: many(entries),
}));

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  authorDisplayName: text("author_display_name").notNull(),
  upvotes: integer("upvotes", { mode: "number" }).notNull().default(0),
  // We split the difference between the prev/next items. If an item is dropped
  // between 1.00 and 2.00 it will be 1.50. If dropped between 1.50 and 2.00 it
  // will be 1.75, etc.
  order: real("order").notNull().default(0),
  boardId: integer("board_id").references(() => boards.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  columnId: integer("column_id").references(() => columns.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const entriesRelations = relations(entries, ({ many, one }) => ({
  board: one(boards, {
    fields: [entries.boardId],
    references: [boards.id],
  }),
  column: one(columns, {
    fields: [entries.columnId],
    references: [columns.id],
  }),
  comments: many(comments),
}));

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  authorDisplayName: text("author_display_name").notNull(),
  upvotes: integer("upvotes", { mode: "number" }).notNull().default(0),
  // We split the difference between the prev/next items. If an item is dropped
  // between 1.00 and 2.00 it will be 1.50. If dropped between 1.50 and 2.00 it
  // will be 1.75, etc.
  order: real("order").notNull().default(0),
  boardId: integer("board_id").references(() => boards.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  columnId: integer("column_id").references(() => columns.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  entryId: integer("entry_id").references(() => entries.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  board: one(boards, {
    fields: [comments.boardId],
    references: [boards.id],
  }),
  column: one(columns, {
    fields: [comments.columnId],
    references: [columns.id],
  }),
  entry: one(entries, {
    fields: [comments.entryId],
    references: [entries.id],
  }),
}));
