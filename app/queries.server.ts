import { asc, eq, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import nanoidDictionaryPkg from "nanoid-dictionary";
import { db } from "~/drizzle/config.server";
import { boards, columns, entries } from "~/drizzle/schema.server";

// Necessary because of CommonJS package compatibility with Vite.
const { nolookalikesSafe } = nanoidDictionaryPkg;

const generateNanoId = customAlphabet(nolookalikesSafe, 10);

export async function createBoard(name: string) {
  const externalId = generateNanoId();
  await db.insert(boards).values({ externalId, name });
  return externalId;
}

export async function getAllBoards() {
  return await db
    .select({
      externalId: boards.externalId,
      name: boards.name,
      createdAt: boards.createdAt,
      updatedAt: boards.updatedAt,
    })
    .from(boards)
    .where(isNull(boards.deletedAt));
}

export async function doesBoardExist(externalId: string) {
  const resultSet = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.externalId, externalId));

  return resultSet.length > 0;
}

export interface Entry {
  id: number;
  content: string;
  authorDisplayName: string;
  upvotes: number;
  order: number;
}
export interface Column {
  columnId: number;
  columnName: string;
  entries: Entry[];
}
export async function getBoard(externalId: string) {
  // TODO: Look for ways to reduce the number of queries we need to make?

  const boardsArray = await db
    .select({ id: boards.id, name: boards.name })
    .from(boards)
    .where(eq(boards.externalId, externalId))
    .limit(1);
  if (boardsArray.length === 0) {
    throw new Response("Board not found", { status: 404 });
  }
  // Will always only contain 1 row because of the `LIMIT 1` clause attached to
  // the query above.
  const { id, name } = boardsArray[0];

  const entriesArray = await db
    .select({
      id: entries.id,
      content: entries.content,
      authorDisplayName: entries.authorDisplayName,
      upvotes: entries.upvotes,
      order: entries.order,
      columnId: columns.id,
      columnName: columns.name,
    })
    .from(columns)
    .leftJoin(entries, eq(columns.id, entries.columnId))
    .where(eq(columns.boardId, id))
    .orderBy(asc(columns.order), asc(entries.order));

  const finalEntriesList: Column[] = [];
  let curColumn: Column = { columnId: 0, columnName: "", entries: [] };
  let curColumnId: number | undefined = undefined;
  for (const entry of entriesArray) {
    if (curColumnId !== entry.columnId) {
      if (curColumnId !== undefined) {
        finalEntriesList.push(curColumn);
      }
      curColumnId = entry.columnId!; // TODO: Revisit ! character.

      curColumn = {
        columnId: entry.columnId!, // TODO: Revisit ! character.
        columnName: entry.columnName,
        entries: [],
      };
    }

    if (entry.id !== null) {
      // TODO: Revisit ! characters. Why are they necessary? Where in previous
      // lines have you messed up with typing stuff?
      const trimmedEntry: Entry = {
        id: entry.id,
        content: entry.content!,
        authorDisplayName: entry.authorDisplayName!,
        upvotes: entry.upvotes!,
        order: entry.order!,
      };
      curColumn.entries.push(trimmedEntry);
    }
  }
  // After we've iterated through all the entries, curColumn will have all the
  // entries in the last column in it. We need to flush this buffer.
  finalEntriesList.push(curColumn);

  return { name, entries: finalEntriesList };
}

export async function upvoteEntry(id: number) {
  await db
    .update(entries)
    .set({ upvotes: sql`${entries.upvotes} + 1` })
    .where(eq(entries.id, id));
}

export async function downvoteEntry(id: number) {
  await db
    .update(entries)
    .set({ upvotes: sql`${entries.upvotes} - 1` })
    .where(eq(entries.id, id));
}
