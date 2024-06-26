import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import { getDisplayName } from "~/displayNameCookie.server";
import { emitter } from "~/emitter.server";
import {
  ClipboardIcon,
  EditIcon,
  PlusIcon,
  SortIcon,
  UpArrowIcon,
} from "~/icons";
import type { Entry } from "~/queries.server";
import {
  createColumn,
  createEntry,
  downvoteEntry,
  getBoard,
  sortColumn,
  updateColumn,
  updateEntry,
  upvoteEntry,
} from "~/queries.server";
import { useEventSource } from "remix-utils/sse/react";

const ANONYMOUS_AUTHOR_DISPLAY_NAME = "Anonymous";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const externalId = params.externalId;
  if (externalId === undefined || externalId.length === 0) {
    throw new Response("Board ID not found", { status: 400 });
  }

  const { id, name, entries } = await getBoard(externalId);
  const displayName =
    (await getDisplayName(request)) || ANONYMOUS_AUTHOR_DISPLAY_NAME;

  return json({ displayName, id, externalId, name, entries });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const action = formData.get("_action");
  if (action === "upvote") {
    const entryId = Number(formData.get("entryId"));
    await upvoteEntry(entryId);
  } else if (action === "downvote") {
    const entryId = Number(formData.get("entryId"));
    await downvoteEntry(entryId);
  } else if (action === "sort") {
    const columnId = Number(formData.get("columnId"));
    await sortColumn(columnId);
  } else if (action === "createColumn") {
    const name = String(formData.get("name"));
    const boardId = Number(formData.get("boardId"));
    const order = Number(formData.get("order"));
    await createColumn(name, boardId, order);
  } else if (action === "createEntry") {
    let gifUrl: string | undefined = String(formData.get("gifUrl"));
    if (gifUrl === "") {
      gifUrl = undefined;
    }
    const content = String(formData.get("content"));
    const boardId = Number(formData.get("boardId"));
    const columnId = Number(formData.get("columnId"));
    const order = Number(formData.get("order"));

    const displayName =
      (await getDisplayName(request)) || ANONYMOUS_AUTHOR_DISPLAY_NAME;

    await createEntry(gifUrl, content, displayName, boardId, columnId, order);
  } else if (action === "updateEntry") {
    let newGifUrl: string | undefined = String(formData.get("gifUrl"));
    if (newGifUrl === "") {
      newGifUrl = undefined;
    }
    const newContent = String(formData.get("content"));
    const entryId = Number(formData.get("entryId"));

    await updateEntry(entryId, newContent, newGifUrl);
  } else if (action === "updateColumn") {
    const newName = String(formData.get("name"));
    const columnId = Number(formData.get("id"));

    await updateColumn(columnId, newName);
  }

  // This will technically be fired even if the _action field's value isn't
  // equal to any of the ones we handle above. That's alright, though — all that
  // will happen is every tab will call the GET /boards/:externalId endpoint
  // again.
  emitter.emit("boardUpdate");

  return null;
}

