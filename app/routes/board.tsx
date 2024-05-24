import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import { displayNameCookie } from "~/displayNameCookie.server";
import { PlusIcon, UpArrowIcon } from "~/icons";
import type { Entry } from "~/queries.server";
import {
  createEntry,
  downvoteEntry,
  getBoard,
  upvoteEntry,
} from "~/queries.server";

const ANONYMOUS_AUTHOR_DISPLAY_NAME = "Anonymous";

export async function loader({ params }: LoaderFunctionArgs) {
  const externalId = params.externalId;
  if (externalId === undefined || externalId.length === 0) {
    throw new Response("Board ID not found", { status: 400 });
  }

  const { id, name, entries } = await getBoard(externalId);

  return json({ id, name, entries });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const action = formData.get("_action");
  if (action === "upvote") {
    const entryId = Number(formData.get("entryId"));
    await upvoteEntry(entryId);
    return null;
  } else if (action === "downvote") {
    const entryId = Number(formData.get("entryId"));
    await downvoteEntry(entryId);
    return null;
  } else if (action === "createEntry") {
    const content = String(formData.get("content"));
    const boardId = Number(formData.get("boardId"));
    const columnId = Number(formData.get("columnId"));

    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await displayNameCookie.parse(cookieHeader)) || {};
    const displayName = String(
      cookie.displayName || ANONYMOUS_AUTHOR_DISPLAY_NAME
    );

    await createEntry(content, displayName, boardId, columnId);
    return null;
  }

  return null;
}

export default function Board() {
  const { id, name, entries } = useLoaderData<typeof loader>();

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
            boardId={id}
            id={column.columnId}
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
  id: number;
  boardId: number;
  name: string;
  entries: Entry[];
}
function Column({ id, boardId, name, entries }: ColumnProps) {
  const [isCreatingNewEntry, setIsCreatingNewEntry] = useState(false);

  return (
    <section className="w-80 flex-none">
      <h2 className="font-semibold text-xl mb-4">{name}</h2>
      <div className="flex flex-col space-y-2">
        {entries.map((entry) => (
          <Entry
            key={entry.id}
            id={entry.id}
            content={entry.content}
            authorDisplayName={entry.authorDisplayName}
            upvotes={entry.upvotes}
          />
        ))}
        {isCreatingNewEntry ? (
          <NewCardForm
            boardId={boardId}
            columnId={id}
            onComplete={() => setIsCreatingNewEntry(false)}
          />
        ) : (
          <NewCardButton onClick={() => setIsCreatingNewEntry(true)} />
        )}
      </div>
    </section>
  );
}

interface EntryProps {
  id: number;
  content: string;
  authorDisplayName: string;
  upvotes: number;
}
function Entry({ content, authorDisplayName, upvotes, id }: EntryProps) {
  const fetcher = useFetcher();

  const [isUpvoted, setIsUpvoted] = useState(false);
  const upvoteCount = fetcher.formData
    ? fetcher.formData.get("newUpvoteCount")
      ? Number(fetcher.formData.get("newUpvoteCount"))
      : upvotes
    : upvotes;

  function handleUpvote(e) {
    e.preventDefault();

    const newIsUpvoted = !isUpvoted;

    // Optimistic UI.
    // TODO: Handle retracting this upon failures on the DB side.
    setIsUpvoted(newIsUpvoted);

    if (newIsUpvoted) {
      fetcher.submit(
        { entryId: id, _action: "upvote", newUpvoteCount: upvotes + 1 },
        { method: "post" }
      );
    } else {
      fetcher.submit(
        { entryId: id, _action: "downvote", newUpvoteCount: upvotes - 1 },
        { method: "post" }
      );
    }
  }

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
        <form method="post" onSubmit={handleUpvote}>
          <button
            type="submit"
            className={`flex items-center space-x-1 px-2 py-1 -mr-2 rounded-full ${
              isUpvoted ? "text-purple-800" : "text-stone-400"
            } outline-none hover:bg-stone-200 focus:bg-stone-200`}
          >
            <UpArrowIcon />
            <span>{upvoteCount}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

interface NewCardButtonProps {
  onClick: () => void;
}
function NewCardButton({ onClick }: NewCardButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick()}
      className="flex justify-center items-center space-x-1 px-4 py-2 rounded-lg bg-stone-200 text-stone-900 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 transition"
    >
      <PlusIcon />
      <span>New Card</span>
    </button>
  );
}

interface NewCardFormProps {
  boardId: number;
  columnId: number;
  onComplete: () => void;
}
function NewCardForm({ boardId, columnId, onComplete }: NewCardFormProps) {
  const submit = useSubmit();

  const addButtonRef = useRef<HTMLButtonElement>(null);

  function handleNewCard(e) {
    e.preventDefault();

    // TODO: Honestly not sure why we can't use a fetcher, and call
    // fetcher.submit() here. I tried and tried, but couldn't invoke the action
    // function. Perhaps it has something to do with there being more than one
    // fetcher on this page? :shrug: Either way, this accomplishes the same
    // thing.
    submit(e.currentTarget);

    // Being able to call this function on form submission is the whole reason
    // we aren't using a fetcher.Form; we need a way to hook into the submission
    // process.
    onComplete();
  }

  return (
    <form
      method="post"
      onSubmit={handleNewCard}
      className="flex flex-col space-y-2"
    >
      <input type="hidden" name="_action" value="createEntry" />
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="columnId" value={columnId} />

      <textarea
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        name="content"
        onKeyDown={(e) => {
          // Shift + Enter should add a new line, not submit the form.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addButtonRef.current?.click();
          } else if (e.key === "Escape") {
            // Close the dialog, and show the "New Card" button again.
            onComplete();
          }
        }}
        className="w-full p-2 rounded-xl border-2 border-stone-200 outline-none"
      />
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => onComplete()}
          className="px-4 py-2 rounded-lg bg-stone-200 text-stone-900 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 transition"
        >
          Cancel
        </button>
        <button
          ref={addButtonRef}
          type="submit"
          className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 transition"
        >
          Add
        </button>
      </div>
    </form>
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
