import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { PlusIcon, UpArrowIcon } from "~/icons";
import type { Entry } from "~/queries.server";
import { getBoard } from "~/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const externalId = params.externalId;
  if (externalId === undefined || externalId.length === 0) {
    throw new Response("Board ID not found", { status: 400 });
  }

  const { name, entries } = await getBoard(externalId);

  return json({ name, entries });
}

export default function Board() {
  const { name, entries } = useLoaderData<typeof loader>();

  return (
    <div className="px-12 pb-12 pt-8">
      {/* mb-6, not mb-8, since the <main> tag has padding on the top (and bottom,
      but that's not important) of 2. */}
      <header className="mb-6">
        <h1 className="font-bold text-4xl">{name}</h1>
      </header>
      {/* Need this vertical padding to offset the weird clipping that happens when
      we add overflow-x-auto. */}
      <main className="w-full py-2 flex space-x-4 overflow-x-auto">
        {entries.map((column) => (
          <Column
            key={column.columnId}
            name={column.columnName}
            entries={column.entries}
          />
        ))}
        <NewColumnButton />
      </main>
    </div>
  );
}

interface ColumnProps {
  name: string;
  entries: Entry[];
}
function Column({ name, entries }: ColumnProps) {
  return (
    <section className="w-80 flex-none">
      <h2 className="font-semibold text-xl mb-4">{name}</h2>
      <div className="flex flex-col space-y-2">
        {entries.map((entry) => (
          <Entry
            key={entry.id}
            content={entry.content}
            authorDisplayName={entry.authorDisplayName}
            upvotes={entry.upvotes}
          />
        ))}
        <NewCardButton />
      </div>
    </section>
  );
}

interface EntryProps {
  content: string;
  authorDisplayName: string;
  upvotes: number;
}
function Entry({ content, authorDisplayName, upvotes }: EntryProps) {
  return (
    <div
      className={
        "overflow-hidden rounded-xl bg-white border-2 border-stone-200 outline-none transition"
      }
    >
      <div className="px-3 py-2">
        <p>{content}</p>
      </div>
      <hr className="h-0.5 bg-stone-200 border-0 rounded" />
      <div className="flex justify-between items-center px-3 py-1 bg-stone-100">
        <span className="text-stone-400">{authorDisplayName}</span>
        <button className="flex items-center space-x-1 px-2 py-1 -mr-2 rounded-full text-stone-400 outline-none hover:bg-stone-200 focus:bg-stone-200">
          <UpArrowIcon />
          <span className="text-stone-400">{upvotes}</span>
        </button>
      </div>
    </div>
  );
}

function NewCardButton() {
  return (
    <button
      type="button"
      className="flex justify-center items-center space-x-1 px-4 py-2 rounded-lg bg-stone-200 text-stone-900 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 transition"
    >
      <PlusIcon />
      <span>New Card</span>
    </button>
  );
}

function NewColumnButton() {
  return (
    <button
      type="button"
      className="w-42 h-32 flex flex-none justify-center items-center space-x-1 px-4 py-2 rounded-lg bg-stone-200 text-stone-900 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 transition"
    >
      <PlusIcon />
      <span>New Column</span>
    </button>
  );
}
