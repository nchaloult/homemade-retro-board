import { isNull } from "drizzle-orm";
import { db } from "~/drizzle/config.server";
import { boards } from "~/drizzle/schema.server";

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

export async function createBoard(displayName: string) {
  return await db.insert(boards).values({ externalId: "testing", displayName });
}