export default function Board() {
  const { displayName, id, externalId, name, entries } =
    useLoaderData<typeof loader>();

  const fetcher = useFetcher();

  const [isCreatingNewColumn, setIsCreatingNewColumn] = useState(false);
  const [hasCopiedBoardID, setHasCopiedBoardID] = useState(false);

  const newColumnOrder =
    entries.length === 0 ? 0 : entries[entries.length - 1].columnOrder + 1;

  const revalidator = useRevalidator();
  const lastEntryId = useEventSource(`/boards/${id}/subscribe`, {
    event: "board-update",
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => revalidator.revalidate(), [lastEntryId]);

  async function handleBoardIDCopyClick() {
    await navigator.clipboard.writeText(externalId);

    setHasCopiedBoardID(true);
    setTimeout(() => setHasCopiedBoardID(false), 3000);
  }

  function createNewColumnOnComplete() {
    setIsCreatingNewColumn(false);
  }

  function handleCreateNewColumn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    fetcher.submit(e.currentTarget, { method: "post" });

    createNewColumnOnComplete();
  }

  return (
    <div className="flex flex-col grow px-12 pt-8 pb-12">
      {/* mb-6, not mb-8, since the <main> tag has padding on the top (and bottom,
      but that's not important) of 2. */}
      <header className="flex flex-col gap-1 mb-6">
        <h1 className="font-bold text-4xl">{name}</h1>
        <button
          disabled={hasCopiedBoardID}
          onClick={() => handleBoardIDCopyClick()}
          className={`w-fit flex items-center gap-2 px-3 py-1 -ml-3 rounded-full font-semibold ${
            hasCopiedBoardID
              ? "text-purple-800 dark:text-purple-600"
              : "text-stone-400"
          } outline-none hover:bg-stone-200 dark:hover:bg-stone-700 focus:bg-stone-200 dark:focus:bg-stone-700`}
        >
          <ClipboardIcon isCopied={hasCopiedBoardID} />
          Board ID: {externalId}
        </button>
      </header>
      {/* Need this vertical padding to offset the weird clipping that happens when
      we add overflow-x-auto. */}
      <main className="w-full py-2 flex gap-4 overflow-x-auto grow">
        {entries.map((column) => (
          <Column
            key={column.columnId}
            displayName={displayName}
            boardId={id}
            id={column.columnId}
            name={column.columnName}
            entries={column.entries}
            newEntryOrder={
              column.entries.length === 0
                ? 0
                : column.entries[column.entries.length - 1].order + 1
            }
          />
        ))}

        {fetcher.state === "submitting" ||
        Number(fetcher.formData?.get("order")) === newColumnOrder ? (
          <Column
            displayName={displayName}
            boardId={Number(fetcher.formData?.get("boardId"))}
            id={42060420} // Dummy ID since it'll never be used.
            name={String(fetcher.formData?.get("name"))}
            entries={[]}
            newEntryOrder={1}
          />
        ) : null}

        {isCreatingNewColumn ? (
          <ColumnForm
            boardId={id}
            newColumnOrder={newColumnOrder}
            handleSubmit={handleCreateNewColumn}
            onComplete={() => createNewColumnOnComplete()}
          />
        ) : (
          <NewColumnButton onClick={() => setIsCreatingNewColumn(true)} />
        )}
      </main>
    </div>
  );
}

