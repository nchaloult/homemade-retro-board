import { asc, eq, isNull } from "drizzle-orm";
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
      columnId: entries.columnId,
      columnName: columns.name,
    })
    .from(entries)
    .leftJoin(columns, eq(entries.columnId, columns.id))
    .where(eq(entries.boardId, id))
    .orderBy(asc(columns.order), asc(entries.order));

  return { name, entries: entriesArray };
}
