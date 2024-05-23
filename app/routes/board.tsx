import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getBoard } from "~/models/boards.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const externalId = params.externalId;
  if (externalId === undefined || externalId.length === 0) {
    throw new Response("Board ID not found", { status: 400 });
  }

  const { displayName, entries } = await getBoard(externalId);

  return json({ displayName, entries });
}

export default function Board() {
  const { displayName, entries } = useLoaderData<typeof loader>();

  return (
    <div className="p-12">
      <header className="mb-8">
        <h1 className="font-bold text-4xl">{displayName}</h1>
      </header>
      <main>
        <p>{JSON.stringify(entries)}</p>
      </main>
    </div>
  );
}