interface ColumnProps {
  id: number;
  displayName: string;
  boardId: number;
  name: string;
  entries: Entry[];
  newEntryOrder: number;
}
function Column({
  id,
  displayName,
  boardId,
  name,
  entries,
  newEntryOrder,
}: ColumnProps) {
  const fetcher = useFetcher();
  const [isCreatingNewEntry, setIsCreatingNewEntry] = useState(false);

  function handleSortFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    fetcher.submit({ columnId: id, _action: "sort" }, { method: "post" });
  }

  function createNewEntryOnComplete() {
    setIsCreatingNewEntry(false);
  }

  function handleCreateNewEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    fetcher.submit(e.currentTarget, { method: "post" });

    createNewEntryOnComplete();
  }

  const [isEditButtonVisible, setIsEditButtonVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function updateColumnOnComplete() {
    setIsEditing(false);
  }

  function handleUpdateColumn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    fetcher.submit(e.currentTarget, { method: "post" });

    updateColumnOnComplete();
  }

  let columnHead;
  if (isEditing) {
    columnHead = (
      <ColumnForm
        boardId={boardId}
        id={id}
        handleSubmit={handleUpdateColumn}
        onComplete={() => updateColumnOnComplete()}
        currentName={name}
      />
    );
  } else {
    columnHead = (
      <form
        method="post"
        onSubmit={handleSortFormSubmit}
        className="flex justify-between space-x-2"
      >
        <div
          className="w-full flex items-start"
          onMouseEnter={() => setIsEditButtonVisible(true)}
          onMouseLeave={() => setIsEditButtonVisible(false)}
        >
          <h2 className="flex grow font-semibold text-xl mb-4">
            {/* Optimistic UI. */}
            {Number(fetcher.formData?.get("id")) === id
              ? String(fetcher.formData?.get("name"))
              : name}
          </h2>
          {isEditButtonVisible ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center p-2 rounded-full text-stone-400 outline-none hover:bg-stone-200 dark:hover:bg-stone-700"
            >
              <EditIcon />
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          className="h-min flex justify-center items-center gap-1 p-1 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none dark:bg-stone-600 dark:border-stone-700 dark:shadow-[rgb(68_64_60)_0_4px] hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[rgb(68_64_60)_0_8px] active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(68_64_60)_0_4px] transition"
        >
          <SortIcon />
        </button>
      </form>
    );
  }

  return (
    <section className="w-80 flex-none">
      {columnHead}
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <Entry
            key={entry.id}
            id={entry.id}
            gifUrl={entry.gifUrl}
            content={entry.content}
            authorDisplayName={entry.authorDisplayName}
            upvotes={entry.upvotes}
            boardId={boardId}
            columnId={id}
          />
        ))}

        {fetcher.state === "submitting" ||
        (Number(fetcher.formData?.get("columnId")) === id &&
          Number(fetcher.formData?.get("order")) === newEntryOrder) ? (
          <Entry
            id={42069420} // Dummy ID since it'll never be used.
            gifUrl={String(fetcher.formData?.get("gifUrl")) || undefined}
            content={String(fetcher.formData?.get("content"))}
            authorDisplayName={displayName}
            upvotes={Number(fetcher.formData?.get("upvotes"))}
            boardId={boardId}
            columnId={id}
          />
        ) : null}

        {isCreatingNewEntry ? (
          <CardForm
            boardId={boardId}
            columnId={id}
            order={newEntryOrder}
            handleSubmit={handleCreateNewEntry}
            onComplete={() => createNewEntryOnComplete()}
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
  gifUrl?: string;
  content: string;
  authorDisplayName: string;
  upvotes: number;
  boardId: number;
  columnId: number;
}
function Entry({
  id,
  gifUrl,
  content,
  authorDisplayName,
  upvotes,
  boardId,
  columnId,
}: EntryProps) {
  const fetcher = useFetcher();

  const [isUpvoted, setIsUpvoted] = useState(false);
  const upvoteCount = fetcher.formData
    ? fetcher.formData.get("newUpvoteCount")
      ? Number(fetcher.formData.get("newUpvoteCount"))
      : upvotes
    : upvotes;

  function handleUpvote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newIsUpvoted = !isUpvoted;

    // Optimistic UI.
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

  const [isEditButtonVisible, setIsEditButtonVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function editEntryOnComplete() {
    setIsEditing(false);
  }

  function handleEditEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    fetcher.submit(e.currentTarget, { method: "post" });

    editEntryOnComplete();
  }

  if (isEditing) {
    return (
      <CardForm
        boardId={boardId}
        columnId={columnId}
        handleSubmit={handleEditEntry}
        onComplete={() => editEntryOnComplete()}
        entryId={id}
        currentContent={content}
        currentGifUrl={gifUrl}
      />
    );
  }
  return (
    <div
      className={
        "overflow-hidden rounded-xl bg-white border-2 border-stone-200 outline-none dark:bg-stone-600 dark:border-stone-700 transition"
      }
      onMouseEnter={() => setIsEditButtonVisible(true)}
      onMouseLeave={() => setIsEditButtonVisible(false)}
    >
      <div className="flex flex-col gap-2 p-2">
        {gifUrl !== undefined ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={gifUrl}
            alt="User-provided GIF or image URL"
            className="w-full rounded-lg"
          />
        ) : null}
        <p className="whitespace-pre-line">
          {String(fetcher.formData?.get("_action")) !== "upvote" &&
          String(fetcher.formData?.get("_action")) !== "downvote" &&
          Number(fetcher.formData?.get("entryId")) === id
            ? String(fetcher.formData?.get("content"))
            : content}
        </p>
      </div>
      <hr className="h-0.5 bg-stone-200 border-0 rounded dark:bg-stone-700" />
      <div className="flex justify-between items-center px-2 py-1 bg-stone-100 text-stone-400 dark:bg-[#3a3632]">
        <span>{authorDisplayName}</span>
        <div className="flex items-center">
          {isEditButtonVisible ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-0.5 p-2 rounded-full outline-none hover:bg-stone-200 dark:hover:bg-stone-600"
            >
              <EditIcon />
            </button>
          ) : null}
          <form method="post" onSubmit={handleUpvote}>
            <button
              type="submit"
              className={`flex items-center gap-0.5 px-2 py-1 -mr-1.5 rounded-full ${
                isUpvoted ? "text-purple-800 dark:text-purple-600" : ""
              } outline-none hover:bg-stone-200 dark:hover:bg-stone-600`}
            >
              <UpArrowIcon />
              <span>{upvoteCount}</span>
            </button>
          </form>
        </div>
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
      className="flex justify-center items-center gap-1 px-4 py-2 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none dark:bg-stone-600 dark:border-stone-700 dark:shadow-[rgb(68_64_60)_0_4px] hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[rgb(68_64_60)_0_8px] focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 dark:focus:bg-stone-500 dark:focus:shadow-[rgb(68_64_60)_0_8px] active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(68_64_60)_0_4px] transition"
    >
      <PlusIcon />
      <span>New Card</span>
    </button>
  );
}

