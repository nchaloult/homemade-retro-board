import { asc, eq, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import nanoidDictionaryPkg from "nanoid-dictionary";
import { db } from "~/drizzle/config.server";
import { boards, columns, comments, entries } from "~/drizzle/schema.server";

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
  content: string,
  authorDisplayName: string,
  boardId: number,
  columnId: number,
  order: number
) {
  await db
    .insert(entries)
    .values({ content, authorDisplayName, boardId, columnId, order });
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

export interface Comment {
  id: number;
  content: string;
  authorDisplayName: string;
  upvotes: number;
  order: number;
}
export interface Entry {
  id: number;
  content: string;
  authorDisplayName: string;
  upvotes: number;
  order: number;
  comments: Comment[];
}
export interface Column {
  columnId: number;
  columnName: string;
  columnOrder: number;
  entries: Entry[];
}
export async function getBoard(externalId: string) {
  const resultSet = await db.query.boards.findFirst({
    where: eq(boards.externalId, externalId),
    with: {
      columns: {
        orderBy: [asc(columns.order)],
      },
      entries: {
        orderBy: [asc(entries.order)],
      },
      comments: {
        orderBy: [asc(comments.order)],
      },
    },
  });

  if (resultSet === undefined) {
    throw new Response("Board not found", { status: 404 });
  }
  if (resultSet.columns.length === 0) {
    return { id: resultSet.id, name: resultSet.name, entries: [] };
  }

  // TODO: Find a way to make this more efficient? Or not, I mean it works and
  // it works well....
  const finalList: Column[] = resultSet.columns.map((column) => ({
    columnId: column.id,
    columnName: column.name,
    columnOrder: column.order,
    entries: resultSet.entries
      .filter((entry) => entry.columnId === column.id)
      .map((entry) => ({
        id: entry.id,
        content: entry.content,
        authorDisplayName: entry.authorDisplayName,
        upvotes: entry.upvotes,
        order: entry.order,
        comments: resultSet.comments
          .filter((comment) => comment.entryId === entry.id)
          .map((comment) => ({
            id: comment.id,
            content: comment.content,
            authorDisplayName: comment.authorDisplayName,
            upvotes: comment.upvotes,
            order: comment.order,
          })),
      })),
  }));

  return { id: resultSet.id, name: resultSet.name, entries: finalList };
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
