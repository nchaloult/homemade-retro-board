import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getAllBoards } from "~/models/boards.server";

export async function loader() {
  const boards = await getAllBoards();
  return json({ boards });
}

export default function Boards() {
  const { boards } = useLoaderData<typeof loader>();

  return (
    <div className="p-12">
      <header>
        <h1 className="font-bold text-4xl mb-8">Previous Boards</h1>
      </header>
      <main className="grid grid-cols-3 grid-rows-3 gap-4">
        {boards.length > 0 ? (
          boards.map((board) => (
            <BoardCard
              key={board.id}
              externalId={board.externalId}
              displayName={board.displayName}
              createdAt={board.createdAt}
              updatedAt={board.updatedAt}
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
  key: number;
  externalId: string;
  displayName: string;
  createdAt: string;
  updatedAt?: string | null;
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
      key={props.key}
      to={`${props.externalId}`}
      className={`p-4 rounded-xl bg-white border-2 border-stone-200 hover:border-b-[6px] hover:scale-[105%] ${
        isRotatedClockwise ? "hover:rotate-1" : "hover:-rotate-1"
      } focus:outline-none focus:border-stone-400 transition-all`}
      onMouseEnter={() => randomizeRotationDirection()}
    >
      <h1 className="font-bold text-2xl mb-4">{props.displayName}</h1>
      <p className="text-sm text-stone-400 italic">
        Created on {new Date(props.createdAt).toLocaleString()}
      </p>
      {props.updatedAt && props.updatedAt !== null ? (
        <p className="text-sm text-stone-400 italic">
          Last updated on {new Date(props.updatedAt).toLocaleString()}
        </p>
      ) : null}
    </Link>
  );
}
