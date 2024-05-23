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

  const externalId = await createBoard(String(displayName)); // TODO: Revisit type casting here.
  return redirect(`/boards/${externalId}`);
}

export default function CreateBoard() {
  return (
    <div className="h-svh flex flex-col justify-center items-center space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Create New Board</h1>
      </header>
      <main className="w-1/3 min-w-80">
        <Form method="post" className="flex flex-col space-y-2">
          <input
            type="text"
            name="displayName"
            placeholder="Display name"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="p-2 rounded-lg font-semibold border-2 border-stone-200 outline-none focus:border-stone-400 transition"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 transition"
          >
            Create
          </button>
        </Form>
      </main>
    </div>
  );
}
