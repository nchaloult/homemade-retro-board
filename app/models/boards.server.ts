import { asc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "~/drizzle/config.server";
import { boards, columns, entries } from "~/drizzle/schema.server";

export async function createBoard(displayName: string) {
  const externalId = nanoid();
  await db.insert(boards).values({ externalId, displayName });
  return externalId;
}

export async function getAllBoards() {
  return await db
    .select({
      externalId: boards.externalId,
      displayName: boards.displayName,
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
    .select({ id: boards.id, displayName: boards.displayName })
    .from(boards)
    .where(eq(boards.externalId, externalId))
    .limit(1);
  if (boardsArray.length === 0) {
    throw new Response("Board not found", { status: 404 });
  }
  // Will always only contain 1 row because of the `LIMIT 1` clause attached to
  // the query above.
  const { id, displayName } = boardsArray[0];

  const entriesArray = await db
    .select({
      id: entries.id,
      content: entries.content,
      order: entries.order,
      upvotes: entries.upvotes,
    })
    .from(entries)
    .leftJoin(columns, eq(entries.columnId, columns.id))
    .where(eq(entries.boardId, id))
    .groupBy(entries.columnId)
    .orderBy(asc(columns.order), asc(entries.order));

  return { displayName, entries: entriesArray };
}
