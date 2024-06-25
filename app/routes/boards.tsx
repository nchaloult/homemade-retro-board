import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getAllBoards } from "~/queries.server";

export async function loader() {
  const boards = await getAllBoards();
  return json({ boards });
}

export default function Boards() {
  const { boards } = useLoaderData<typeof loader>();

  return (
    <div className="px-12 pb-12 pt-8">
      <header className="mb-8">
        <h1 className="font-bold text-4xl">Previous Boards</h1>
      </header>
      <main className="grid grid-cols-3 gap-4">
        {boards.length > 0 ? (
          boards.map((board) => (
            <BoardCard
              key={board.externalId}
              externalId={board.externalId}
              name={board.name}
              createdAt={board.createdAt}
            />
          ))
        ) : (
          <p className="italic text-stone-400">No boards to display.</p>
        )}
      </main>
    </div>
  );
}

interface BoardCardProps {
  externalId: string;
  name: string;
  createdAt: string;
}
function BoardCard(props: BoardCardProps) {
  const [isRotatedClockwise, setIsRotatedClockwise] = useState(
    Math.random() > 0.5
  );

  function randomizeRotationDirection() {
    setIsRotatedClockwise(Math.random() > 0.5);
  }

  return (
    <Link
      to={`${props.externalId}`}
      className={`flex flex-col gap-4 justify-between p-4 rounded-xl bg-white border-2 border-stone-200 hover:shadow-[rgb(231_229_228)_0_4px] dark:bg-stone-600 dark:border-stone-700 hover:dark:shadow-[rgb(68_64_60)_0_4px] outline-none hover:scale-105 ${
        isRotatedClockwise ? "hover:rotate-1" : "hover:-rotate-1"
      } active:scale-100 active:rotate-0 transition`}
      onMouseEnter={() => randomizeRotationDirection()}
    >
      <h1 className="font-bold text-2xl">{props.name}</h1>
      <p className="text-sm text-stone-400 italic">
        Created on {new Date(props.createdAt).toLocaleString()}
      </p>
    </Link>
  );
}
