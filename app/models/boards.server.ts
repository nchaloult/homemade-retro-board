import { isNull } from "drizzle-orm";
import { db } from "~/drizzle/config.server";
import { boards } from "~/drizzle/schema.server";

export async function getAllBoards() {
  return await db
    .select({
      id: boards.id,
      externalId: boards.externalId,
      displayName: boards.displayName,
      createdAt: boards.createdAt,
      updatedAt: boards.updatedAt,
    })
    .from(boards)
    .where(isNull(boards.deletedAt));
}