interface ColumnFormProps {
  boardId: number;
  newColumnOrder?: number;
  handleSubmit: FormEventHandler<HTMLFormElement>;
  onComplete: () => void;

  // The following exist if we're editing, and don't if we're creating a new entry.
  id?: number;
  currentName?: string;
}
function ColumnForm({
  boardId,
  newColumnOrder,
  handleSubmit,
  onComplete,
  id,
  currentName,
}: ColumnFormProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isEditingExistingColumn = id !== undefined;

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      className="flex flex-col flex-none gap-2 w-80 mb-3"
    >
      {isEditingExistingColumn ? (
        <input type="hidden" name="_action" value="updateColumn" />
      ) : (
        <input type="hidden" name="_action" value="createColumn" />
      )}

      <input type="hidden" name="boardId" value={boardId} />

      {isEditingExistingColumn ? (
        <input type="hidden" name="id" value={id} />
      ) : null}
      {!isEditingExistingColumn ? (
        <input type="hidden" name="order" value={newColumnOrder} />
      ) : null}

      <input
        type="text"
        name="name"
        placeholder="Name"
        defaultValue={currentName || ""}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onKeyDown={(e) => {
          // Shift + Enter should add a new line, not submit the form.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            buttonRef.current?.click();
          } else if (e.key === "Escape") {
            // Close the dialog, and show the "New Card" button again.
            onComplete();
          }
        }}
        className="w-full p-2 rounded-xl font-semibold border-2 border-stone-200 outline-none placeholder:italic dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400"
      />
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => onComplete()}
          className="px-4 py-2 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none dark:bg-stone-600 dark:border-stone-700 dark:shadow-[rgb(68_64_60)_0_4px] hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[rgb(68_64_60)_0_8px] focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 dark:focus:bg-stone-500 dark:focus:shadow-[rgb(68_64_60)_0_8px] active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(68_64_60)_0_4px] transition"
        >
          Cancel
        </button>
        <button
          ref={buttonRef}
          type="submit"
          className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none dark:bg-purple-600 dark:border-purple-900 dark:shadow-[rgb(88_28_135)_0_4px] hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 dark:hover:bg-purple-500 dark:hover:shadow-[rgb(88_28_135)_0_8px] focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 dark:focus:bg-purple-500 dark:focus:shadow-[rgb(88_28_135)_0_8px] active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(88_28_135)_0_4px] transition"
        >
          {isEditingExistingColumn ? "Edit" : "Add"}
        </button>
      </div>
    </form>
  );
}

interface CardFormProps {
  boardId: number;
  columnId: number;
  order?: number;

  handleSubmit: FormEventHandler<HTMLFormElement>;
  onComplete: () => void;

