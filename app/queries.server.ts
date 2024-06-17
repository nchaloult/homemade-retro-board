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

export async function createColumn(
  name: string,
  boardId: number,
  order: number
) {
  await db.insert(columns).values({ name, boardId, order });
}

export async function createEntry(
  gifUrl: string | undefined,
  content: string,
  authorDisplayName: string,
  boardId: number,
  columnId: number,
  order: number
) {
  if (gifUrl === undefined) {
    await db
      .insert(entries)
      .values({ content, authorDisplayName, boardId, columnId, order });
  } else {
    await db
      .insert(entries)
      .values({ gifUrl, content, authorDisplayName, boardId, columnId, order });
  }
}

export async function getAllBoards() {
  return await db
    .select({
      externalId: boards.externalId,
      name: boards.name,
      createdAt: boards.createdAt,
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
  gifUrl?: string;
  content: string;
  authorDisplayName: string;
  upvotes: number;
  order: number;
}
export interface Column {
  columnId: number;
  columnName: string;
  columnOrder: number;
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
      gifUrl: entries.gifUrl,
      content: entries.content,
      authorDisplayName: entries.authorDisplayName,
      upvotes: entries.upvotes,
      order: entries.order,
      columnId: columns.id,
      columnName: columns.name,
      columnOrder: columns.order,
    })
    .from(columns)
    .leftJoin(entries, eq(columns.id, entries.columnId))
    .where(eq(columns.boardId, id))
    .orderBy(asc(columns.order), asc(entries.order));

  const finalEntriesList: Column[] = [];
  let curColumn: Column = {
    columnId: -1,
    columnName: "",
    columnOrder: -1,
    entries: [],
  };
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
        columnOrder: entry.columnOrder,
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
      if (entry.gifUrl !== null) {
        trimmedEntry.gifUrl = entry.gifUrl;
      }
      curColumn.entries.push(trimmedEntry);
    }
  }
  // After we've iterated through all the entries, curColumn will have all the
  // entries in the last column in it. We need to flush this buffer.
  finalEntriesList.push(curColumn);

  // If there are no entries for this board, don't include the placeholder
  // curColumn Column in the response we send to the client.
  if (curColumnId === undefined) {
    return { id, name, entries: [] };
  }
  return { id, name, entries: finalEntriesList };
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

export async function updateColumn(id: number, name: string) {
  await db.update(columns).set({ name }).where(eq(columns.id, id));
}

export async function updateEntry(
  id: number,
  content: string,
  gifUrl: string | undefined
) {
  if (gifUrl === undefined) {
    await db.update(entries).set({ content }).where(eq(entries.id, id));
  } else {
    await db.update(entries).set({ content, gifUrl }).where(eq(entries.id, id));
  }
}

export async function sortColumn(id: number) {
  // TODO: Look into using other parameters/string interpolation goodies that
  // Drizzle's "magic sql" operator supports.
  await db.run(sql`
  WITH ranked_entries AS (
    SELECT 
        id,
        upvotes,
        ROW_NUMBER() OVER (ORDER BY upvotes DESC) AS new_order
    FROM entries
    WHERE entries.column_id = ${id}
  )
  UPDATE entries
  SET \`order\` = (
      SELECT new_order
      FROM ranked_entries
      WHERE ranked_entries.id = entries.id
  )
  WHERE entries.column_id = ${id};
  `);
}
