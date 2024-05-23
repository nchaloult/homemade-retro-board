import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { createBoard } from "~/models/boards.server";

export async function action({ request }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors: any = {};

  const formData = await request.formData();

  const displayName = formData.get("displayName");
  if (displayName === null || displayName === "") {
    errors.displayName = "Display name must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  await createBoard(String(displayName)); // TODO: Revisit type casting here.
  return redirect("/boards");
}

export default function CreateBoard() {
  return (
    <main className="h-svh flex flex-col justify-center items-center">
      <Form method="post" className="w-1/3 min-w-80 flex flex-col space-y-2">
        <input
          type="text"
          name="displayName"
          placeholder="Display name"
          className="p-2 rounded-lg font-semibold border-2 border-stone-200 focus:outline-none focus:border-stone-400 transition"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-b-4 border-purple-950 hover:bg-purple-700 focus:outline-none focus:bg-purple-700 transition-all"
        >
          Create
        </button>
      </Form>
    </main>
  );
}