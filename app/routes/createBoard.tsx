import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { createBoard } from "~/queries.server";

export async function action({ request }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors: any = {};

  const formData = await request.formData();

  const name = String(formData.get("name"));
  if (name === null || name === "") {
    errors.name = "Display name must not be empty.";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors, name });
  }

  const externalId = await createBoard(name);
  return redirect(`/boards/${externalId}`);
}

export default function CreateBoard() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const isSubmitting = navigation.formAction === "/boards/create";

  return (
    <div className="h-svh flex flex-col justify-center items-center gap-8">
      <header>
        <h1 className="text-4xl font-bold">Create New Board</h1>
      </header>
      <main className="w-1/3 min-w-80">
        <Form method="post" className="flex flex-col gap-2">
          {actionData?.errors.name ? (
            <label htmlFor="name" className="ml-1 text-sm text-red-500">
              {actionData.errors.name}
            </label>
          ) : null}
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={actionData?.name}
            placeholder="Name"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="p-2 rounded-lg font-semibold border-2 border-stone-200 outline-none dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400 transition"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none dark:bg-purple-600 dark:border-purple-900 dark:shadow-[rgb(88_28_135)_0_4px] hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 dark:hover:bg-purple-500 dark:hover:shadow-[rgb(88_28_135)_0_8px] focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 dark:focus:bg-purple-500 dark:focus:shadow-[rgb(88_28_135)_0_8px] active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(88_28_135)_0_4px] disabled:translate-y-0 disabled:bg-stone-200 disabled:text-stone-900 disabled:border-stone-300 disabled:shadow-[rgb(214_211_209)_0_4px] transition"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </Form>
      </main>
    </div>
  );
}
