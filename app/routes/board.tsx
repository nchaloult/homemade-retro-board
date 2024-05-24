import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
      <header className="mb-8">
        <h1 className="font-bold text-4xl">{name}</h1>
      </header>
      <main>
        <p>{JSON.stringify(entries)}</p>
      </main>
    </div>
  );
}