  // The following exist if we're editing, and don't if we're creating a new entry.
  entryId?: number;
  currentContent?: string;
  currentGifUrl?: string;
}
function CardForm({
  boardId,
  columnId,
  order,
  handleSubmit,
  onComplete,
  entryId,
  currentContent,
  currentGifUrl,
}: CardFormProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [gifUrl, setGifUrl] = useState(currentGifUrl || "");
  const [displayedGifUrl, setDisplayedGifUrl] = useState(currentGifUrl || "");

  const isEditingExistingEntry = entryId !== undefined;

  useEffect(() => {
    const timeout = setTimeout(() => setDisplayedGifUrl(gifUrl), 500);
    return () => clearTimeout(timeout);
  }, [gifUrl]);

  function moveCaretToTheEnd(e: React.FocusEvent<HTMLTextAreaElement>) {
    // Clear out the value, then paste it back in as if the user typed it all
    // out again themselves. This is what "moves" the caret to the end of the
    // textarea's content.
    const temp = e.target.value;
    e.target.value = "";
    e.target.value = temp;

    // Scroll the textarea box down to the bottom.
    e.target.scrollTop = e.target.scrollHeight;
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 mb-1"
    >
      {isEditingExistingEntry ? (
        <input type="hidden" name="_action" value="updateEntry" />
      ) : (
        <input type="hidden" name="_action" value="createEntry" />
      )}

      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="columnId" value={columnId} />

      {isEditingExistingEntry ? (
        <input type="hidden" name="entryId" value={entryId} />
      ) : null}
      {!isEditingExistingEntry ? (
        <input type="hidden" name="order" value={order} />
      ) : null}

      <input
        type="url"
        placeholder="Optional: GIF or image URL"
        name="gifUrl"
        defaultValue={gifUrl}
        onChange={(e) => setGifUrl(e.target.value)}
        className="w-full p-2 rounded-xl border-2 border-stone-200 outline-none placeholder:italic dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400"
      />

      <div className="flex flex-col gap-2 w-full p-2 rounded-xl bg-white border-2 border-stone-200 dark:bg-stone-700 dark:border-stone-600 focus-within:border-stone-400">
        {displayedGifUrl !== "" ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={displayedGifUrl}
            alt="User-provided GIF or image URL"
            className="w-full rounded-lg"
          />
        ) : null}
        <textarea
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onFocus={moveCaretToTheEnd}
          name="content"
          defaultValue={currentContent || ""}
          placeholder="Content"
          onKeyDown={(e) => {
            // Shift + Enter should add a new line, not submit the form.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              buttonRef.current?.click();
            } else if (e.key === "Escape") {
              // Close the dialog, and show the "New Card" button again.
              onComplete();
            }
          }}
          className="w-full outline-none placeholder:italic dark:bg-stone-700 dark:placeholder:text-stone-400"
        />
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => onComplete()}
          className="px-4 py-2 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none dark:bg-stone-600 dark:border-stone-700 dark:shadow-[rgb(68_64_60)_0_4px] hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[rgb(68_64_60)_0_8px] focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 dark:focus:bg-stone-500 dark:focus:shadow-[rgb(68_64_60)_0_8px] active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(68_64_60)_0_4px] transition"
        >
          Cancel
        </button>
        <button
          ref={buttonRef}
          type="submit"
          className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none dark:bg-purple-600 dark:border-purple-900 dark:shadow-[rgb(88_28_135)_0_4px] hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 dark:hover:bg-purple-500 dark:hover:shadow-[rgb(88_28_135)_0_8px] focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 dark:focus:bg-purple-500 dark:focus:shadow-[rgb(88_28_135)_0_8px] active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(88_28_135)_0_4px] transition"
        >
          {entryId ? "Edit" : "Add"}
        </button>
      </div>
    </form>
  );
}

interface NewColumnButtonProps {
  onClick: () => void;
}
function NewColumnButton({ onClick }: NewColumnButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick()}
      className="w-42 h-32 flex flex-none justify-center items-center gap-1 px-4 py-2 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none dark:bg-stone-600 dark:border-stone-700 dark:shadow-[rgb(68_64_60)_0_4px] hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[rgb(68_64_60)_0_8px] focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 dark:focus:bg-stone-500 dark:focus:shadow-[rgb(68_64_60)_0_8px] active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(68_64_60)_0_4px] transition"
    >
      <PlusIcon />
      <span>New Column</span>
    </button>
  );
}
